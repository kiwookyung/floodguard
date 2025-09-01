from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from api.src.scores.models import ScoreData
from api.src.scores.schemas import ScoreDataCreate


class ScoreDataRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, score_data: ScoreDataCreate) -> ScoreData:
        db_score_data = ScoreData(**score_data.model_dump())
        self.session.add(db_score_data)
        await self.session.commit()
        await self.session.refresh(db_score_data)
        return db_score_data

    async def get_latest_scores(self) -> list[ScoreData]:
        query = select(ScoreData).order_by(ScoreData.timestamp.desc()).limit(100)
        result = await self.session.execute(query)
        return list(result.scalars().all())
