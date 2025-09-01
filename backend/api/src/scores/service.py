from sqlalchemy.ext.asyncio import AsyncSession

from api.src.scores.repository import ScoreDataRepository
from api.src.scores.schemas import ScoreDataCreate


class ScoreDataService:
    def __init__(self, session: AsyncSession):
        self.repository = ScoreDataRepository(session)

    async def create_score_data(self, score_data: ScoreDataCreate):
        return await self.repository.create(score_data)

    async def get_scores(self):
        return await self.repository.get_latest_scores()
