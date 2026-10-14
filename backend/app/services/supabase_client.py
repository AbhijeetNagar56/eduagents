from typing import Optional
from supabase import create_client, Client
from app.core.config import settings
from app.core.logging import logger

_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    global _client
    if _client is not None:
        return _client

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY

    if url and key and url.startswith("http") and not url.startswith("https://your-project"):
        try:
            _client = create_client(url, key)
            logger.info("Supabase client initialized successfully.")
            return _client
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    return None


def is_supabase_configured() -> bool:
    return get_supabase_client() is not None
