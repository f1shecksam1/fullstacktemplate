import logging

from fastapi import APIRouter

from ..schemas.logs import FrontendLogRequest, FrontendLogResponse

router = APIRouter(tags=["logs"])
logger = logging.getLogger("frontend.client")


@router.post("/logs/frontend", response_model=FrontendLogResponse)
async def ingest_frontend_log(payload: FrontendLogRequest) -> FrontendLogResponse:
    logger.debug(
        "frontend.log.received | level=%s | event=%s | page_path=%s",
        payload.level,
        payload.event,
        payload.page_path,
    )
    log_method = getattr(logger, payload.level)
    log_method(
        "frontend.log.event | event=%s | message=%s | "
        "page_path=%s | details=%s | trace_id=%s",
        payload.event,
        payload.message,
        payload.page_path,
        payload.details,
        payload.trace_id,
    )
    return FrontendLogResponse(status="accepted")
