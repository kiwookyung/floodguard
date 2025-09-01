# AI/detection/detect_and_score_vis.py
import os
import sys
import cv2
import torch
import numpy as np
from ultralytics import YOLO

import paho.mqtt.client as mqtt
import json

# ───────────────────────────────
# 경로 설정: 모듈 import 용
CUR_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.abspath(os.path.join(CUR_DIR, ".."))
sys.path.append(AI_ROOT)

if AI_ROOT not in sys.path:
    sys.path.append(AI_ROOT)

from scoring.compute_risk import compute_flood_risk
from detection.model import FastSCNN

# ───────────────────────────────
# 설정
YOLO_MODEL_PATH = os.path.join(AI_ROOT, "model", "drain.pt")
CNN_MODEL_PATH = os.path.join(AI_ROOT, "model", "water.pth")

VIDEO_PATH = os.path.join(AI_ROOT, "test", "test_mov", "test_mov.mp4") 
# VIDEO_PATH = os.path.join(AI_ROOT, "output", "test1.mp4")
# VIDEO_PATH = 0 # 카메라로 실행

DEM_CSV_PATH = os.path.join(AI_ROOT, "data", "dem_risk_avg_score.csv")

YOLO_CONF_THRESHOLD = 0.4
FRAME_SIZE = (640, 640)
MIRROR = 0

# 화면 시각화 토글
VISUAL = True          # ← True면 창 띄움, False면 헤드리스
USE_MOUSE = False       # ← True면 마우스로 ROI 선택

# 화면 표시 전용 크기 (Jetson 화면 안에 맞춤)
DISPLAY_MAX_W = 480
DISPLAY_MAX_H = 480

# 저장 설정
SAVE_VIDEO = True
OUTPUT_DIR = os.path.join(AI_ROOT, "output")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "test1.mp4")

# MQTT 설정
BROKER = "192.168.100.92"
PORT = 1883
CLIENT_ID = "jetson-detector"
PUB_TOPIC = "topic/jetson_score"

# ───────────────────────────────
# 디바이스 설정
device = 'cuda' if torch.cuda.is_available() else 'cpu'

# ───────────────────────────────
# 모델 로드
drain_model = YOLO(YOLO_MODEL_PATH)
water_model = FastSCNN(in_channels=3, num_classes=2).to(device)
water_model.load_state_dict(torch.load(CNN_MODEL_PATH, map_location=device))
water_model.eval()

# ───────────────────────────────
def drain_detect(frame):
    # frame: BGR, ROI가 이미 적용된 프레임
    results = drain_model.predict(frame, conf=YOLO_CONF_THRESHOLD, verbose=False)
    return results[0]

def water_detect_mask(frame_bgr):
    # 0: 배경, 1: 물(가정)
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    input_tensor = torch.from_numpy(frame_rgb).permute(2, 0, 1).unsqueeze(0).float() / 255.0
    input_tensor = input_tensor.to(device)
    with torch.no_grad():
        output = water_model(input_tensor)
    pred_mask = torch.argmax(output, dim=1).squeeze(0).cpu().numpy().astype(np.uint8)
    return pred_mask

# ───────────────────────────────
# 0, 1로 된 마스크 빈 부분 메워주기 (0: 배경, 1: 물 영역)
MORPH_KERNEL_SIZE = 5  # hyper-parameter
MORPH_ITER = 1

def fill_holes(binary_mask, ksize=5, iterations=1):
    m = (binary_mask.astype(np.uint8)) * 255
    kernel = np.ones((ksize, ksize), np.uint8)
    closed = cv2.morphologyEx(m, cv2.MORPH_CLOSE, kernel, iterations=iterations)
    return (closed > 0).astype(np.uint8)

