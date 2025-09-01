import cv2
import numpy as np
from ultralytics import YOLO

polygon_points = []
drawing = True

def mouse_callback(event, x, y, flags, param):
    global polygon_points, drawing
    if event == cv2.EVENT_LBUTTONDOWN and drawing:
        polygon_points.append((x, y))
    elif event == cv2.EVENT_RBUTTONDOWN and drawing:
        drawing = False  # polygon 선택 완료


cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FPS, 30)


cv2.namedWindow("Select Polygon")
cv2.setMouseCallback("Select Polygon", mouse_callback)


# 1. 첫 프레임에서 polygon 선택
while True:
    ret, frame = cap.read()
    if not ret:
        break
    frame = cv2.resize(frame, (640, 640))
    display = frame.copy()
    # 찍은 점들 그리기
    for pt in polygon_points:
        cv2.circle(display, pt, 5, (0, 0, 255), -1)
    if len(polygon_points) > 1:
        cv2.polylines(display, [np.array(polygon_points)], False, (0,255,0), 2)
    cv2.imshow("Select Polygon", display)
    if not drawing:
        break
    if cv2.waitKey(1) & 0xFF == ord('q'):  # ESC 종료
        cap.release()
        cv2.destroyAllWindows()
        exit()
print(np.array(polygon_points))


# 2. polygon mask 생성
mask = np.zeros(frame.shape[:2], dtype=np.uint8)
cv2.fillPoly(mask, [np.array(polygon_points)], 255)


# 3. 이후 프레임에서 polygon 영역만 잘라서 보여줌
while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.resize(frame, (640, 640))
    result = cv2.bitwise_and(frame, frame, mask=mask)

    cv2.destroyWindow("Select Polygon")
    cv2.imshow("Polygon Cropped Stream", result)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break


cap.release()
cv2.destroyAllWindows()