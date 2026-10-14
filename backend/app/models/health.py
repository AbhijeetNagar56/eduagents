from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class QueueStats(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    pendingJobs: int = Field(0, alias="pendingJobs")
    processingJobs: int = Field(0, alias="processingJobs")
    oldestPendingJobAgeSeconds: Optional[int] = Field(None, alias="oldestPendingJobAgeSeconds")


class HealthResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: str = "healthy"
    version: str = "1.0.0"
    database: str = "connected"
    storage: str = "connected"
    queue: QueueStats
    geminiApi: str = "operational"
    timestamp: str
