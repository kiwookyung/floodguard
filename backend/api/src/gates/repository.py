from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.exceptions import AlreadyExistsException, NotFoundException
from api.src.gates.models import Gate
from api.src.gates.schemas import GateCreate, GateUpdate


class GateRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, gate_data: GateCreate) -> Gate:
        gate = Gate(**gate_data.model_dump())
        try:
            self.session.add(gate)
            await self.session.commit()
            await self.session.refresh(gate)
            return gate
        except IntegrityError:
            await self.session.rollback()
            raise AlreadyExistsException(
                f"Gate with name {gate_data.name} already exists"
            )

    async def get_by_id(self, gate_id: int) -> Gate:
        """Get gate by ID.

        Args:
            gate_id: Gate ID

        Returns:
            Gate: Found gate

        Raises:
            NotFoundException: If gate not found
        """
        query = select(Gate).where(Gate.id == gate_id)
        result = await self.session.execute(query)
        gate = result.scalar_one_or_none()

        if not gate:
            raise NotFoundException(f"Gate with id {gate_id} not found")
        return gate

    async def get_all(self) -> list[Gate]:
        """Get all gates.

        Returns:
            list[Gate]: List of all gates
        """
        query = select(Gate)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update(self, gate_id: int, gate_data: GateUpdate) -> Gate:
        """Update gate by ID.

        Args:
            gate_id: Gate ID
            gate_data: Gate update data

        Returns:
            Gate: Updated gate

        Raises:
            NotFoundException: If gate not found
        """
        update_data = gate_data.model_dump(exclude_unset=True)
        if not update_data:
            # Consider raising a different type of error or handling this case as per application requirements
            raise ValueError("No fields to update")

        query = (
            update(Gate).where(Gate.id == gate_id).values(**update_data)
        )
        result = await self.session.execute(query)

        if result.rowcount == 0:
            raise NotFoundException(f"Gate with id {gate_id} not found")

        await self.session.commit()
        return await self.get_by_id(gate_id)

    async def delete(self, gate_id: int) -> None:
        """Delete gate by ID.

        Args:
            gate_id: Gate ID

        Raises:
            NotFoundException: If gate not found
        """
        query = delete(Gate).where(Gate.id == gate_id)
        result = await self.session.execute(query)

        if result.rowcount == 0:
            raise NotFoundException(f"Gate with id {gate_id} not found")

        await self.session.commit()
