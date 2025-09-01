from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.exceptions import AlreadyExistsException, NotFoundException
from api.src.cameras.models import Camera
from api.src.cameras.schemas import CameraCreate, CameraUpdate


class CameraRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, camera_data: CameraCreate) -> Camera:
        camera = Camera(**camera_data.model_dump())
        try:
            self.session.add(camera)
            await self.session.commit()
            await self.session.refresh(camera)
            return camera
        except IntegrityError:
            await self.session.rollback()
            raise AlreadyExistsException(
                f"Camera with name {camera_data.name} already exists"
            )

    async def get_by_id(self, camera_id: int) -> Camera:
        """Get camera by ID.

        Args:
            camera_id: Camera ID

        Returns:
            Camera: Found camera

        Raises:
            NotFoundException: If camera not found
        """
        query = select(Camera).where(Camera.id == camera_id)
        result = await self.session.execute(query)
        camera = result.scalar_one_or_none()

        if not camera:
            raise NotFoundException(f"Camera with id {camera_id} not found")
        return camera

    async def get_all(self) -> list[Camera]:
        """Get all cameras.

        Returns:
            list[Camera]: List of all cameras
        """
        query = select(Camera)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update(self, camera_id: int, camera_data: CameraUpdate) -> Camera:
        """Update camera by ID.

        Args:
            camera_id: Camera ID
            camera_data: Camera update data

        Returns:
            Camera: Updated camera

        Raises:
            NotFoundException: If camera not found
        """
        update_data = camera_data.model_dump(exclude_unset=True)
        if not update_data:
            # Consider raising a different type of error or handling this case as per application requirements
            raise ValueError("No fields to update")

        query = (
            update(Camera).where(Camera.id == camera_id).values(**update_data)
        )
        result = await self.session.execute(query)

        if result.rowcount == 0:
            raise NotFoundException(f"Camera with id {camera_id} not found")

        await self.session.commit()
        return await self.get_by_id(camera_id)

    async def delete(self, camera_id: int) -> None:
        """Delete camera by ID.

        Args:
            camera_id: Camera ID

        Raises:
            NotFoundException: If camera not found
        """
        query = delete(Camera).where(Camera.id == camera_id)
        result = await self.session.execute(query)

        if result.rowcount == 0:
            raise NotFoundException(f"Camera with id {camera_id} not found")

        await self.session.commit()
