from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import (
    AuthenticationError,
    PermissionDeniedError,
    NotFoundError,
    ValidationError,
    ConflictError
)

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AuthenticationError)
    async def auth_error_handler(request: Request, exc: AuthenticationError):
        return JSONResponse(
            status_code=401,
            content={"detail": exc.message, "error_code": "UNAUTHENTICATED"}
        )

    @app.exception_handler(PermissionDeniedError)
    async def permission_error_handler(request: Request, exc: PermissionDeniedError):
        return JSONResponse(
            status_code=403,
            content={"detail": exc.message, "error_code": "FORBIDDEN"}
        )

    @app.exception_handler(NotFoundError)
    async def not_found_error_handler(request: Request, exc: NotFoundError):
        return JSONResponse(
            status_code=404,
            content={"detail": exc.message, "error_code": "NOT_FOUND"}
        )

    @app.exception_handler(ConflictError)
    async def conflict_error_handler(request: Request, exc: ConflictError):
        return JSONResponse(
            status_code=409,
            content={"detail": exc.message, "error_code": "CONFLICT"}
        )

    @app.exception_handler(ValidationError)
    async def validation_error_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=422,
            content={"detail": exc.message, "error_code": "VALIDATION_ERROR"}
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"{type(exc).__name__}: {str(exc)}", "error_code": "INTERNAL_SERVER_ERROR"}
        )
