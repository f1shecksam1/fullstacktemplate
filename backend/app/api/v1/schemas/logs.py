from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class FrontendLogRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    level: Literal["debug", "info", "warning", "error"]
    event: str = Field(min_length=1, max_length=200)
    message: str | None = Field(default=None, max_length=500)
    page_path: str | None = Field(default=None, max_length=500)
    details: dict[str, Any] | None = None
    trace_id: str | None = Field(default=None, max_length=100)
    browser_timestamp: str | None = None
    user_agent: str | None = Field(default=None, max_length=500)


class FrontendLogResponse(BaseModel):
    status: str
