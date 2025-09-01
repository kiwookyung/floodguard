// 라우트 경로 상수
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  NOT_FOUND: "/404",
};

// 라우트 메타데이터
export const ROUTE_META = {
  [ROUTES.HOME]: {
    title: "FloodGuard - Smart Prevention System",
    description: "AI-powered Smart Flood Prevention System",
  },
  [ROUTES.LOGIN]: {
    title: "로그인 - FloodGuard",
    description: "관리자 로그인",
  },
  [ROUTES.DASHBOARD]: {
    title: "대시보드 - FloodGuard",
    description: "Smart Flood Prevention Dashboard",
  },
  [ROUTES.NOT_FOUND]: {
    title: "404 - 페이지를 찾을 수 없습니다",
    description: "요청하신 페이지가 존재하지 않습니다",
  },
};

// 보호된 라우트 (인증이 필요한 페이지)
export const PROTECTED_ROUTES = [ROUTES.DASHBOARD];

// 공개 라우트 (인증이 필요하지 않은 페이지)
export const PUBLIC_ROUTES = [ROUTES.HOME, ROUTES.LOGIN, ROUTES.NOT_FOUND];
