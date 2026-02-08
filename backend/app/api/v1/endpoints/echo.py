import logging

from fastapi import APIRouter

from ..schemas.echo import EchoRequest, EchoResponse

router = APIRouter(tags=["echo"])
logger = logging.getLogger("backend.api.echo")


@router.post("/echo", response_model=EchoResponse)
async def echo(payload: EchoRequest) -> EchoResponse:
    logger.debug("echo.request.received | message=%s", payload.message)
    response = EchoResponse(echoed=payload.message, length=len(payload.message))
    logger.info(
        "echo.processed | echoed=%s | length=%s", response.echoed, response.length
    )
    return response
