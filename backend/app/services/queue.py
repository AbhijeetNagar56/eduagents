from datetime import datetime, timezone
import time
from typing import Optional
from app.core.config import settings
from app.core.logging import logger
from app.models.common import JobStatus, ProcessingStep
from app.models.job import GradingJob, JobProcessItemResult, BatchProcessResult
from app.services.repository import Repository
from app.services.realtime import RealtimeService
from app.services.storage import StorageService
from app.ai.pipeline import run_evaluation_pipeline
from app.ai.extract import RateLimitException


class QueueService:
    @staticmethod
    def enqueue_submission(submission_id: str) -> GradingJob:
        job_id = f"job-{int(time.time() * 1000) % 100000}"
        job = GradingJob(
            id=job_id,
            submissionId=submission_id,
            status=JobStatus.PENDING,
            retryCount=0,
            startedAt=None,
            completedAt=None,
        )
        Repository.save_job(job)
        logger.info(f"Enqueued grading job {job.id} for submission {submission_id}")
        return job

    @staticmethod
    async def process_batch(batch_size: int = 10) -> BatchProcessResult:
        """
        Drains up to batch_size pending jobs from the queue, evaluates them with the Gemini AI pipeline,
        persists evaluation results, and emits Realtime events.
        """
        batch_size = max(1, min(batch_size, 25))
        pending_jobs = Repository.get_pending_grading_jobs(limit=batch_size)

        succeeded = 0
        failed = 0
        retried = 0
        job_results = []

        for job in pending_jobs:
            start_job_time = time.time()
            sub = Repository.get_submission_by_id(job.submissionId)
            if not sub:
                job.status = JobStatus.FAILED
                job.errorLog = f"Submission {job.submissionId} not found."
                Repository.save_job(job)
                failed += 1
                job_results.append(
                    JobProcessItemResult(
                        jobId=job.id,
                        submissionId=job.submissionId,
                        status="failed",
                        error="Submission not found",
                    )
                )
                continue

            # Lock job
            job.status = JobStatus.PROCESSING
            job.startedAt = datetime.now(timezone.utc).isoformat()
            Repository.save_job(job)

            # Update submission
            sub.status = JobStatus.PROCESSING
            sub.processingStep = ProcessingStep.EXTRACTING
            Repository.save_submission(sub)

            try:
                # Retrieve rubric
                rubric = Repository.get_rubric_by_id(sub.rubricId)
                if not rubric:
                    rubrics = Repository.get_rubrics()
                    rubric = rubrics[0] if rubrics else None

                if not rubric:
                    raise Exception(f"Rubric {sub.rubricId} not found and no default available.")

                # Retrieve raw content
                raw_content = StorageService.get_submission_text(sub.id, sub.fileName, sub.contentPreview)

                # Update step to grading
                sub.processingStep = ProcessingStep.GRADING
                Repository.save_submission(sub)

                # Run two-step AI pipeline
                eval_result, duration_ms = await run_evaluation_pipeline(sub, rubric, raw_content)

                # Save evaluation
                sub.status = JobStatus.DONE
                sub.processingStep = ProcessingStep.SYNCED
                sub.evaluation = eval_result
                Repository.save_submission(sub)

                # Mark job completed
                job.status = JobStatus.DONE
                job.completedAt = datetime.now(timezone.utc).isoformat()
                Repository.save_job(job)

                succeeded += 1
                job_results.append(
                    JobProcessItemResult(
                        jobId=job.id,
                        submissionId=sub.id,
                        status="done",
                        score=eval_result.score,
                        durationMs=duration_ms,
                    )
                )

                # Broadcast Realtime update
                await RealtimeService.broadcast_submission_update(
                    submission_id=sub.id,
                    status="done",
                    processing_step="synced",
                    score=eval_result.score,
                    max_score=eval_result.maxScore,
                    course_code=sub.courseCode,
                )

            except RateLimitException as rle:
                # Rate limit handling: do NOT mark failed; increment retryCount and reset to pending
                logger.warning(f"Rate limited while processing job {job.id}: {rle}")
                job.retryCount += 1
                job.status = JobStatus.PENDING
                job.errorLog = f"Rate limited: {str(rle)}"
                Repository.save_job(job)

                sub.status = JobStatus.PENDING
                sub.processingStep = ProcessingStep.QUEUED
                Repository.save_submission(sub)

                retried += 1
                job_results.append(
                    JobProcessItemResult(
                        jobId=job.id,
                        submissionId=sub.id,
                        status="pending",
                        error="Rate limited. Retrying on next iteration.",
                    )
                )

            except Exception as e:
                logger.error(f"Error processing job {job.id} for submission {sub.id}: {e}")
                job.status = JobStatus.FAILED
                job.errorLog = str(e)
                job.completedAt = datetime.now(timezone.utc).isoformat()
                Repository.save_job(job)

                sub.status = JobStatus.FLAGGED
                sub.processingStep = None
                Repository.save_submission(sub)

                failed += 1
                job_results.append(
                    JobProcessItemResult(
                        jobId=job.id,
                        submissionId=sub.id,
                        status="flagged",
                        error=str(e),
                    )
                )

        return BatchProcessResult(
            processedCount=len(pending_jobs),
            succeededCount=succeeded,
            failedCount=failed,
            retriedCount=retried,
            jobs=job_results,
        )
