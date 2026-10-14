import copy
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from app.core.logging import logger
from app.models.common import JobStatus, ProcessingStep
from app.models.evaluation import EvaluationResult, FacultyOverride
from app.models.health import QueueStats
from app.models.job import GradingJob
from app.models.rubric import Rubric, RubricCriterion, RubricUpdate
from app.models.submission import Submission
from app.services.supabase_client import get_supabase_client, is_supabase_configured

# Initial Seed Rubrics matching docs/api.md and frontend mock-data
SEED_RUBRICS: List[Rubric] = [
    Rubric(
        id="rubric-1",
        courseCode="CS101",
        assignmentTitle="Assignment 1: Sorting Algorithms & Complexity",
        description="Evaluation criteria for empirical sorting analysis and time complexity justifications.",
        totalPoints=100.0,
        createdAt="2026-10-01",
        criteria=[
            RubricCriterion(
                id="crit-1",
                title="Algorithm Correctness & Implementation",
                description="Implements QuickSort, MergeSort, and HeapSort correctly with optimal boundary handling.",
                maxPoints=35.0,
            ),
            RubricCriterion(
                id="crit-2",
                title="Theoretical Time & Space Complexity",
                description="Rigorous Big-O derivation for best, average, and worst-case scenarios.",
                maxPoints=25.0,
            ),
            RubricCriterion(
                id="crit-3",
                title="Empirical Benchmark Analysis",
                description="Plots runtime against input array sizes (N=10^3 to 10^6) with standard deviations.",
                maxPoints=25.0,
            ),
            RubricCriterion(
                id="crit-4",
                title="Code Clarity & Documentation",
                description="Clean coding style, meaningful identifiers, and markdown formatting.",
                maxPoints=15.0,
            ),
        ],
    ),
    Rubric(
        id="rubric-2",
        courseCode="CS101",
        assignmentTitle="Assignment 2: Graph Traversal & Dijkstra",
        description="Assessment of shortest-path algorithm correctness and priority queue usage.",
        totalPoints=100.0,
        createdAt="2026-10-02",
        criteria=[
            RubricCriterion(
                id="crit-2-1",
                title="Graph Representation & Min-Heap Heapify",
                description="Adjacency list representation and binary heap priority queue usage.",
                maxPoints=40.0,
            ),
            RubricCriterion(
                id="crit-2-2",
                title="Dijkstra Implementation & Edge-case Handling",
                description="Properly ignores negative cycles and disconnect components.",
                maxPoints=35.0,
            ),
            RubricCriterion(
                id="crit-2-3",
                title="Complexity Discussion & Code Style",
                description="O((V+E)log V) proof and modular code organization.",
                maxPoints=25.0,
            ),
        ],
    ),
    Rubric(
        id="rubric-3",
        courseCode="AI301",
        assignmentTitle="Lab 3: Gradient Descent Optimization Report",
        description="Analysis of SGD, Momentum, and Adam optimizers on non-convex surfaces.",
        totalPoints=100.0,
        createdAt="2026-10-03",
        criteria=[
            RubricCriterion(
                id="crit-3-1",
                title="Mathematical Derivation of Gradients",
                description="Accurate analytical gradients and partial derivative chains.",
                maxPoints=30.0,
            ),
            RubricCriterion(
                id="crit-3-2",
                title="Comparative Convergence Experiments",
                description="Loss curve comparisons and hyperparameter sensitivity grids.",
                maxPoints=40.0,
            ),
            RubricCriterion(
                id="crit-3-3",
                title="Pedagogical Synthesis & Conclusions",
                description="Insightful discussion of saddle points and local minima traps.",
                maxPoints=30.0,
            ),
        ],
    ),
]

