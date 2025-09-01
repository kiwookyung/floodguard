import RPi.GPIO as GPIO
import time
import threading
import paho.mqtt.client as mqtt
import json

# --- 설정 ---
BROKER = "192.168.100.92"
PORT = 1883
CLIENT_ID = "rpi-motor-controller"
PUB_TOPIC_STATUS = "topic/rpi_work"
SUB_TOPIC_JETSON = "topic/jetson_score"
SUB_TOPIC_MANUAL = "topic/backend_command"

# 모터 제어 GPIO 핀 (BCM 모드)
IN1, IN2 = 6, 26   # Gate A
IN4, IN3 = 23, 24  # Gate B

# LED 및 부저 GPIO 핀 (세트별)
LED1, BUZZ1 = 27, 21
LED2, BUZZ2 = 17, 20


# 음계별 주파수
NOTE_FREQUENCIES = {
    'C4': 262, 'D4': 294, 'E4': 330, 'F4': 349,
    'G4': 392, 'A4': 440, 'B4': 494,
    'C5': 523, 'D5': 587, 'E5': 659
}

# 무궁화 꽃이 피었습니다 멜로디
MELODY = [
    ('E4', 0.7), ('A4', 0.7), ('A4', 1.2), ('A4', 1.2), ('G4', 1.2),
    ('A4', 0.7), ('A4', 0.7), ('E4', 0.7), ('E4', 0.7), ('G4', 1.2)
]

# --- 동작 시간(초) ---
A_CLOSE_TIME = 5.05
B_CLOSE_TIME = 3.70
# 수동 open 시간은 닫힘과 동일하게 가정 (필요시 조정)
A_OPEN_TIME  = 5.25
B_OPEN_TIME  = 3.70

# Jetson Danger일 때 A 시작 기준으로 B를 시작할 지연(초)
A_DELAY_AFTER_B_START = 5.00

# --- GPIO 초기화 ---
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

pins = [IN1, IN2, IN4, IN3, LED1, LED2]
for p in pins:
    GPIO.setup(p, GPIO.OUT)
    GPIO.output(p, GPIO.LOW)

# 부저 PWM 초기화 (현재 미사용)
GPIO.setup(BUZZ1, GPIO.OUT)
GPIO.setup(BUZZ2, GPIO.OUT)
pwm_b1 = GPIO.PWM(BUZZ1, 1000)
pwm_b2 = GPIO.PWM(BUZZ2, 1000)

# --- 상태 관리 변수 ---
gate_states = {"gate_a": "OPEN", "gate_b": "OPEN"}
jetson_data = {}
is_motor_running = False
busy_reason = None
danger_sequence_activated = False  # Danger 최초 1회만 동작

# ─────────────────────────────────────
# 유틸: 모터 제어
def control_motor(gate, direction):
    if gate == 'A':
        in_pins, led_pin, key = (IN1, IN2), LED1, "gate_a"
    else:  # gate == 'B'
        in_pins, led_pin, key = (IN4, IN3), LED2, "gate_b"

    if direction == "forward":     # 열기 방향
        GPIO.output(in_pins[0], GPIO.LOW)
        GPIO.output(in_pins[1], GPIO.HIGH)
        GPIO.output(led_pin, GPIO.HIGH)
        gate_states[key] = "OPEN"
    elif direction == "backward":  # 닫기 방향
        GPIO.output(in_pins[0], GPIO.HIGH)
        GPIO.output(in_pins[1], GPIO.LOW)
        GPIO.output(led_pin, GPIO.HIGH)
        gate_states[key] = "CLOSED"
    else:  # stop
        GPIO.output(in_pins[0], GPIO.LOW)
        GPIO.output(in_pins[1], GPIO.LOW)
        GPIO.output(led_pin, GPIO.LOW)

def stop_all_motors():
    control_motor('A', 'stop')
    control_motor('B', 'stop')

def move_gate_for(gate, direction, duration_s):
    """gate('A'|'B'), direction('forward'|'backward'), duration in seconds"""
    control_motor(gate, direction)
    time.sleep(duration_s)
    control_motor(gate, 'stop')

