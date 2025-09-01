import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import paho.mqtt.client as mqtt
import redis.asyncio as redis
from datetime import datetime

from api.core.config import settings
from api.src.websockets.log_manager import log_manager
from api.core.database import get_session
from api.src.scores.service import ScoreDataService
from api.src.scores.schemas import ScoreDataCreate
from api.src.logs.schemas import LogCreate
from api.src.logs.service import create_log as create_log_service

_previous_risk_level = None # Global variable to store the previous risk level
_previous_gate_A_status = None
_previous_gate_B_status = None


# --- 라우터 및 클라이언트 초기화 ---
router = APIRouter(prefix="/ws", tags=["websockets"])
redis_client = redis.Redis(
    host=settings.redis_host,
    port=settings.redis_port,
    decode_responses=True
)
mqtt_client = mqtt.Client(client_id=settings.mqtt_client_id)


# --- WebSocket 연결 관리 ---
class ConnectionManager:
    """프론트엔드 클라이언트 WebSocket 연결 관리"""
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.loop = None

    def set_loop(self, loop):
        self.loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    def broadcast(self, message: str):
        """연결된 모든 클라이언트에 메시지를 스레드에 안전하게 브로드캐스트"""
        if self.loop:
            asyncio.run_coroutine_threadsafe(self._broadcast(message), self.loop)

    async def _broadcast(self, message: str):
        """실제 브로드캐스트 코루틴"""
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()


async def _save_score_data(final_score: float):
    """Helper function to save final_score to the database."""
    async for session in get_session():
        score_data = ScoreDataCreate(final_score=final_score)
        await ScoreDataService(session).create_score_data(score_data)
        print(f"[DB] Saved final_score: {final_score}")


async def _save_log_to_db(log_entry: LogCreate):
    """Helper function to save a log entry to the database."""
    async for session in get_session():
        await create_log_service(session, log_entry)


# --- MQTT 콜백 함수 ---
def on_connect(client, userdata, flags, rc):
    """MQTT 브로커 연결 성공 시 호출"""
    if rc == 0:
        print("[MQTT] Connected to broker.")
        client.subscribe(settings.sub_topic_rpi, qos=1)
        print(f"[MQTT] Subscribed to topic: {settings.sub_topic_rpi}")
    else:
        connect_errors = {
            1: "Connection refused - incorrect protocol version",
            2: "Connection refused - invalid client identifier",
            3: "Connection refused - server unavailable",
            4: "Connection refused - bad username or password",
            5: "Connection refused - not authorised",
        }
        error_message = connect_errors.get(rc, "Unknown connection error")
        print(f"[MQTT] Failed to connect: {error_message} (return code: {rc})")

def on_disconnect(client, userdata, rc):
    """MQTT 브로커 연결 해제 시 호출"""
    if rc != 0:
        print(f"[MQTT] Disconnected unexpectedly. Attempting to reconnect... (return code: {rc})")
    else:
        print("[MQTT] Disconnected gracefully.")

