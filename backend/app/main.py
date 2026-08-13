from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.api.exception_handlers import register_exception_handlers
from app.core.config import settings

app = FastAPI(
    title="H.E.S. Pickup Management System API",
    description="API de gestion des ramassages de colis pour Horizon Express Services",
    version="1.0.0",
)

# Register central exception handlers
register_exception_handlers(app)

# Dynamic CORS origins from env (fallback to local dev frontend)
cors_origins = settings.get_cors_origins() or ["http://localhost:3000"]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(api_router)

@app.get("/", tags=["System"])
async def root():
    return {
        "status": "online",
        "message": "Bienvenue sur l'API H.E.S. Pickup Management System",
        "frontend_url": "http://localhost:3000",
        "docs_url": "http://127.0.0.1:8000/docs"
    }

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "message": "H.E.S. API is running"}
