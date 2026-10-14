from fastapi import APIRouter, Depends, Query, status
from app.core.auth import verify_cron_secret
from app.models.common import StandardResponse
from app.models.job import BatchProcessResult
from app.services.queue import QueueService

router = APIRouter(prefix="/internal", tags=["Internal Cron Runner"])


@router.post("/process-jobs", response_model=StandardResponse[BatchProcessResult])
async def process_jobs(
    batch_size: int = Query(10, ge=1, le=25),
    authorized: bool = Depends(verify_cron_secret),
):
    """
    Heart of the asynchronous batch runner. Drains pending jobs, runs the sequential
    Gemini 2-Step AI grading pipeline, writes evaluations, and publishes Realtime events.
    """
    result = await QueueService.process_batch(batch_size=batch_size)

    return StandardResponse[BatchProcessResult](
        success=True,
        data=result,
        message="Batch completed successfully",
    )
