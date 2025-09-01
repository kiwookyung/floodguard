import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "../services/axios.js";
import { getMe } from "../services/auth.js";

const useAuthStore = create(
  persist(
    (set, get) => ({
      // 상태
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // 액션
      login: async (email, password) => {
        set({ loading: true, error: null });

        try {
          const params = new URLSearchParams();
          params.append("username", email);
          params.append("password", password);

          const response = await axios.post("/auth/login", params, {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          const { access_token, token_type } = response.data;

          axios.defaults.headers.common[
            "Authorization"
          ] = `${token_type} ${access_token}`;

          set({
            token: access_token,
            isAuthenticated: true,
            loading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          let errorMessage = "로그인 중 오류가 발생했습니다.";
          if (error.response) {
            if (error.response.status === 401) {
              errorMessage = "관리자명 또는 비밀번호가 올바르지 않습니다.";
            } else if (error.response.data?.detail) {
              errorMessage = error.response.data.detail;
            }
          } else if (error.request) {
            errorMessage =
              "관리자명 또는 비밀번호가 잘못 되었습니다. 관리자명과 비밀번호를 정확히 입력해 주세요.";
          }

          set({
            loading: false,
            error: errorMessage,
          });

          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        // axios 헤더에서 토큰 제거
        delete axios.defaults.headers.common["Authorization"];

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      // 사용자 정보 조회 (현재 사용되지 않음 - 각 컴포넌트에서 직접 getMe 호출)
      // fetchUserInfo: async () => {
      //   try {
      //     const userData = await getMe();
      //     set({ user: userData });
      //     return userData;
      //   } catch (error) {
      //     console.error("사용자 정보 조회 실패:", error);
      //     throw error;
      //   }
      // },

      // 초기화 시 토큰이 있으면 axios 헤더에 설정
      initializeAuth: () => {
        const { token } = get();
        if (token) {
          axios.defaults.headers.common["Authorization"] = `bearer ${token}`;
        }
      },
    }),
    {
      name: "auth-storage", // localStorage 키 이름
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }), // 토큰과 인증 상태만 저장
    }
  )
);

export default useAuthStore;
