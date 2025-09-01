from sqlalchemy import Column, Integer, Numeric, DateTime
from sqlalchemy.sql import func

from api.core.database import Base


class ScoreData(Base):
    __tablename__ = "score_data"

    id = Column(Integer, primary_key=True, index=True)
    final_score = Column(Numeric(precision=5, scale=3), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
