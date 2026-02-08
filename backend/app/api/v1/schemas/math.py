from pydantic import BaseModel, ConfigDict


class MathAddQuery(BaseModel):
    model_config = ConfigDict(extra="forbid")

    a: float
    b: float


class MathAddResponse(BaseModel):
    a: float
    b: float
    result: float