# 멜로디 연주 함수
def play_melody(pwm):
    for note, length in MELODY:
        freq = NOTE_FREQUENCIES.get(note)
        if freq:
            pwm.ChangeFrequency(freq)
            pwm.start(50)
            time.sleep(0.4 * length)
            pwm.stop()
            time.sleep(0.05)

# ─────────────────────────────────────
# 시퀀스: Jetson Danger 전용 (B 먼저, B 시작 5초 뒤 A 시작)
def danger_close_sequence():
    print("[SEQ] Danger: Close B immediately, start A after 5s")

    melody_thread1 = threading.Thread(target=play_melody, args=(pwm_b1,))
    melody_thread2 = threading.Thread(target=play_melody, args=(pwm_b2,))
    melody_thread1.start()
    melody_thread2.start()
    melody_thread1.join()

    # B 닫기 즉시 시작 → 3.75초 후 반드시 정지
    control_motor('B', 'backward')

    # B는 A 시작 기준 5초 지연 후 5초간 동작
    def start_a_after_delay():
        time.sleep(A_DELAY_AFTER_B_START)
        control_motor('A', 'backward')
        time.sleep(A_CLOSE_TIME)
        control_motor('A', 'stop')
        print("[SEQ] Gate A closed.")

    t_b = threading.Thread(target=start_a_after_delay, daemon=True)
    t_b.start()

    # B는 3.75초 후 정지 (A와 무관하게 정해진 시간만 작동)
    time.sleep(B_CLOSE_TIME)
    control_motor('B', 'stop')
    print("[SEQ] Gate B closed.")

    # A 종료까지 대기 (A는 시작 후 5초만 작동)
    t_b.join()
    print("[SEQ] Danger close sequence finished.")

# 수동: ALL close  **동시 작동(지연 없음)**
def manual_close_all_sequence():
    print("[SEQ] Manual: Close ALL (simultaneous, no delay)")
    t_a = threading.Thread(target=move_gate_for, args=('A', 'backward', A_CLOSE_TIME), daemon=True)
    t_b = threading.Thread(target=move_gate_for, args=('B', 'backward', B_CLOSE_TIME), daemon=True)
    t_a.start(); t_b.start()
    t_a.join(); t_b.join()
    print("[SEQ] Manual ALL close sequence finished.")

# 수동: ALL open  동시에 오픈
def manual_open_all_sequence():
    print("[SEQ] Manual: Open ALL (simultaneous)")
    t_a = threading.Thread(target=move_gate_for, args=('A', 'forward', A_OPEN_TIME), daemon=True)
    t_b = threading.Thread(target=move_gate_for, args=('B', 'forward', B_OPEN_TIME), daemon=True)
    t_a.start(); t_b.start()
    t_a.join(); t_b.join()
    print("[SEQ] Manual ALL open sequence finished.")

# === [ADD] 수동 명령 워커 ===
def manual_worker(client, gate, command):
    global is_motor_running, busy_reason
    try:
        if command == "close":
            if gate == "ALL":
                manual_close_all_sequence()
            elif gate == "A":
                move_gate_for('A', 'backward', A_CLOSE_TIME)
                print("[MANUAL] Gate A closed.")
            elif gate == "B":
                move_gate_for('B', 'backward', B_CLOSE_TIME)
                print("[MANUAL] Gate B closed.")
        elif command == "open":
            if gate == "ALL":
                manual_open_all_sequence()
            elif gate == "A":
                move_gate_for('A', 'forward', A_OPEN_TIME)
                print("[MANUAL] Gate A opened.")
            elif gate == "B":
                move_gate_for('B', 'forward', B_OPEN_TIME)
                print("[MANUAL] Gate B opened.")
    except Exception as e:
        print(f"[MANUAL] Worker error: {e}")
    finally:
        stop_all_motors()
        publish_status(client)  # 수동 끝난 직후 현재 상태 publish
        is_motor_running = False
        busy_reason = None
        print("[MANUAL] Finished. System idle -> Jetson messages will be handled again.")


