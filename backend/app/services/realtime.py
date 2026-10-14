from datetime import datetime, timezone
from typing import Any, Dict, Optional
from app.core.logging import logger
from app.services.supabase_client import get_supabase_client


class RealtimeService:
    @staticmethod
    async def broadcast_submission_update(
        submission_id: str,
        status: str,
        processing_step: str,
        score: Optional[float] = None,
        max_score: Optional[float] = None,
        course_code: Optional[str] = None,
    ) -> None:
        payload = {
            "event": "submission:updated",
            "submissionId": submission_id,
            "status": status,
            "processingStep": processing_step,
            "score": score,
            "maxScore": max_score,
            "evaluatedAt": datetime.now(timezone.utc).isoformat(),
        }
        logger.info(f"[Realtime Broadcast] channel='eduagents-realtime' payload={payload}")

        client = get_supabase_client()
        if client:
            try:
                # Send broadcast via Supabase Realtime channel
                channel = client.channel("eduagents-realtime")
                channel.send_broadcast(
                    event="submission:updated",
                    payload=payload
                )
            except Exception as e:
                logger.warning(f"Failed to push Supabase Realtime broadcast: {e}")
