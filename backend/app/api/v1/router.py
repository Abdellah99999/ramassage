from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.pickup_slips import router as pickup_slips_router
from app.api.v1.users import router as users_router
from app.api.v1.drivers import router as drivers_router
from app.api.v1.agences import router as agences_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(pickup_slips_router)
api_router.include_router(users_router)
api_router.include_router(drivers_router)
api_router.include_router(agences_router)
