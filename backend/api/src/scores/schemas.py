from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class ScoreDataCreate(BaseModel):
    final_score: float = Field(..., ge=0.0, le=1.0)


class ScoreDataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    final_score: float
    timestamp: datetime