def on_message(client, userdata, msg):
    """MQTT 메시지 수신 시 호출"""
    global _previous_risk_level, _previous_gate_A_status, _previous_gate_B_status
    payload = msg.payload.decode("utf-8")
    print(f"[MQTT] Message received from topic '{msg.topic}': {payload}")
    
    try:
        # MQTT 메시지 페이로드를 JSON으로 파싱
        data = json.loads(payload)
        
        # final_score와 risk_level만 추출
        final_score = data.get("final_score")
        risk_level = data.get("risk_level")
        gate_A = data.get("gate_a")
        gate_B = data.get("gate_b")
        # Save final_score to database
        if manager.loop: # Ensure loop is available
            asyncio.run_coroutine_threadsafe(_save_score_data(final_score), manager.loop)
        
        # 추출된 데이터로 새로운 JSON 객체 생성
        filtered_data = {
            "final_score": final_score,
            "risk_level": risk_level,
            "gate_A": gate_A,
            "gate_B": gate_B
        }
        
        # 1. Redis에 최신 데이터 저장 (기존 로직 유지)
        if manager.loop:
            asyncio.run_coroutine_threadsafe(
                redis_client.set(settings.redis_gate_status_key, json.dumps(filtered_data)), 
                manager.loop
            )
        
        # 2. 연결된 모든 프론트엔드 클라이언트에 필터링된 데이터 브로드캐스트
        manager.broadcast(json.dumps(filtered_data))

        # 3. risk_level이 "Caution" 또는 "Danger"일 경우 ws/logs로 알림 전송
        if risk_level in ["Caution", "Danger"] and risk_level != _previous_risk_level:
            alert_message = {
                "type": "camera", # <-- 알림 메시지임을 나타내는 타입 필드 추가
                "risk_level": risk_level,
                "final_score": final_score,
                "timestamp": datetime.now().isoformat() # 알림 발생 시간 추가
            }
            log_entry = LogCreate(
                action="camera",
                details=json.dumps({
                    "risk_level": alert_message["risk_level"],
                    "final_score": alert_message["final_score"]
                }),
                gate_id=None,
            )
            if manager.loop:
                asyncio.run_coroutine_threadsafe(
                    _save_log_to_db(log_entry), manager.loop
                )

            # log_manager.broadcast(json.dumps(alert_message)) # <-- log_manager 사용
            # print(f"[ALERT] Sent risk alert to logs: {alert_message}")

        # Update previous risk level
        _previous_risk_level = risk_level

        if risk_level == "Danger" and _previous_risk_level != "Danger":
            alarm_log_entry = LogCreate(
                action="alarm",
                details=json.dumps({
                    "risk_level": risk_level,
                    "final_score": final_score
                }),
                gate_id=None,
            )
            if manager.loop:
                asyncio.run_coroutine_threadsafe(
                    _save_log_to_db(alarm_log_entry), manager.loop
                )
            log_manager.broadcast(json.dumps({"type": "alarm", "risk_level": risk_level, "final_score": final_score, "timestamp": datetime.now().isoformat()}))
            print(f"[ALERT] Sent alarm alert to logs: {risk_level}")

        # 4. 게이트 상태 변경 시 로그 기록
        if gate_A is not None and gate_A != _previous_gate_A_status:
            gate_log_entry = LogCreate(
                action="gate",
                details=json.dumps({"gate": "A", "status": gate_A}),
                gate_id=None,
            )
            if manager.loop:
                asyncio.run_coroutine_threadsafe(
                    _save_log_to_db(gate_log_entry), manager.loop
                )
            print(f"[LOG] Gate A status changed to: {gate_A}")
            _previous_gate_A_status = gate_A

        if gate_B is not None and gate_B != _previous_gate_B_status:
            gate_log_entry = LogCreate(
                action="gate",
                details=json.dumps({"gate": "B", "status": gate_B}),
                gate_id=None,
            )
            if manager.loop:
                asyncio.run_coroutine_threadsafe(
                    _save_log_to_db(gate_log_entry), manager.loop
                )
            print(f"[LOG] Gate B status changed to: {gate_B}")
            _previous_gate_B_status = gate_B


    except json.JSONDecodeError:
        print(f"[MQTT] Error decoding JSON from message: {payload}")
    except Exception as e:
        print(f"[MQTT] An error occurred in on_message: {e}")


# --- MQTT 클라이언트 설정 및 FastAPI 생명주기 이벤트 ---
def setup_mqtt_client():
    """MQTT 클라이언트 콜백 설정 및 연결"""
    current_loop = asyncio.get_event_loop() # 현재 이벤트 루프 가져오기
    manager.set_loop(current_loop)
    log_manager.set_loop(current_loop)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.on_disconnect = on_disconnect # Assign on_disconnect callback
    mqtt_client.connect(settings.mqtt_broker, settings.mqtt_port, 60)
    mqtt_client.loop_start()

def shutdown_mqtt_client():
    """MQTT 클라이언트 루프 중지 및 연결 종료"""
    print("[MQTT] Shutting down MQTT client.")
    mqtt_client.loop_stop()
    mqtt_client.disconnect()


# --- WebSocket 엔드포인트 ---
@router.websocket("/gate-status")
async def gate_status_websocket_endpoint(websocket: WebSocket):
    """프론트엔드와 실시간 데이터 교환 및 명령 수신"""
    await manager.connect(websocket)
    print(f"[WS] Frontend client connected: {websocket.client}")
    
    try:
        # 1. 연결 시 Redis의 최신 데이터 전송
        latest_status = await redis_client.get(settings.redis_gate_status_key)
        if latest_status:
            await websocket.send_text(latest_status)
            
        # 2. 프론트엔드로부터 제어 명령 수신 및 MQTT로 발행
        while True:
            message = await websocket.receive_text()
            print(f"[WS] Message from frontend: {message}")
            try:
                msg_data = json.loads(message)
                msg_type = msg_data.get("type")
                
                if msg_type == "reset":
                    mqtt_client.publish(settings.pub_topic_jetson, payload="2", qos=1)
                    print(f"[MQTT PUB] Published to '{settings.pub_topic_jetson}': 2")
                elif msg_type == "activate":
                    mqtt_client.publish(settings.pub_topic_jetson, payload="1", qos=1)
                    print(f"[MQTT PUB] Published to '{settings.pub_topic_jetson}': 1")
                else:
                    print(f"[WS] Unknown message type: {msg_type}")
                    
            except json.JSONDecodeError:
                print(f"[WS] Invalid JSON received: {message}")
            except Exception as e:
                print(f"[WS] Error processing message: {e}")

    except WebSocketDisconnect:
        print(f"[WS] Frontend client disconnected: {websocket.client}")
    except Exception as e:
        print(f"[WS] Error in websocket endpoint: {e}")
    finally:
        manager.disconnect(websocket)


@router.websocket("/logs")
async def logs_websocket_endpoint(websocket: WebSocket):
    await log_manager.connect(websocket)
    print(f"[WS] Log client connected: {websocket.client}")
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        print(f"[WS] Log client disconnected: {websocket.client}")
        log_manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS] Error in logs websocket endpoint: {e}")
    finally:
        log_manager.disconnect(websocket)
