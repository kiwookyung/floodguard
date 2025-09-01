import axios from "./axios";

/**
 * CCTV 리스트 조회 API
 * @returns {Promise<Array>} CCTV 목록
 */
export const getCameras = async () => {
  try {
    const response = await axios.get("/cameras");
    return response.data;
  } catch (error) {
    console.error("CCTV 리스트 조회 중 오류:", error);
    throw error;
  }
};
