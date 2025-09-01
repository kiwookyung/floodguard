# 🌊 침킬 Frontend

> **지능형 CCTV 기반 침수 예방 자동화 시스템**  
> React + Vite 기반의 프론트엔드 프로젝트로, 실시간 모니터링·예측·제어 기능을 제공합니다.



## 📌 개요

- **프레임워크**: React + Vite  
- **라우팅**: `react-router-dom` (`App.jsx` → `routes/index.jsx`)  
- **상태 관리**: Zustand (`stores/authStore.js`)  
- **UI**: MUI + Tailwind CSS (커스텀 테마 적용)  
- **차트**: Recharts  
- **지도**: Leaflet + OpenStreetMap  
- **빌드/배포**: Docker, Nginx



## 📂 디렉토리 구조
```
frontend/
├── App.jsx
├── main.jsx
├── index.css
├── index.html
├── vite.config.js
├── components/
│ ├── AlertLogTable.jsx
│ ├── DashboardCards.jsx
│ ├── DevicePanel.jsx
│ ├── FeaturesSection.jsx
│ ├── GateControlModal.jsx
│ ├── HealthCheck.jsx
│ ├── HeroSection.jsx
│ ├── InteractiveMap.jsx
│ ├── LiveCameraModal.jsx
│ ├── LiveVideoFeed.jsx
│ ├── Logo.jsx
│ ├── PredictionChart.jsx
│ ├── RealTimeAlert.jsx
│ ├── SystemArchitectureSection.jsx
│ └── common/
│ ├── Footer.jsx
│ └── LoginHeader.jsx
├── pages/
│ ├── FloodDashboard.jsx
│ ├── IndexPage.jsx
│ ├── LoginPage.jsx
│ └── NotFoundPage.jsx
├── routes/
│ ├── constants.js
│ └── index.jsx
├── services/
│ ├── auth.js
│ ├── axios.js
│ ├── cameras.js
│ ├── gates.js
│ ├── healthcheck.js
│ ├── logs.js
│ ├── prediction.js
│ └── websocket.js
└── stores/
└── authStore.js
```




## 🖥 페이지 (Pages)

| 경로 | 파일 | 설명 |
|------|------|------|
| `/` | `IndexPage.jsx` | 랜딩 페이지 (Hero / Features / System Architecture) |
| `/login` | `LoginPage.jsx` | 로그인 페이지 |
| `/dashboard` | `FloodDashboard.jsx` | 메인 대시보드 (지도, 장비 제어, 로그, 예측 차트) |
| `/404` | `NotFoundPage.jsx` | 잘못된 경로 접근 시 표시 |



## 🛠 핵심 기능 컴포넌트


| 컴포넌트 | 설명 |
|----------|------|
| `DashboardCards.jsx` | 주요 지표 카드 요약 |
| `PredictionChart.jsx` | 침수 예측 라인 차트 |
| `DevicePanel.jsx` | 차수막 장비 상태/제어 |
| `AlertLogTable.jsx` | 경보 발생 내역 |
| `InteractiveMap.jsx` | CCTV/센서 지도 시각화 |
| `RealTimeAlert.jsx` | 실시간 경보 알림 (Snackbar) |
| `GateControlModal.jsx` | 장비 제어 모달 |
| `LiveCameraModal.jsx` | 실시간 영상 모달 |
| `LiveVideoFeed.jsx` | 비디오 스트리밍 플레이어 |

---

## 🎨 UI/소개 컴포넌트

| 컴포넌트 | 설명 |
|----------|------|
| `HeroSection.jsx` | 서비스 핵심 가치/CTA |
| `FeaturesSection.jsx` | 기능 소개 섹션 |
| `SystemArchitectureSection.jsx` | 아키텍처 다이어그램 |
| `Logo.jsx` | SVG 로고 |
| `common/LoginHeader.jsx` | 로그인 페이지 상단 |
| `common/Footer.jsx` | 공통 푸터 + HealthCheck |
| `HealthCheck.jsx` | 서버/DB 상태 위젯 |

---

## 🌐 Axios 설정

```javascript
import axios from "axios";

const instance = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem("auth-storage");
  const token = authStorage ? JSON.parse(authStorage).state.token : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default instance;


/**
 * @typedef {Object} Device
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {number} lat
 * @property {number} lon
 * @property {Array<number>} position
 * @property {string} status
 * @property {string} description
 * @property {boolean} [canStream]
 * @property {boolean} [is_real]
 */

/**
 * @typedef {Object} AlertLog
 * @property {string} id
 * @property {string} created_at
 * @property {string} time
 * @property {string} level
 * @property {string} device
 * @property {string} message
 * @property {JSX.Element} icon
 */

/**
 * @typedef {Object} Prediction
 * @property {string} timestamp
 * @property {number} final_score
 */
```


# API 스팩
| Endpoint                       | Method | 설명      | 요청                       | 응답                             | 오류      |
| ------------------------------ | ------ | ------- | ------------------------ | ------------------------------ | ------- |
| `/api/auth/login`              | POST   | 로그인     | `{ username, password }` | `{ access_token, token_type }` | 401     |
| `/api/auth/me`                 | GET    | 사용자 조회  | -                        | `{ id, email }`                | 401     |
| `/api/cameras`                 | GET    | CCTV 목록 | -                        | `Device[]`                     | -       |
| `/api/gates`                   | GET    | 차수막 목록  | -                        | `Device[]`                     | -       |
| `/api/gates/control`           | POST   | 전체 제어   | `{ action }`             | `{ message }`                  | 400     |
| `/api/gates/{gate_id}/control` | POST   | 단일 제어   | `{ action }`             | `{ message }`                  | 400/404 |
| `/api/logs`                    | GET    | 로그 조회   | `?period`                | `AlertLog[]`                   | -       |
| `/api/scores/history`          | GET    | 예측 조회   | -                        | `Prediction[]`                 | -       |
| `/api/health`                  | GET    | 상태 확인   | -                        | `{ status }`                   | 503     |


# 🔄 WebSocket 이벤트

| Endpoint          | 타입             | 방향    | 필드                                                 | 설명        |
| ----------------- | -------------- | ----- | -------------------------------------------------- | --------- |
| `/ws/logs`        | `log`          | S → C | `id`, `created_at`, `action`, `details`, `gate_id` | 새 알림 로그   |
| `/ws/gate-status` | `gate_status`  | S → C | `{ gate_id, status }`                              | 차수막 상태 변경 |
| `/ws/prediction`  | `prediction`   | S → C | `{ timestamp, final_score }`                       | 예측 결과     |
| `/ws/prediction`  | `start_stream` | C → S | -                                                  | 예측 스트림 시작 |
| `/ws/prediction`  | `stop_stream`  | C → S | -                                                  | 예측 스트림 중지 |


# 🗺 지도 마커 규격

| 타입          | 아이콘 | 기본 색상   | 선택 색상       | 상태   | 설명         |
| ----------- | --- | ------- | ----------- | ---- | ---------- |
| `cctv-real` | 📹  | #16a34a | #fbbf24 테두리 | 온라인  | 실시간 CCTV   |
| `cctv-sim`  | 📹  | #16a34a | #fbbf24 테두리 | 온라인  | 시뮬레이션 CCTV |
| `gate-real` | 🚪  | #3b82f6 | #fbbf24 테두리 | 온라인  | 실제 차수막     |
| `gate-sim`  | 🚪  | #3b82f6 | #fbbf24 테두리 | 온라인  | 시뮬레이션 차수막  |
| `offline`   | ❓   | #666666 | #fbbf24 테두리 | 오프라인 | 연결 끊김      |


