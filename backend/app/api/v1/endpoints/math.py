import logging

from fastapi import APIRouter, Query

from ..schemas.math import MathAddQuery, MathAddResponse

router = APIRouter(tags=["math"])
logger = logging.getLogger("backend.api.math")


@router.get("/math/add", response_model=MathAddResponse)
async def math_add(
    a: float = Query(description="First number"),
    b: float = Query(description="Second number"),
) -> MathAddResponse:
    logger.debug("math.add.request.received | a=%s | b=%s", a, b)
    query = MathAddQuery(a=a, b=b)
    response = MathAddResponse(a=query.a, b=query.b, result=query.a + query.b)
    logger.info(
        "math.add.executed | a=%s | b=%s | result=%s",
        response.a,
        response.b,
        response.result,
    )
    return response
