from pydantic import BaseModel


class StopProjectResponse(BaseModel):
    status: str
    message: str
