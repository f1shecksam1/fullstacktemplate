import logging
from datetime import datetime, timezone

from fastapi import APIRouter

from ..schemas.time import ServerTimeResponse

router = APIRouter(tags=["time"])
logger = logging.getLogger("backend.api.time")


@router.get("/time", response_model=ServerTimeResponse)
async def server_time() -> ServerTimeResponse:
    logger.debug("time.request.received")
    response = ServerTimeResponse(utc=datetime.now(timezone.utc).isoformat())
    logger.info("time.provided | utc=%s", response.utc)
    return response
