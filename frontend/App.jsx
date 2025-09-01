import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import AppRoutes from './routes';
import useAuthStore from './stores/authStore';

// 실시간 알람 컴포넌트 (API 연동으로 대체됨)
function AlertComponent({ isDark }) {
  // 실시간 alert는 FloodDashboard에서 WebSocket으로 처리됨
  // 이 컴포넌트는 더 이상 사용되지 않음
  return null;
}

export default function App() {
  const [isDark, setIsDark] = useState(false);

  // Zustand 인증 스토어 초기화
  const initializeAuth = useAuthStore(state => state.initializeAuth);

  // 앱 시작 시 인증 상태 초기화
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Create MUI theme that matches CSS variables and Tailwind breakpoints
  const theme = createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: isDark ? '#3b82f6' : '#2563eb', // hsl(221.2 83.2% 53.3%)
      },
      secondary: {
        main: isDark ? '#e5e7eb' : '#717182',
      },
      background: {
        default: isDark ? '#0a0a0a' : '#ffffff', // hsl(0 0% 100%)
        paper: isDark ? '#1a1a1a' : '#ffffff',   // hsl(0 0% 100%)
      },
      text: {
        primary: isDark ? '#ffffff' : '#030213',   // hsl(222.2 84% 4.9%)
        secondary: isDark ? '#a1a1aa' : '#717182', // hsl(215.4 16.3% 46.9%)
      },
      divider: isDark ? '#374151' : '#e5e7eb',    // hsl(214.3 31.8% 91.4%)
    },
    typography: {
      fontSize: 14,
      fontFamily: 'inherit',
      h1: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '1.875rem',
        fontWeight: 700,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.2,
      },
    },
    // Tailwind 브레이크포인트와 일치하도록 설정
    breakpoints: {
      values: {
        xs: 0,
        sm: 640,  // Tailwind sm
        md: 768,  // Tailwind md
        lg: 1024, // Tailwind lg
        xl: 1280, // Tailwind xl
        xxl: 1536, // Tailwind 2xl
      },
    },
    spacing: 8, // 8px 단위로 통일
    shape: {
      borderRadius: 8, // 8px 기본값
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none', // 대문자 변환 방지
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 10, // 디자인 사양에 맞춤
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            '&:last-child': {
              paddingBottom: 24, // MUI 기본 패딩 제거
            },
          },
        },
      },
    },
  });

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="w-full h-full bg-background">
          <AppRoutes isDark={isDark} setIsDark={setIsDark} />
          <AlertComponent isDark={isDark} />
        </div>
      </ThemeProvider>
    </Router>
  );
} 