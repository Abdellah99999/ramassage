from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from app.api.v1.router import api_router
from app.api.exception_handlers import register_exception_handlers
from app.core.config import settings
from app.models.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import User
from app.db.seed import seed_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure all database tables exist
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        # 2. Check if admin user exists, if not seed database with full test data
        async with SessionLocal() as session:
            result = await session.execute(select(User).where(User.email == "admin@hes.com"))
            admin_user = result.scalar_one_or_none()
            if not admin_user:
                print("Compte admin@hes.com non trouvé en base. Initialisation automatique des données de test...")
                await seed_data()
    except Exception as e:
        print(f"Erreur lors de l'initialisation de la base de données au démarrage: {e}")
    yield

app = FastAPI(
    title="H.E.S. Pickup Management System API",
    description="API de gestion des ramassages de colis pour Horizon Express Services",
    version="1.0.0",
    lifespan=lifespan
)

# Register central exception handlers
register_exception_handlers(app)

# Dynamic CORS origins from env
configured_origins = settings.get_cors_origins()
default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ramassage.vercel.app"
]
cors_origins = list(set(configured_origins + default_origins))

# CORS middleware with Vercel preview support
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
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
        "frontend_url": "https://ramassage.vercel.app",
        "docs_url": "/docs"
    }

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "message": "H.E.S. API is running"}
