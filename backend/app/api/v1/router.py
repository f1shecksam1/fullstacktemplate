from fastapi import APIRouter

from .endpoints.admin import router as admin_router
from .endpoints.echo import router as echo_router
from .endpoints.health import router as health_router
from .endpoints.logs import router as logs_router
from .endpoints.math import router as math_router
from .endpoints.time import router as time_router

router = APIRouter()
router.include_router(health_router)
router.include_router(echo_router)
router.include_router(time_router)
router.include_router(math_router)
router.include_router(logs_router)
router.include_router(admin_router)
