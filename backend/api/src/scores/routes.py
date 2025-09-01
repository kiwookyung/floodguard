from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.database import get_session
from api.src.scores.schemas import ScoreDataResponse
from api.src.scores.service import ScoreDataService

router = APIRouter(prefix="/scores", tags=["scores"])

def get_score_service(
    session: AsyncSession = Depends(get_session),
) -> ScoreDataService:
    return ScoreDataService(session)


@router.get("/history", response_model=list[ScoreDataResponse])
async def get_score_history(
    service: ScoreDataService = Depends(get_score_service),
):
    return await service.get_scores()
