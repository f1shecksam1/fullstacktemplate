from pydantic import BaseModel


class ServerTimeResponse(BaseModel):
    utc: str