# ───────────────────────────────
# 시각화 유틸
def visualize(full_frame, drain_result, water_filled, polygon_points, puddle_ratio):
    vis = full_frame.copy()

    # 물 영역 컨투어
    contours, _ = cv2.findContours(water_filled.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(vis, contours, -1, (225, 75, 75), 2)

    # ROI 경계선
    if polygon_points and len(polygon_points) >= 2:
        pts = np.array(polygon_points, dtype=np.int32).reshape((-1, 1, 2))
        cv2.polylines(vis, [pts], isClosed=True, color=(225, 225, 225), thickness=2)

    # YOLO bbox
    for box in getattr(drain_result, "boxes", []):
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cls = int(box.cls[0])
        color = (75, 225, 75) if drain_result.names[cls] == "clean" else (75, 75, 225)
        label = f"{drain_result.names[cls]}"
        cv2.rectangle(vis, (x1, y1), (x2, y2), color, 2)
        cv2.putText(vis, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    # 텍스트 (퍼센트 표시)
    cv2.putText(vis, f"Water in ROI (filled): {puddle_ratio*100:.1f}%", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
    return vis


# 비율을 유지한 채 지정된 크기 이하로 축소 & 중앙에 여백 추가
# letterbox=False → 비율 유지하고 축소만
# letterbox=True → 축소 후 남는 공간을 검은색 여백으로 채워서 지정한 캔버스 크기에 맞춤
def resize_keep_aspect(img, max_w, max_h, letterbox=False):
    h, w = img.shape[:2]
    scale = min(max_w / w, max_h / h)

    if scale >= 1.0:
        return img  

    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

    if not letterbox:
        return resized

    canvas = np.zeros((max_h, max_w, 3), dtype=img.dtype)
    y = (max_h - new_h) // 2
    x = (max_w - new_w) // 2
    canvas[y:y + new_h, x:x + new_w] = resized

    return canvas


# ───────────────────────────────
polygon_points = []
drawing = True
def mouse_callback(event, x, y, flags, param):
    global polygon_points, drawing
    if event == cv2.EVENT_LBUTTONDOWN and drawing:
        polygon_points.append((x, y))
    elif event == cv2.EVENT_RBUTTONDOWN and drawing:
        drawing = False

# ───────────────────────────────
def main():
    global polygon_points, drawing

    mqtt_client = mqtt.Client(client_id=CLIENT_ID)
    mqtt_client.connect(BROKER, PORT)
    print("MQTT 연결 성공")

    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        print("영상을 열 수 없습니다.")
        return

    # ROI 지정
    if USE_MOUSE:
        # 마우스로 ROI 찍기 (좌클릭: 점 추가, 우클릭: 종료, q: 취소)
        cv2.namedWindow("Select ROI")
        cv2.setMouseCallback("Select ROI", mouse_callback)

        while True:
            ret, frame = cap.read()
            if not ret:
                print("ROI 선택 중 프레임을 불러오지 못했습니다.")
                return
            frame = cv2.resize(frame, FRAME_SIZE)
            if MIRROR:
                frame = cv2.flip(frame, 1)

            display = frame.copy()
            # 안내 텍스트
            cv2.putText(display, "Left click: add point  |  Right click: finish  |  q: cancel",
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 200, 255), 2)
            # 찍은 점/가이드 라인
            for pt in polygon_points:
                cv2.circle(display, pt, 5, (0, 0, 255), -1)
            if len(polygon_points) > 1:
                cv2.polylines(display, [np.array(polygon_points)], False, (0, 255, 0), 2)

            cv2.imshow("Select ROI", display)
            key = cv2.waitKey(1) & 0xFF
            if not drawing:
                break
            if key == ord('q'):
                cv2.destroyWindow("Select ROI")
                print("ROI 선택이 취소되었습니다.")
                return

        cv2.destroyWindow("Select ROI")

        if len(polygon_points) < 3:
            print("ROI 다각형은 최소 3개의 점이 필요합니다.")
            return

        # ROI 마스크 생성
        roi_mask_template = np.zeros((FRAME_SIZE[1], FRAME_SIZE[0]), dtype=np.uint8)
        cv2.fillPoly(roi_mask_template, [np.array(polygon_points, dtype=np.int32)], 255)

        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

    else:
        # 고정 ROI (FRAME_SIZE 기준 좌표)
        polygon_points = [
            (253, 613), (307, 638), (469, 639), (456, 568), (458, 562),
            (508, 541), (540, 528), (595, 509), (595, 501), (562, 459),
            (529, 424), (492, 381), (482, 381), (469, 371), (464, 369), 
            (449, 373), (441, 366), (435, 351), (437, 334), (446, 312), 
            (460, 283), (477, 248), (480, 241), (493, 108), (473, 106), 
            (447, 100), (415,  92), (402, 124), (366, 205), (351, 199), 
            (338, 183), (335, 162), (311, 160), (273, 157), (235, 156), 
            (226, 241), (250, 264), (258, 280), (278, 304), (271, 320), 
            (268, 371), (265, 404), (267, 468), (261, 511), (258, 562), 
            (252, 581), (255, 588)
        ]
        roi_mask_template = np.zeros((FRAME_SIZE[1], FRAME_SIZE[0]), dtype=np.uint8)
        cv2.fillPoly(roi_mask_template, [np.array(polygon_points, dtype=np.int32)], 255)

    roi_pixel_count = int(np.count_nonzero(roi_mask_template))

    # ──── 영상 저장용
    out = None
    if SAVE_VIDEO:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        # 입력 FPS가 0/NaN이면 30으로 대체
        fps = cap.get(cv2.CAP_PROP_FPS)
        try:
            fps = float(fps)
        except Exception:
            fps = 0.0
        if fps is None or fps <= 1.0:
            fps = 30.0
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(OUTPUT_PATH, fourcc, fps, FRAME_SIZE)
        if not out.isOpened():
            print("[경고] VideoWriter 초기화 실패. 영상 저장이 비활성화됩니다.")
            out = None
        else:
            print(f"[INFO] 저장 시작: {OUTPUT_PATH} (FPS={fps}, SIZE={FRAME_SIZE})")

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.resize(frame, FRAME_SIZE)
        if MIRROR:
            frame = cv2.flip(frame, 1)

        # ROI 적용
        masked_frame = cv2.bitwise_and(frame, frame, mask=roi_mask_template)

        # 1) 하수구 탐지
        drain_result = drain_detect(masked_frame)
        clean_count = 0
        unclean_count = 0
        for box in getattr(drain_result, "boxes", []):
            cls = int(box.cls[0])
            label = drain_result.names[cls]
            if label == "clean":
                clean_count += 1
            else:
                unclean_count += 1

        # 2) 물 마스크 & ROI 기준 물 비율 계산 (클로징으로 구멍 메워 계산)
        water_mask = water_detect_mask(masked_frame)   # 0: 배경, 1: 물
        water_in_roi = np.logical_and(water_mask == 1, roi_mask_template == 255).astype(np.uint8)
        water_filled = fill_holes(water_in_roi, ksize=MORPH_KERNEL_SIZE, iterations=MORPH_ITER)
        puddle_ratio = (float(water_filled.sum()) / float(roi_pixel_count)) if roi_pixel_count > 0 else 0.0

        # 3) 점수 계산 호출 
        df = compute_flood_risk(
            dem_csv_path=DEM_CSV_PATH,
            clean_count=clean_count,
            unclean_count=unclean_count,
            puddle_ratio=puddle_ratio
        )

        # 로그 출력(필요 시 MQTT 전송/CSV 저장 등으로 교체)
        print(f"[FRAME] clean={clean_count}, unclean={unclean_count}, puddle_ratio(roi, filled)={puddle_ratio:.3f}")
        print(df.head(3))
        print("=" * 60)

        if not df.empty:
            first_row = df.iloc[0]
            score_data = {
                "final_score": float(first_row["final_score"]),
                "risk_level": str(first_row["risk_level"])
            }
            payload = json.dumps(score_data)
            mqtt_client.publish(PUB_TOPIC, payload)
            print(f"MQTT Published: {payload}")

        # 시각화 프레임 생성 
        final_vis = visualize(frame, drain_result, water_filled, polygon_points, puddle_ratio)

        # 영상 저장 
        if out is not None:
            out.write(final_vis)

        # 표시 (VISUAL이 True일 때만)
        if VISUAL:
            show = resize_keep_aspect(final_vis, DISPLAY_MAX_W, DISPLAY_MAX_H, letterbox=True)
            cv2.imshow("AI Detection", show)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    mqtt_client.disconnect()
    if out is not None:
        out.release()
        print(f"[INFO] 저장 완료: {OUTPUT_PATH}")
    if VISUAL:
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
