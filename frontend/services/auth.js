import axios from "./axios";

/**
 * 사용자 정보 조회 API
 * @returns {Promise<Object>} 사용자 정보
 */
export const getMe = async () => {
  try {
    const response = await axios.get("/auth/me");
    return response.data;
  } catch (error) {
    console.error("사용자 정보 조회 중 오류:", error);
    throw error;
  }
};
