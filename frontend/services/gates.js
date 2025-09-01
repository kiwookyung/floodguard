import axios from "./axios";

/**
 * 차수막 리스트 조회 API
 * @returns {Promise<Array>} 차수막 목록
 */
export const getGates = async () => {
  try {
    const response = await axios.get("/gates");
    return response.data;
  } catch (error) {
    console.error("차수막 리스트 조회 중 오류:", error);
    throw error;
  }
};

/**
 * 차수막 전체 제어 API
 * @param {Object} controlData - 제어 데이터
 * @returns {Promise<Object>} 제어 결과
 */
export const controlAllGates = async (controlData) => {
  try {
    const response = await axios.post("/gates/control", controlData);
    return response.data;
  } catch (error) {
    console.error("차수막 전체 제어 중 오류:", error);
    throw error;
  }
};

/**
 * 차수막 개별 제어 API
 * @param {string} gateId - 차수막 ID
 * @param {Object} controlData - 제어 데이터
 * @returns {Promise<Object>} 제어 결과
 */
export const controlIndividualGate = async (gateId, controlData) => {
  try {
    const response = await axios.post(`/gates/${gateId}/control`, controlData);
    return response.data;
  } catch (error) {
    console.error("차수막 개별 제어 중 오류:", error);
    throw error;
  }
};
