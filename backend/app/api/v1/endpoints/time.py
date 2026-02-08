import logging
from datetime import UTC, datetime

from fastapi import APIRouter

from ..schemas.time import ServerTimeResponse

router = APIRouter(tags=["time"])
logger = logging.getLogger("backend.api.time")


@router.get("/time", response_model=ServerTimeResponse)
async def server_time() -> ServerTimeResponse:
    logger.debug("time.request.received")
    response = ServerTimeResponse(utc=datetime.now(UTC).isoformat())
    logger.info("time.provided | utc=%s", response.utc)
    return response
