from pydantic import BaseModel, ConfigDict, Field


class GateControl(BaseModel):
    """Schema for controlling gates."""
    command: str = Field(..., pattern="^(open|close)$")


class GateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    


class GateCreate(GateBase):
    """Schema for creating a new Gate."""


class GateUpdate(BaseModel):
    """Schema for updating an existing Gate.

    All fields are optional since updates might be partial.
    """

    name: str | None = Field(None, min_length=1, max_length=100)
    lat: float | None = Field(None, ge=-90, le=90)
    lon: float | None = Field(None, ge=-180, le=180)


class GateResponse(GateBase):
    """Schema for Gate responses.

    Includes all base fields plus the id.
    """

    model_config = ConfigDict(from_attributes=True)
    id: int
