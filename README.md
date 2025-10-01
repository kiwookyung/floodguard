# 🌊 침수킬러 (FloodGuard)

> **지능형 CCTV 기반 침수 예방 자동화 시스템**  
> 침수 피해를 최소화하기 위해 **AIoT 기반 CCTV 감지, 예측, 자동 차수막 제어, 실시간 모니터링** 기능을 제공하는 프로젝트입니다.

---

## 📌 프로젝트 개요

- **목적**: 도심 침수 피해 예방 및 대응 자동화
- **핵심 기능**:
  - Jetson 기반 AI로 **실시간 침수 감지**
  - 예측 모델 기반 **침수 위험도 산출**
  - Raspberry Pi 연동 **자동 차수막 제어**
  - 대시보드에서 **실시간 모니터링 및 수동 제어**
  - CCTV 스트리밍 및 로그/알림 시스템 제공

---

## 🛠 기술 스택

| 분야          | 사용 기술 |
|--------------|-------------------------------------------|
| **Frontend** | React + Vite, Zustand, MUI, Tailwind, Recharts, Leaflet(OSM) |
| **Backend**  | FastAPI, SQLAlchemy, Alembic |
| **DB/Cache** | PostgreSQL, Redis |
| **Infra**    | AWS EC2, Docker Compose, Traefik |
| **기타**     | WebSocket, JWT 인증 |

---

## 📂 프로젝트 구조

```
Frontend
frontend/
├── App.jsx
├── components/
│ ├── DashboardCards.jsx
│ ├── PredictionChart.jsx
│ ├── DevicePanel.jsx
│ ├── AlertLogTable.jsx
│ ├── InteractiveMap.jsx
│ ├── LiveCameraModal.jsx
│ ├── LiveVideoFeed.jsx
│ └── common/
│ ├── Footer.jsx
│ └── LoginHeader.jsx
├── pages/
│ ├── IndexPage.jsx
│ ├── LoginPage.jsx
│ ├── FloodDashboard.jsx
│ └── NotFoundPage.jsx
├── routes/
├── services/
└── stores/


Backend
api/
├── core/ # 환경설정, 보안, DB 연결
├── src/
│ ├── users/ # 사용자 관리
│ ├── devices/ # CCTV, 차수막 제어
│ ├── logs/ # 알림 로그
│ └── prediction/ # 예측 API
├── utils/
└── main.py
```


---

## 📸 서비스 화면

| 메인 대시보드 | CCTV 스트리밍 | 차수막 제어 |
|---------------|---------------|-------------|
| ![dashboard](https://github.com/user-attachments/assets/5ac51856-cacc-491c-84b2-193c50d28f90) | ![cctv](https://github.com/user-attachments/assets/fe40a58a-b94e-46bc-bbaa-b1a962f60f23) | ![차수막 제어](https://github.com/user-attachments/assets/IMG_3044-ezgif.com-video-to-gif-converter.gif) |

---

## 🎥 시연 GIF

### 침수 감지 및 알림
![침수 감지](https://github.com/user-attachments/assets/IMG_3044-ezgif.com-video-to-gif-converter.gif)

### 자동 차수막 제어
![차수막 제어](https://github.com/user-attachments/assets/IMG_3045-ezgif.com-video-to-gif-converter.gif)




## 🌐 주요 API (예시)

| Endpoint                       | Method | 설명        |
| ------------------------------ | ------ | ----------- |
| `/api/auth/login`              | POST   | 로그인 |
| `/api/auth/me`                 | GET    | 사용자 조회 |
| `/api/cameras`                 | GET    | CCTV 목록 |
| `/api/gates/{gate_id}/control` | POST   | 단일 차수막 제어 |
| `/api/logs`                    | GET    | 경보 로그 조회 |
| `/api/scores/history`          | GET    | 예측 결과 조회 |

---

## 🔄 WebSocket 이벤트

| Endpoint      | 이벤트 타입   | 설명             |
|---------------|--------------|------------------|
| `/ws/logs`    | `log`        | 새로운 경보 로그 |
| `/ws/gate-status` | `gate_status` | 차수막 상태 변경 |
| `/ws/prediction`  | `prediction`  | 예측 결과 스트림 |

---

## 🚀 실행 방법

### 1) 환경변수 설정

cp .env.example .env

### 2) 도커 실행
docker-compose up -d

### #) 접속
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

---

## 🐞 트러블슈팅

- Git Large File Storage(LFS) 문제: 모델 가중치 파일은 Git LFS로 관리

- WebSocket 지연: Nginx 설정에서 버퍼 크기 조정

- MQTT 연결 불안정: 브로커 QoS 레벨 최적화

---

## 👥 팀 구성 및 역할

- 팀장: 기획 및 전체 아키텍처 설계

- Frontend(기우경): React 대시보드, CCTV/지도 UI, 알림 시스템

- Backend(최승훈): FastAPI 서버, WebSocket, DB 설계

- AI/IoT(강민정,김성재,서양하,정상진): Jetson 모델 학습, Raspberry Pi 연동, 장비 제어


## 성과 및 배운 점

### 성과

- 침수 대응을 위한 실시간 모니터링 시스템 구현

- AI + IoT + 웹 통합 서비스 개발 경험 축적

### 배운 점

- 대규모 팀 프로젝트에서 역할 분담과 협업의 중요성

- WebSocket, 실시간 스트리밍, 인프라 자동화 경험

- 프론트엔드·백엔드·AIoT의 연동 과정 이해

---
## 📜 라이선스

이 프로젝트는 내부 학습/연구 목적이며 별도 라이선스 없이 사용되었습니다.
