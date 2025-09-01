from pydantic import BaseModel
from datetime import datetime
from enum import Enum


class LogPeriod(str, Enum):
    DAY = "day"
    WEEK = "week"
    MONTH = "month"


class LogBase(BaseModel):
    gate_id: int | None = None
    user_id: int | None = None
    action: str
    details: str | None = None


class LogCreate(LogBase):
    pass


class Log(LogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
