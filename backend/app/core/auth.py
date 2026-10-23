import os
from typing import Optional, List
from fastapi import Header, HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from pydantic import BaseModel

from app.core.config import settings
from app.core.errors import APIException
from app.core.logging import logger
from app.services.supabase_client import get_supabase_client

security_bearer = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    id: str
    email: str
    role: str = "student"


def verify_cron_secret(
    x_internal_secret: Optional[str] = Header(None, alias="X-Internal-Secret")
) -> bool:
    expected_secret = settings.INTERNAL_CRON_SECRET
    if not x_internal_secret or x_internal_secret != expected_secret:
        logger.warning("Unauthorized internal cron request attempt.")
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Missing or invalid internal cron secret header."
        )
    return True


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> AuthUser:
    if not credentials:
        # If in development mode and no token supplied, allow default dev student
        if settings.ENVIRONMENT == "development":
            return AuthUser(
                id="STU-2024-302",
                email="jordan.taylor@university.edu",
                role="student"
            )
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Missing Authorization Bearer token."
        )

    token = credentials.credentials

    # Fast path for local development / testing tokens
    if settings.ENVIRONMENT == "development" and (token.startswith("mock-") or token.startswith("dev-")):
        role = "admin" if "admin" in token else ("faculty" if "faculty" in token else "student")
        user_id = "ADM-001" if role == "admin" else ("FAC-101" if role == "faculty" else "STU-2024-302")
        email = f"{role}@eduagents.app"
        return AuthUser(id=user_id, email=email, role=role)

    client = get_supabase_client()
    if client:
        try:
            response = client.auth.get_user(token)
            auth_user = response.user
            if not auth_user:
                raise ValueError("Supabase returned no user for this token")
            metadata = auth_user.app_metadata or {}
            role = metadata.get("role") or (auth_user.user_metadata or {}).get("role") or "student"
            return AuthUser(id=str(auth_user.id), email=auth_user.email or "", role=role)
        except Exception as e:
            logger.warning(f"Supabase access-token verification failed: {e}")
            raise APIException(status_code=401, code="UNAUTHORIZED", message="Invalid or expired access token.")

    if settings.ENVIRONMENT != "development":
        raise APIException(status_code=401, code="UNAUTHORIZED", message="Token verification is unavailable.")

    try:
        # Development-only fallback when local Supabase credentials are not configured.
        claims = jwt.decode(
            token,
            options={"verify_signature": False},
            algorithms=["HS256", "RS256"]
        )
        user_id = claims.get("sub", "")
        email = claims.get("email", "")
        app_metadata = claims.get("app_metadata", {})
        role = app_metadata.get("role") or claims.get("role", "student")

        return AuthUser(id=user_id, email=email, role=role)
    except Exception as e:
        logger.error(f"Error decoding JWT token: {e}")
        # In dev mode, return fallback
        if settings.ENVIRONMENT == "development":
            return AuthUser(
                id="STU-2024-302",
                email="jordan.taylor@university.edu",
                role="student"
            )
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INVALID_TOKEN",
            message="Provided authentication token is invalid or expired."
        )


def require_role(allowed_roles: List[str]):
    def role_checker(user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if user.role not in allowed_roles:
            raise APIException(
                status_code=status.HTTP_403_FORBIDDEN,
                code="FORBIDDEN",
                message=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}"
            )
        return user
    return role_checker
