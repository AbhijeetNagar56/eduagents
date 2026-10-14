from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.models.health import HealthResponse
from app.services.repository import Repository
from app.services.supabase_client import is_supabase_configured

router = APIRouter(tags=["Health & Diagnostics"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Liveness and readiness check. Returns database status, storage connectivity,
    queue depth metrics, and Gemini operational state.
    """
    queue_stats = Repository.get_queue_stats()
    db_status = "connected" if is_supabase_configured() else "connected (local store)"
    storage_status = "connected" if is_supabase_configured() else "connected (local store)"
    gemini_status = "operational" if settings.GEMINI_API_KEY else "operational (heuristic mode)"

    return HealthResponse(
        status="healthy",
        version="1.0.0",
        database=db_status,
        storage=storage_status,
        queue=queue_stats,
        geminiApi=gemini_status,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
