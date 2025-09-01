from sqlalchemy.ext.asyncio import AsyncSession

from api.src.gates.models import Gate
from api.src.gates.repository import GateRepository
from api.src.gates.schemas import GateCreate, GateUpdate
from api.src.logs import service as log_service
from api.src.logs.schemas import LogCreate


class GateService:
    """Service for handling gate business logic."""

    def __init__(self, session: AsyncSession):
        self.repository = GateRepository(session)

    async def create_gate(self, gate_data: GateCreate) -> Gate:
        """Create a new gate."""
        return await self.repository.create(gate_data)

    async def get_gate(self, gate_id: int) -> Gate:
        """Get gate by ID."""
        return await self.repository.get_by_id(gate_id)

    async def get_all_gates(self) -> list[Gate]:
        """Get all gates."""
        return await self.repository.get_all()

    async def update_gate(
        self, gate_id: int, gate_data: GateUpdate, user_id: int
    ) -> Gate:
        """Update gate by ID."""
        gate = await self.repository.get_by_id(gate_id)
        if not gate:
            return None

        updated_gate = await self.repository.update(gate_id, gate_data)

        # Log the gate update action
        log_data = LogCreate(
            gate_id=gate_id,
            user_id=user_id,
            action="Gate Updated",
            details=f"Gate {gate.name} updated. Changes: {gate_data.dict(exclude_unset=True)}"
        )
        await log_service.create_log(self.repository.session, log_data)

        return updated_gate

    async def delete_gate(self, gate_id: int) -> None:
        """Delete gate by ID."""
        await self.repository.delete(gate_id)
