from fastapi import APIRouter

from ..core.config import get_settings
from .v1.router import router as v1_router

settings = get_settings()

api_router = APIRouter(prefix=settings.api_prefix)
api_router.include_router(v1_router, prefix=settings.api_v1_prefix)