SEED_SUBMISSIONS: List[Submission] = [
    Submission(
        id="sub-101",
        studentId="STU-2024-089",
        studentName="Alex Rivera",
        studentEmail="alex.rivera@university.edu",
        assignmentId="assign-1",
        assignmentTitle="Assignment 1: Sorting Algorithms & Complexity",
        courseCode="CS101",
        fileName="alex_rivera_sorting_analysis.pdf",
        fileSize="1.4 MB",
        fileType="pdf",
        status=JobStatus.DONE,
        submittedAt="2026-10-07 14:22",
        rubricId="rubric-1",
        contentPreview="Comparative Analysis of Quicksort (Dual-Pivot) and Mergesort on Random vs Nearly Sorted Datasets. Includes Big-O proofs, empirical runtime tables, and memory profiling.",
        evaluation=EvaluationResult(
            score=92.0,
            maxScore=100.0,
            percentage=92.0,
            summaryFeedback="Exceptional submission demonstrating deep comprehension of algorithmic trade-offs. The empirical benchmarking confirms theoretical predictions with high experimental precision.",
            strengths=[
                "Robust dual-pivot quicksort implementation with recursion depth guard",
                "High-quality statistical plots with confidence intervals across multiple trials",
                "Master theorem and recurrence relations clearly articulated",
            ],
            improvements=[
                "Optimize memory reuse for auxiliary mergesort buffer",
                "Add memory profiling graphs alongside CPU execution times",
            ],
            aiModelExtraction="Gemini Flash-Lite",
            aiModelGrading="Gemini Flash",
            evaluatedAt="2026-10-07 14:24",
            criteriaScores=[
                {
                    "criterionId": "crit-1",
                    "title": "Algorithm Correctness & Implementation",
                    "scoreAwarded": 33.0,
                    "maxPoints": 35.0,
                    "feedback": "Dual-pivot partition algorithm implemented with high fidelity. QuickSort recursion depth limit guard correctly implemented.",
                    "strengths": "Excellent edge-case defense against adversarial quadratic inputs.",
                    "improvements": "MergeSort buffer allocation could be reused between recursive calls to reduce GC churn.",
                },
                {
                    "criterionId": "crit-2",
                    "title": "Theoretical Time & Space Complexity",
                    "scoreAwarded": 24.0,
                    "maxPoints": 25.0,
                    "feedback": "Rigorous master theorem application for mergesort. Clear explanation of random pivot expectation.",
                    "strengths": "Clear recurrences with step-by-step substitution method.",
                    "improvements": "Minor omission in space complexity analysis of auxiliary stack frames for worst-case quicksort.",
                },
                {
                    "criterionId": "crit-3",
                    "title": "Empirical Benchmark Analysis",
                    "scoreAwarded": 22.0,
                    "maxPoints": 25.0,
                    "feedback": "Runtime plots clearly distinguish O(N log N) from O(N^2) behavior on sorted arrays.",
                    "strengths": "Clean matplotlib visualizations with error bars across 10 trials.",
                    "improvements": "Include cache miss telemetry or perf counters for deeper hardware-level analysis.",
                },
                {
                    "criterionId": "crit-4",
                    "title": "Code Clarity & Documentation",
                    "scoreAwarded": 13.0,
                    "maxPoints": 15.0,
                    "feedback": "Extremely clean code formatting, well-commented helper functions.",
                    "strengths": "Follows PEP 8 / Google Style guide conventions.",
                    "improvements": "Docstrings could clarify type constraints on generic sorting comparator.",
                },
            ],
        ),
    ),
    Submission(
        id="sub-102",
        studentId="STU-2024-114",
        studentName="Samantha Chen",
        studentEmail="s.chen@university.edu",
        assignmentId="assign-1",
        assignmentTitle="Assignment 1: Sorting Algorithms & Complexity",
        courseCode="CS101",
        fileName="chen_samantha_report.md",
        fileSize="420 KB",
        fileType="markdown",
        status=JobStatus.DONE,
        submittedAt="2026-10-07 16:05",
        rubricId="rubric-1",
        contentPreview="Sorting Benchmarking Report in Markdown format. Explores QuickSort, MergeSort, and TimSort behavior on sorted, reverse sorted, and uniformly distributed integer arrays.",
        evaluation=EvaluationResult(
            score=84.0,
            maxScore=100.0,
            percentage=84.0,
            summaryFeedback="Good solid work covering all essential requirements. To achieve full marks, provide mathematical proofs rather than only stating asymptotic bounds.",
            strengths=[
                "Clean markdown layout with formatted tables",
                "Well-tested sorting routines with verified outputs",
            ],
            improvements=[
                "Add visual benchmark plots",
                "Strengthen average-case proof using indicator random variables",
            ],
            aiModelExtraction="Gemini Flash-Lite",
            aiModelGrading="Gemini Flash",
            evaluatedAt="2026-10-07 16:07",
            criteriaScores=[
                {
                    "criterionId": "crit-1",
                    "title": "Algorithm Correctness & Implementation",
                    "scoreAwarded": 30.0,
                    "maxPoints": 35.0,
                    "feedback": "Standard Lomuto partitioning used. Works as expected for average case.",
                    "strengths": "Accurate base cases and clean recursion.",
                    "improvements": "Lomuto partition degenerates to O(N^2) on identical element arrays; Hoare partition would be more resilient.",
                },
                {
                    "criterionId": "crit-2",
                    "title": "Theoretical Time & Space Complexity",
                    "scoreAwarded": 20.0,
                    "maxPoints": 25.0,
                    "feedback": "Good overview of Big-O notations, but lacks formal mathematical proof for average case.",
                    "strengths": "Accurate asymptotic notation descriptions.",
                    "improvements": "Provide formal expectation derivation using indicator random variables.",
                },
                {
                    "criterionId": "crit-3",
                    "title": "Empirical Benchmark Analysis",
                    "scoreAwarded": 22.0,
                    "maxPoints": 25.0,
                    "feedback": "Tabular data provided for N up to 500,000.",
                    "strengths": "Accurate timing measurements in milliseconds.",
                    "improvements": "Visual graphs would make the crossover points between QuickSort and MergeSort much clearer.",
                },
                {
                    "criterionId": "crit-4",
                    "title": "Code Clarity & Documentation",
                    "scoreAwarded": 12.0,
                    "maxPoints": 15.0,
                    "feedback": "Clean Markdown formatting with syntax-highlighted code fences.",
                    "strengths": "Easy to read and navigate.",
                    "improvements": "Add inline commentary for the merge loop indices.",
                },
            ],
        ),
        override=FacultyOverride(
            isOverridden=True,
            originalScore=84.0,
            overriddenScore=89.0,
            overriddenBy="Dr. Sarah Lin",
            overrideReason="Student included an insightful handwritten proof in the appendix that the extraction stage partially omitted. Adjusted Theoretical Complexity from 20 to 25.",
            overriddenAt="2026-10-07 18:30",
            criterionAdjustments={"crit-2": 25.0},
        ),
    ),
    Submission(
        id="sub-103",
        studentId="STU-2024-042",
        studentName="Marcus Brody",
        studentEmail="m.brody@university.edu",
        assignmentId="assign-3",
        assignmentTitle="Lab 3: Gradient Descent Optimization Report",
        courseCode="AI301",
        fileName="brody_sgd_optimization.pdf",
        fileSize="3.1 MB",
        fileType="pdf",
        status=JobStatus.PROCESSING,
        processingStep=ProcessingStep.GRADING,
        submittedAt="2026-10-08 21:10",
        rubricId="rubric-3",
        contentPreview="Experimental study comparing Mini-batch SGD with Adam and RMSprop on Rosenbrock and Rastrigin test functions.",
    ),
    Submission(
        id="sub-104",
        studentId="STU-2024-198",
        studentName="Elena Rostova",
        studentEmail="elena.r@university.edu",
        assignmentId="assign-1",
        assignmentTitle="Assignment 1: Sorting Algorithms & Complexity",
        courseCode="CS101",
        fileName="elena_sorting_report.pdf",
        fileSize="2.0 MB",
        fileType="pdf",
        status=JobStatus.PENDING,
        processingStep=ProcessingStep.QUEUED,
        submittedAt="2026-10-08 22:25",
        rubricId="rubric-1",
        contentPreview="Sorting analysis submission with C++ benchmark driver and python plotting scripts.",
    ),
    Submission(
        id="sub-105",
        studentId="STU-2024-077",
        studentName="Devon Patel",
        studentEmail="d.patel@university.edu",
        assignmentId="assign-1",
        assignmentTitle="Assignment 1: Sorting Algorithms & Complexity",
        courseCode="CS101",
        fileName="patel_sorting_hw.md",
        fileSize="150 KB",
        fileType="markdown",
        status=JobStatus.FLAGGED,
        submittedAt="2026-10-08 19:40",
        rubricId="rubric-1",
        contentPreview="Sorting algorithm implementation report. AI pipeline detected incomplete complexity section or missing benchmark file.",
        evaluation=EvaluationResult(
            score=58.0,
            maxScore=100.0,
            percentage=58.0,
            summaryFeedback="Flagged for Faculty Review: The submission appears to be missing benchmark graphs and has truncated mathematical derivations.",
            strengths=["Basic sorting code passes elementary test cases"],
            improvements=["Complete missing complexity proofs", "Attach benchmark charts"],
            aiModelExtraction="Gemini Flash-Lite",
            aiModelGrading="Gemini Flash",
            evaluatedAt="2026-10-08 19:42",
            criteriaScores=[
                {
                    "criterionId": "crit-1",
                    "title": "Algorithm Correctness & Implementation",
                    "scoreAwarded": 28.0,
                    "maxPoints": 35.0,
                    "feedback": "Code correctly sorts arrays, but MergeSort lacks base case check for empty slice.",
                    "strengths": "Functional code.",
                    "improvements": "Add defensive guards for edge case input arrays.",
                },
                {
                    "criterionId": "crit-2",
                    "title": "Theoretical Time & Space Complexity",
                    "scoreAwarded": 10.0,
                    "maxPoints": 25.0,
                    "feedback": "Incomplete derivation; section appears truncated or unfinished.",
                    "strengths": "Mentions O(N log N).",
                    "improvements": "Section stops abruptly on line 45.",
                },
                {
                    "criterionId": "crit-3",
                    "title": "Empirical Benchmark Analysis",
                    "scoreAwarded": 10.0,
                    "maxPoints": 25.0,
                    "feedback": "No benchmark charts found in submission text.",
                    "strengths": "None noted.",
                    "improvements": "Submit benchmark charts.",
                },
                {
                    "criterionId": "crit-4",
                    "title": "Code Clarity & Documentation",
                    "scoreAwarded": 10.0,
                    "maxPoints": 15.0,
                    "feedback": "Basic comments provided.",
                    "strengths": "Clear indentation.",
                    "improvements": "Add explanations of functions.",
                },
            ],
        ),
    ),
]


