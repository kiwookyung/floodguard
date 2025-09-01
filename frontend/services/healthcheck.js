import axios from "./axios";

/**
 * 서버 상태를 확인하는 healthcheck API
 * @returns {Promise<Object>} 서버 상태 정보
 */
export const getHealthCheck = async () => {
  try {
    const response = await axios.get("/health");
    return response.data;
  } catch (error) {
    console.error("Healthcheck API 호출 중 오류:", error);
    throw error;
  }
};
