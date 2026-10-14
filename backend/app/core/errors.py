from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse


class APIException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.message = message
        self.details = details or {}


def format_error_response(
    code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> JSONResponse:
    content = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    return JSONResponse(status_code=status_code, content=content)
