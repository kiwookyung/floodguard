from sqlalchemy.ext.asyncio import AsyncSession
import json

from . import repository, schemas
from api.src.websockets.log_manager import log_manager


async def create_log(db: AsyncSession, log: schemas.LogCreate):
    new_log = await repository.create_log(db=db, log=log)
    log_dict = schemas.Log.from_orm(new_log).dict()
    log_dict["created_at"] = log_dict["created_at"].isoformat()
    log_manager.broadcast(json.dumps(log_dict))
    return new_log

async def get_logs(db: AsyncSession, period: schemas.LogPeriod):
    return await repository.get_logs_by_period(db=db, period=period)