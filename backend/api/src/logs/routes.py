from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.database import get_session
from . import service, schemas

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("/", response_model=list[schemas.Log])
async def read_logs(
    db: AsyncSession = Depends(get_session),
    period: schemas.LogPeriod = Query(schemas.LogPeriod.DAY, description="Time period to filter logs")
):
    return await service.get_logs(db=db, period=period)