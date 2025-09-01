import axios from "./axios";

/**
 * 과거 로그 조회 API
 * @param {string} period - 기간 (day, week, month)
 * @returns {Promise<Array>} 로그 목록
 */
export const getLogs = async (period = "day") => {
  try {
    const response = await axios.get(`/logs/?period=${period}`);
    return response.data;
  } catch (error) {
    console.error("과거 로그 조회 중 오류:", error);
    throw error;
  }
};
