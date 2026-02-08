import logging

from fastapi import APIRouter

from ....core.config import get_settings
from ..schemas.health import HealthResponse

router = APIRouter(tags=["health"])
logger = logging.getLogger("backend.api.health")


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    logger.debug("health.request.received")
    settings = get_settings()
    response = HealthResponse(status="ok", environment=settings.app_env)
    logger.info(
        "health.checked | status=%s | environment=%s",
        response.status,
        response.environment,
    )
    return response
