from sqlalchemy import Boolean, Column, Integer, Numeric, String

from api.core.database import Base


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    lat = Column(Numeric(precision=8, scale=6), nullable=False)
    lon = Column(Numeric(precision=9, scale=6), nullable=False)
    
