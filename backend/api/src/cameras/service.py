from sqlalchemy.ext.asyncio import AsyncSession

from api.src.cameras.models import Camera
from api.src.cameras.repository import CameraRepository
from api.src.cameras.schemas import CameraCreate, CameraUpdate


class CameraService:
    """Service for handling camera business logic."""

    def __init__(self, session: AsyncSession):
        self.repository = CameraRepository(session)

    async def create_camera(self, camera_data: CameraCreate) -> Camera:
        """Create a new camera."""
        return await self.repository.create(camera_data)

    async def get_camera(self, camera_id: int) -> Camera:
        """Get camera by ID."""
        return await self.repository.get_by_id(camera_id)

    async def get_all_cameras(self) -> list[Camera]:
        """Get all cameras."""
        return await self.repository.get_all()

    async def update_camera(
        self, camera_id: int, camera_data: CameraUpdate
    ) -> Camera:
        """Update camera by ID."""
        return await self.repository.update(camera_id, camera_data)

    async def delete_camera(self, camera_id: int) -> None:
        """Delete camera by ID."""
        await self.repository.delete(camera_id)