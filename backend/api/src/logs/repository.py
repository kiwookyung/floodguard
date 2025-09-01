from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta

from . import models, schemas


async def create_log(db: AsyncSession, log: schemas.LogCreate):
    db_log = models.Log(**log.dict())
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log

async def get_logs_by_period(db: AsyncSession, period: schemas.LogPeriod):
    end_date = datetime.utcnow()
    if period == schemas.LogPeriod.DAY:
        start_date = end_date - timedelta(days=1)
    elif period == schemas.LogPeriod.WEEK:
        start_date = end_date - timedelta(weeks=1)
    elif period == schemas.LogPeriod.MONTH:
        start_date = end_date - timedelta(days=30) # Approximation for a month
    else:
        return []

    result = await db.execute(
        select(models.Log)
        .filter(models.Log.created_at >= start_date)
        .order_by(models.Log.created_at.desc())
    )
    return result.scalars().all()