# ─────────────────────────────────────
# MQTT
def publish_status(client):
    combined_status = {**jetson_data, **gate_states}
    payload = json.dumps(combined_status)
    result = client.publish(PUB_TOPIC_STATUS, payload, qos=1)
    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        print(f"[MQTT] Published status: {payload}")
    else:
        print(f"[MQTT] Publish failed. RC: {result.rc}")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker!")
        client.subscribe([(SUB_TOPIC_JETSON, 1), (SUB_TOPIC_MANUAL, 1)])
    else:
        print(f"Failed to connect, return code {rc}")

def on_message(client, userdata, msg):
    global is_motor_running, busy_reason, jetson_data, danger_sequence_activated

    # 모터 동작 중에는 두 토픽 모두 무시
    if is_motor_running:
        print(f"[MQTT] Busy ({busy_reason}). Ignoring message from {msg.topic}.")
        return

    try:
        message_str = msg.payload.decode('utf-8').strip()
        print(f"[MQTT] Received from {msg.topic}: {message_str}")

        # ---------- backend_command (최우선) ----------
        if msg.topic == SUB_TOPIC_MANUAL:
            try:
                payload = json.loads(message_str)
                gate = payload.get("gate")
                command = payload.get("command")

                if gate not in ("ALL", "A", "B") or command not in ("open", "close"):
                    print("[MANUAL] Invalid command format.")
                    publish_status(client)
                    return

                print(f"[MANUAL] Executing: gate={gate}, command={command}")
                is_motor_running = True
                busy_reason = "manual"

                # === [CHANGE] 블로킹 실행 -> 비동기 워커로 실행 후 즉시 반환
                threading.Thread(
                    target=manual_worker,
                    args=(client, gate, command),
                    daemon=True
                ).start()
                return

            except json.JSONDecodeError:
                print(f"[MANUAL] Invalid JSON: {message_str}")
                publish_status(client)
                return

        # ---------- jetson_score ----------
        elif msg.topic == SUB_TOPIC_JETSON:
            try:
                payload = json.loads(message_str)
                jetson_data = payload
                risk_level = payload.get("risk_level")
            except json.JSONDecodeError:
                print(f"[JETSON] Invalid JSON: {message_str}")
                publish_status(client)
                return

            # Danger: 최초 1회만 실행
            if str(risk_level).lower() == "danger":
                if danger_sequence_activated:
                    print("[JETSON] Danger already handled before. Ignoring.")
                    publish_status(client)
                    return

                print("[JETSON] Danger detected (first time). Starting close sequence.")
                danger_sequence_activated = True
                is_motor_running = True
                busy_reason = "jetson"
                try:
                    danger_close_sequence()
                finally:
                    stop_all_motors()
                    publish_status(client)
                    is_motor_running = False
                    busy_reason = None
                return
            else:
                print("[JETSON] No action needed for current risk level.")
                publish_status(client)
                return

        # ---------- 기타 ----------
        else:
            print(f"[MQTT] Unhandled topic: {msg.topic}")
            publish_status(client)

    except Exception as e:
        print(f"[ERROR] on_message exception: {e}")
        try:
            stop_all_motors()
        except:
            pass
        publish_status(client)
        is_motor_running = False
        busy_reason = None

# --- 메인 ---
if __name__ == "__main__":
    client = mqtt.Client(client_id=CLIENT_ID)
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(BROKER, PORT, 60)
        time.sleep(1)
        client.publish(PUB_TOPIC_STATUS, json.dumps(gate_states), qos=1)
        client.loop_forever()
    except KeyboardInterrupt:
        print("\nProgram interrupted by user. Cleaning up...")
    finally:
        stop_all_motors()
        pwm_b1.stop()
        pwm_b2.stop()
        GPIO.cleanup()
        try:
            client.disconnect()
        except:
            pass
        print("GPIO cleaned up and MQTT client disconnected. Exiting.")