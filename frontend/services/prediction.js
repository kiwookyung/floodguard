import axios from "./axios";

/**
 * 예측 확률 과거 데이터 조회 API
 * @returns {Promise<Array>} 예측 과거 데이터
 */
export const getPredictionHistory = async () => {
  try {
    const response = await axios.get("/scores/history");
    return response.data;
  } catch (error) {
    console.error("예측 과거 데이터 조회 중 오류:", error);
    throw error;
  }
};
