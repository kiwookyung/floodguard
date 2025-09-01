from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.database import get_session
from api.core.security import get_current_user
from api.src.cameras.schemas import (
    CameraCreate,
    CameraResponse,
    CameraUpdate,
)
from api.src.cameras.service import CameraService
from api.src.users.models import User

router = APIRouter(prefix="/cameras", tags=["cameras"])


def get_camera_service(
    session: AsyncSession = Depends(get_session),
) -> CameraService:
    return CameraService(session)


@router.post(
    "", response_model=CameraResponse, status_code=status.HTTP_201_CREATED
)
async def create_camera(
    camera_data: CameraCreate,
    service: CameraService = Depends(get_camera_service),
    current_user: User = Depends(get_current_user),
) -> CameraResponse:
    """Create a new camera."""
    return await service.create_camera(camera_data)


@router.get("", response_model=list[CameraResponse])
async def get_all_cameras(
    service: CameraService = Depends(get_camera_service),
) -> list[CameraResponse]:
    """Get all cameras."""
    return await service.get_all_cameras()


@router.get("/{camera_id}", response_model=CameraResponse)
async def get_camera(
    camera_id: int,
    service: CameraService = Depends(get_camera_service),
) -> CameraResponse:
    """Get a specific camera by ID."""
    return await service.get_camera(camera_id)


@router.put("/{camera_id}", response_model=CameraResponse)
async def update_camera(
    camera_id: int,
    camera_data: CameraUpdate,
    service: CameraService = Depends(get_camera_service),
    current_user: User = Depends(get_current_user),
) -> CameraResponse:
    """Update a camera."""
    return await service.update_camera(camera_id, camera_data)


@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_camera(
    camera_id: int,
    service: CameraService = Depends(get_camera_service),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a camera."""
    await service.delete_camera(camera_id)