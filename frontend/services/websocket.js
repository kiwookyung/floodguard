/**
 * 웹소켓 연결을 생성하는 함수
 * @param {string} endpoint - 웹소켓 엔드포인트
 * @param {Function} onMessage - 메시지 수신 콜백
 * @param {Function} onError - 에러 처리 콜백
 * @returns {WebSocket} 웹소켓 인스턴스
 */
export const createWebSocket = (endpoint, onMessage, onError) => {
  // 백엔드 서버 주소로 웹소켓 URL 생성
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const backendHost = "localhost:8000"; // 백엔드 서버 주소
  const wsUrl = `${protocol}//${backendHost}${endpoint}`;

  console.log(`🌐 WebSocket 연결 시도: ${wsUrl}`);

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log(`✅ WebSocket 연결됨: ${endpoint}`);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("WebSocket 메시지 파싱 오류:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("❌ WebSocket 에러:", error);
    if (onError) onError(error);
  };

  ws.onclose = () => {
    console.log(`🔌 WebSocket 연결 종료: ${endpoint}`);
  };

  return ws;
};

/**
 * 실시간 로그 수신 웹소켓
 * @param {Function} onLogMessage - 로그 메시지 수신 콜백
 * @returns {WebSocket} 웹소켓 인스턴스
 */
export const createLogsWebSocket = (onLogMessage) => {
  return createWebSocket("/ws/logs", onLogMessage);
};

/**
 * 실시간 차수막 상태 수신 웹소켓
 * @param {Function} onGateStatusMessage - 차수막 상태 메시지 수신 콜백
 * @returns {WebSocket} 웹소켓 인스턴스
 */
export const createGateStatusWebSocket = (onGateStatusMessage) => {
  return createWebSocket("/ws/gate-status", onGateStatusMessage);
};

/**
 * 예측 확률 실시간 수신 웹소켓
 * @param {Function} onPredictionMessage - 예측 메시지 수신 콜백
 * @returns {WebSocket} 웹소켓 인스턴스
 */
// 백엔드 테스트를 위해 임시 활성화
export const createPredictionWebSocket = (onPredictionMessage) => {
  try {
    // 백엔드 테스트용 WebSocket 연결
    return createWebSocket("/ws/prediction", onPredictionMessage);
  } catch (error) {
    console.warn("예측 WebSocket 연결 실패, 폴링 방식 사용:", error);
    return null;
  }
};
