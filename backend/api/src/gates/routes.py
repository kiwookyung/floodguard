from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import json

from api.core.database import get_session
from api.core.security import get_current_user
from api.src.gates.schemas import (
    GateControl,
    GateCreate,
    GateResponse,
    GateUpdate,
)
from api.src.gates.service import GateService
from api.src.logs import service as log_service
from api.src.logs.schemas import LogCreate
from api.src.users.models import User
from api.src.websockets.routes import mqtt_client
from api.core.config import settings

router = APIRouter(prefix="/gates", tags=["gates"])


def get_gate_service(
    session: AsyncSession = Depends(get_session),
) -> GateService:
    return GateService(session)


def publish_mqtt_command(payload: dict) -> bool:
    """Publishes a JSON command to the MQTT broker."""
    try:
        json_payload = json.dumps(payload)
        result = mqtt_client.publish(settings.pub_topic_jetson, payload=json_payload, qos=1)
        if result.rc == 0: # MQTT_ERR_SUCCESS
            print(f"[API] Published command '{json_payload}' to topic '{settings.pub_topic_jetson}'")
            return True
        else:
            print(f"[API] Failed to publish command. RC: {result.rc}")
            return False
    except Exception as e:
        print(f"[API] Error publishing MQTT message: {e}")
        return False


@router.post("/control", status_code=status.HTTP_202_ACCEPTED)
async def control_all_gates(
    control_data: GateControl,
    service: GateService = Depends(get_gate_service),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Control ALL gates simultaneously (open/close). Requires authentication."""
    command = control_data.command.lower()
    payload = {"gate": "ALL", "command": command}
    
    if publish_mqtt_command(payload):
        log_data = LogCreate(
            user_id=current_user.id,
            action=f"All Gates {command}",
            details=f"User {current_user.email} sent command '{command}' to all gates."
        )
        await log_service.create_log(service.repository.session, log_data)
        return {"status": "success", "message": f"Command '{command}' sent to all gates."}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send command to gates.",
        )

@router.post("/{gate_id}/control", status_code=status.HTTP_202_ACCEPTED)
async def control_single_gate(
    gate_id: int,
    control_data: GateControl,
    service: GateService = Depends(get_gate_service),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Control a single gate by its ID. Requires authentication."""
    gate = await service.get_gate(gate_id)
    command = control_data.command.lower()

    # Determine which physical gate (A or B) this ID corresponds to.
    # This is a simple assumption based on the gate name.
    if "a" in gate.name.lower():
        target_gate = "A"
    elif "b" in gate.name.lower():
        target_gate = "B"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not determine physical gate (A or B) from name '{gate.name}'",
        )

    payload = {"gate": target_gate, "command": command}

    if publish_mqtt_command(payload):
        log_data = LogCreate(
            gate_id=gate_id,
            user_id=current_user.id,
            action=f"Gate {command}",
            details=f"User {current_user.email} sent command '{command}' to gate {gate_id} ({target_gate})."
        )
        await log_service.create_log(service.repository.session, log_data)
        return {"status": "success", "message": f"Command '{command}' sent to gate {gate_id} ({target_gate})."}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send command to the gate.",
        )


@router.post(
    "", response_model=GateResponse, status_code=status.HTTP_201_CREATED
)
async def create_gate(
    gate_data: GateCreate,
    service: GateService = Depends(get_gate_service),
    current_user: User = Depends(get_current_user),
) -> GateResponse:
    """Create a new gate."""
    return await service.create_gate(gate_data)


@router.get("", response_model=list[GateResponse])
async def get_all_gates(
    service: GateService = Depends(get_gate_service),
) -> list[GateResponse]:
    """Get all gates."""
    return await service.get_all_gates()


@router.get("/{gate_id}", response_model=GateResponse)
async def get_gate(
    gate_id: int,
    service: GateService = Depends(get_gate_service),
) -> GateResponse:
    """Get a specific gate by ID."""
    return await service.get_gate(gate_id)


@router.put("/{gate_id}", response_model=GateResponse)
async def update_gate(
    gate_id: int,
    gate_data: GateUpdate,
    service: GateService = Depends(get_gate_service),
    current_user: User = Depends(get_current_user),
) -> GateResponse:
    """Update a gate."""
    return await service.update_gate(gate_id, gate_data, current_user.id)


@router.delete("/{gate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gate(
    gate_id: int,
    service: GateService = Depends(get_gate_service),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a gate."""
    await service.delete_gate(gate_id)
