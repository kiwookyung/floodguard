import cv2
import torch
import numpy as np
from model import FastSCNN
from ultralytics import YOLO

# ───────────────────────────────
# 설정
YOLO_MODEL_PATH = "./model/drain.pt"
CNN_MODEL_PATH = "./model/water.pth"
VIDEO_PATH = "./test/test_mov/test_mov.mp4" # 0: 카메라
YOLO_CONF_THRESHOLD = 0.4
FRAME_SIZE = (640, 640)
MIRROR = 0
USE_MOUSE = False  # ← True면 마우스로 ROI 선택, False면 아래 polygon_points 사용

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
# 모델 추론: drain (YOLO)
def drain_detect(frame):
    results = drain_model.predict(frame, conf=YOLO_CONF_THRESHOLD)
    return results[0]

# ───────────────────────────────
# 모델 추론: water (FastSCNN)
def water_detect(frame):
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    input_tensor = torch.from_numpy(frame_rgb).permute(2, 0, 1).unsqueeze(0).float() / 255.0
    input_tensor = input_tensor.to(device)
    with torch.no_grad():
        output = water_model(input_tensor)
    pred_mask = torch.argmax(output, dim=1).squeeze(0).cpu().numpy().astype(np.uint8)
    return pred_mask

# ───────────────────────────────
# 시각화
def visualize(full_frame, drain_result, water_mask):
    vis = full_frame.copy()

    # CNN 시각화 (파란색 영역)
    # overlay = vis.copy()
    # overlay[water_mask == 1] = (255, 0, 0)
    # vis = cv2.addWeighted(overlay, 0.4, vis, 0.6, 0)

    # 윤곽선
    contours, _ = cv2.findContours(water_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(vis, contours, -1, (225, 75, 75), 2)

    # YOLO bbox
    for box in drain_result.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cls = int(box.cls[0])
        color = (75, 225, 75) if drain_result.names[cls] == "clean" else (75, 75, 225)
        label = f"{drain_result.names[cls]}"
        cv2.rectangle(vis, (x1, y1), (x2, y2), color, 2)
        cv2.putText(vis, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    return vis

# ───────────────────────────────
# 마우스 기반 ROI 선택
polygon_points = []
drawing = True
def mouse_callback(event, x, y, flags, param):
    global polygon_points, drawing
    if event == cv2.EVENT_LBUTTONDOWN and drawing:
        polygon_points.append((x, y))
    elif event == cv2.EVENT_RBUTTONDOWN and drawing:
        drawing = False

# ───────────────────────────────
# 메인
def main():
    global polygon_points, drawing

    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        print("영상을 열 수 없습니다.")
        return

    # ▷ ROI 선택
    if USE_MOUSE:
        cv2.namedWindow("Select ROI")
        cv2.setMouseCallback("Select ROI", mouse_callback)

        while True:
            ret, frame = cap.read()
            if not ret:
                return
            frame = cv2.resize(frame, FRAME_SIZE)
            if MIRROR:
                frame = cv2.flip(frame, 1)

            display = frame.copy()
            for pt in polygon_points:
                cv2.circle(display, pt, 5, (0, 0, 255), -1)
            if len(polygon_points) > 1:
                cv2.polylines(display, [np.array(polygon_points)], False, (0, 255, 0), 2)

            cv2.imshow("Select ROI", display)
            if not drawing:
                break
            if cv2.waitKey(1) & 0xFF == ord('q'):
                return

        cv2.destroyWindow("Select ROI")

    else:
        # ROI 수동 지정
        polygon_points = [
            (418, 639), (409, 561), (513, 497), (430, 356), (422, 360),
            (416, 350), (395, 358), (387, 343), (397, 306), (420, 247),
            (425, 101), (368, 90), (337, 178), (322, 142), (233, 142),
            (228, 243), (244, 267), (265, 305), (259, 351), (259, 384),
            (258, 455), (255, 517), (250, 582), (254, 623), (284, 639)
        ]

    # ▷ ROI 마스크 생성
    roi_mask = np.zeros((FRAME_SIZE[1], FRAME_SIZE[0]), dtype=np.uint8)
    cv2.fillPoly(roi_mask, [np.array(polygon_points)], 255)

    # ▷ 저장용 VideoWriter 설정
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # 코덱 설정
    out = cv2.VideoWriter('./output/result.mp4', fourcc, 30.0, FRAME_SIZE)  # 경로, 코덱, FPS, 크기

    # ▷ 탐지 루프
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.resize(frame, FRAME_SIZE)
        if MIRROR:
            frame = cv2.flip(frame, 1)

        masked_frame = cv2.bitwise_and(frame, frame, mask=roi_mask)

        drain_result = drain_detect(masked_frame)
        water_mask = water_detect(masked_frame)

        final_vis = visualize(frame, drain_result, water_mask)

        out.write(final_vis)  # 영상 저장
        # 화면 출력 제거
        # cv2.imshow("AI Detection", final_vis)
        # if cv2.waitKey(1) & 0xFF == ord('q'):
        #     break

    cap.release()
    out.release()  # 저장 완료
    cv2.destroyAllWindows()


# ───────────────────────────────
if __name__ == "__main__":
    main()
