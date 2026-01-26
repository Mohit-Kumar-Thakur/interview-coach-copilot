from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from jose import JWTError
import logging

logger = logging.getLogger("api")

def error_response(code: str, message: str, status: int):
    return JSONResponse(
        status_code=status,
        content={
            "error": code,
            "message": message,
        },
    )