class InMemoryDatabase:
    def __init__(self):
        self.rubrics: Dict[str, Rubric] = {r.id: copy.deepcopy(r) for r in SEED_RUBRICS}
        self.submissions: Dict[str, Submission] = {s.id: copy.deepcopy(s) for s in SEED_SUBMISSIONS}
        self.grading_jobs: Dict[str, GradingJob] = {
            "job-103": GradingJob(
                id="job-103",
                submissionId="sub-103",
                status=JobStatus.PROCESSING,
                startedAt="2026-10-08T21:10:00Z",
            ),
            "job-104": GradingJob(
                id="job-104",
                submissionId="sub-104",
                status=JobStatus.PENDING,
                startedAt=None,
            ),
        }
        self.file_storage: Dict[str, bytes] = {}


db = InMemoryDatabase()


class Repository:
    @staticmethod
    def get_rubrics(course_code: Optional[str] = None) -> List[Rubric]:
        client = get_supabase_client()
        if client:
            try:
                query = client.table("rubrics").select("*, rubric_criteria(*)")
                if course_code:
                    query = query.eq("course_code", course_code)
                res = query.execute()
                if res.data:
                    rubrics = []
                    for row in res.data:
                        criteria = [
                            RubricCriterion(
                                id=c["id"],
                                title=c["title"],
                                description=c.get("description", ""),
                                maxPoints=float(c.get("max_points", 0)),
                                weightPercent=c.get("weight_percent"),
                            )
                            for c in row.get("rubric_criteria", [])
                        ]
                        rubrics.append(
                            Rubric(
                                id=row["id"],
                                courseCode=row["course_code"],
                                assignmentTitle=row["assignment_title"],
                                description=row.get("description", ""),
                                totalPoints=float(row.get("total_points", 100)),
                                createdAt=row.get("created_at", ""),
                                criteria=criteria,
                            )
                        )
                    return rubrics
            except Exception as e:
                logger.warning(f"Supabase query failed, using in-memory store: {e}")

        # In-memory fallback
        results = list(db.rubrics.values())
        if course_code:
            results = [r for r in results if r.courseCode.lower() == course_code.lower()]
        return results

    @staticmethod
    def get_rubric_by_id(rubric_id: str) -> Optional[Rubric]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("rubrics").select("*, rubric_criteria(*)").eq("id", rubric_id).execute()
                if res.data:
                    row = res.data[0]
                    criteria = [
                        RubricCriterion(
                            id=c["id"],
                            title=c["title"],
                            description=c.get("description", ""),
                            maxPoints=float(c.get("max_points", 0)),
                            weightPercent=c.get("weight_percent"),
                        )
                        for c in row.get("rubric_criteria", [])
                    ]
                    return Rubric(
                        id=row["id"],
                        courseCode=row["course_code"],
                        assignmentTitle=row["assignment_title"],
                        description=row.get("description", ""),
                        totalPoints=float(row.get("total_points", 100)),
                        createdAt=row.get("created_at", ""),
                        criteria=criteria,
                    )
            except Exception as e:
                logger.warning(f"Supabase fetch rubric failed: {e}")

        return db.rubrics.get(rubric_id)

    @staticmethod
    def create_rubric(rubric: Rubric) -> Rubric:
        client = get_supabase_client()
        if client:
            try:
                client.table("rubrics").insert({
                    "id": rubric.id,
                    "course_code": rubric.courseCode,
                    "assignment_title": rubric.assignmentTitle,
                    "description": rubric.description,
                    "total_points": rubric.totalPoints,
                    "created_at": rubric.createdAt,
                }).execute()
                for i, c in enumerate(rubric.criteria):
                    client.table("rubric_criteria").insert({
                        "id": c.id,
                        "rubric_id": rubric.id,
                        "title": c.title,
                        "description": c.description,
                        "max_points": c.maxPoints,
                        "weight_percent": c.weightPercent,
                        "order_index": i,
                    }).execute()
            except Exception as e:
                logger.warning(f"Supabase insert rubric failed: {e}")

        db.rubrics[rubric.id] = copy.deepcopy(rubric)
        return rubric

    @staticmethod
    def update_rubric(rubric_id: str, update_data: RubricUpdate) -> Optional[Rubric]:
        rubric = Repository.get_rubric_by_id(rubric_id)
        if not rubric:
            return None

        if update_data.courseCode is not None:
            rubric.courseCode = update_data.courseCode
        if update_data.assignmentTitle is not None:
            rubric.assignmentTitle = update_data.assignmentTitle
        if update_data.description is not None:
            rubric.description = update_data.description
        if update_data.totalPoints is not None:
            rubric.totalPoints = update_data.totalPoints
        if update_data.criteria is not None:
            rubric.criteria = update_data.criteria

        client = get_supabase_client()
        if client:
            try:
                client.table("rubrics").update({
                    "course_code": rubric.courseCode,
                    "assignment_title": rubric.assignmentTitle,
                    "description": rubric.description,
                    "total_points": rubric.totalPoints,
                }).eq("id", rubric_id).execute()
            except Exception as e:
                logger.warning(f"Supabase update rubric failed: {e}")

        db.rubrics[rubric_id] = copy.deepcopy(rubric)
        return rubric

    @staticmethod
    def delete_rubric(rubric_id: str) -> bool:
        if rubric_id in db.rubrics:
            del db.rubrics[rubric_id]
        client = get_supabase_client()
        if client:
            try:
                client.table("rubrics").delete().eq("id", rubric_id).execute()
            except Exception as e:
                logger.warning(f"Supabase delete rubric failed: {e}")
        return True

    @staticmethod
    def get_submissions(
        course_code: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        student_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Submission], Dict[str, Any]]:
        subs = list(db.submissions.values())

        # Filter by student_id
        if student_id:
            subs = [s for s in subs if s.studentId == student_id or student_id in s.studentEmail]

        # Filter by course_code
        if course_code and course_code != "ALL":
            subs = [s for s in subs if s.courseCode.lower() == course_code.lower()]

        # Filter by status
        if status and status != "ALL":
            if status == "overridden":
                subs = [s for s in subs if s.override and s.override.isOverridden]
            else:
                subs = [s for s in subs if s.status == status]

        # Filter by search
        if search and search.strip():
            q = search.strip().lower()
            subs = [
                s
                for s in subs
                if q in s.studentName.lower()
                or q in s.studentId.lower()
                or q in s.studentEmail.lower()
                or q in s.assignmentTitle.lower()
                or q in s.fileName.lower()
            ]

        total = len(subs)
        evaluated = sum(1 for s in subs if s.status == JobStatus.DONE or s.evaluation is not None)
        pending = sum(1 for s in subs if s.status in [JobStatus.PENDING, JobStatus.PROCESSING])
        overridden = sum(1 for s in subs if s.override and s.override.isOverridden)

        # Calculate class average
        evaluated_scores = []
        for s in subs:
            if s.override and s.override.isOverridden:
                evaluated_scores.append(s.override.overriddenScore)
            elif s.evaluation:
                evaluated_scores.append(s.evaluation.score)

        class_average = round(sum(evaluated_scores) / len(evaluated_scores), 1) if evaluated_scores else 0.0

        paginated = subs[offset : offset + limit]

        meta = {
            "total": total,
            "evaluated": evaluated,
            "pending": pending,
            "overridden": overridden,
            "classAverage": class_average,
            "page": (offset // limit) + 1 if limit > 0 else 1,
            "limit": limit,
        }

        return paginated, meta

    @staticmethod
    def get_submission_by_id(submission_id: str) -> Optional[Submission]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("submissions").select("*").eq("id", submission_id).execute()
                if res.data:
                    # In a full Supabase DB sync, parse the row.
                    pass
            except Exception as e:
                logger.warning(f"Supabase get submission failed: {e}")

        return db.submissions.get(submission_id)

    @staticmethod
    def save_submission(submission: Submission) -> Submission:
        db.submissions[submission.id] = copy.deepcopy(submission)
        client = get_supabase_client()
        if client:
            try:
                # Save to Supabase
                row = {
                    "id": submission.id,
                    "student_id": submission.studentId,
                    "student_name": submission.studentName,
                    "student_email": submission.studentEmail,
                    "assignment_id": submission.assignmentId,
                    "assignment_title": submission.assignmentTitle,
                    "course_code": submission.courseCode,
                    "file_name": submission.fileName,
                    "file_size": submission.fileSize,
                    "file_type": submission.fileType,
                    "file_url": submission.fileUrl,
                    "rubric_id": submission.rubricId,
                    "status": submission.status.value,
                    "submitted_at": submission.submittedAt,
                }
                client.table("submissions").upsert(row).execute()
            except Exception as e:
                logger.warning(f"Supabase upsert submission failed: {e}")

        return submission

    @staticmethod
    def override_submission_grade(
        submission_id: str, override: FacultyOverride
    ) -> Optional[Submission]:
        sub = Repository.get_submission_by_id(submission_id)
        if not sub:
            return None

        sub.override = override
        if sub.status == JobStatus.FLAGGED:
            sub.status = JobStatus.DONE

        Repository.save_submission(sub)

        client = get_supabase_client()
        if client:
            try:
                client.table("faculty_overrides").insert({
                    "submission_id": submission_id,
                    "is_overridden": override.isOverridden,
                    "original_score": override.originalScore,
                    "overridden_score": override.overriddenScore,
                    "overridden_by": override.overriddenBy,
                    "override_reason": override.overrideReason,
                    "criterion_adjustments": override.criterionAdjustments,
                    "overridden_at": override.overriddenAt,
                }).execute()
            except Exception as e:
                logger.warning(f"Supabase insert override failed: {e}")

        return sub

    @staticmethod
    def get_pending_grading_jobs(limit: int = 10) -> List[GradingJob]:
        pending = [j for j in db.grading_jobs.values() if j.status == JobStatus.PENDING]
        return pending[:limit]

    @staticmethod
    def get_job_by_submission_id(submission_id: str) -> Optional[GradingJob]:
        for job in db.grading_jobs.values():
            if job.submissionId == submission_id:
                return job
        return None

    @staticmethod
    def save_job(job: GradingJob) -> GradingJob:
        db.grading_jobs[job.id] = copy.deepcopy(job)
        return job

    @staticmethod
    def get_queue_stats() -> QueueStats:
        pending_count = sum(1 for j in db.grading_jobs.values() if j.status == JobStatus.PENDING)
        processing_count = sum(1 for j in db.grading_jobs.values() if j.status == JobStatus.PROCESSING)
        return QueueStats(
            pendingJobs=pending_count,
            processingJobs=processing_count,
            oldestPendingJobAgeSeconds=45 if pending_count > 0 else 0,
        )
