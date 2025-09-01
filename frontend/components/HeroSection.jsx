import React from 'react';
import { Box, Typography, Button, Chip, useTheme } from '@mui/material';
import { PlayArrow, ArrowForward } from '@mui/icons-material';
import { ROUTES } from '../routes/constants';
import Logo from './Logo';
import useAuthStore from '../stores/authStore';

export default function HeroSection({ isDark, navigate }) {
  const theme = useTheme();
  const { isAuthenticated } = useAuthStore();

  return (
    <Box
      sx={{
        px: 2,
        py: { xs: 10, md: 10 },
        textAlign: 'center',
        background: isDark
          ? 'radial-gradient(ellipse at center, #0f172a 0%, #1e293b 50%, #334155 100%)'
          : 'radial-gradient(ellipse at center, #e0f2fe 0%, #f1f5f9 50%, #f8fafc 100%)',
      }}
    >
      {/* Large Logo */}
      <Box
        sx={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
          mb: 2,
        }}
      >
        <Logo size={100} isDark={isDark} withText={false} />
      </Box>

      {/* Brand Name */}
      <Typography
        variant="h2"
        sx={{
          fontWeight: 800, // font-extrabold
          fontSize: '2.5rem', // 48px
          mb: 1,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(to bottom, #166534, #0d9488, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        침킬
      </Typography>

      {/* Subtitle */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 500, // font-semibold
          color: isDark ? 'rgba(148, 163, 184, 0.9)' : 'rgba(100, 116, 139, 0.8)',
          fontSize: '0.75rem', // 14px
          mb: 6,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        스마트 방재 시스템
      </Typography>

      {/* AI Technology Tag */}
      <Chip
        label="⚡ AI-Powered Technology"
        sx={{
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
          color: isDark ? '#93c5fd' : '#1d4ed8',
          fontWeight: 500, // font-medium
          fontSize: '0.875rem', // 14px
          px: 1.5,
          py: 0.5,
          borderRadius: '16px',
          mb: 4,
          border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)',
        }}
      />

      {/* Main Headline with Gradient - Two Lines */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h1"
          sx={{
            fontWeight: 700, // font-bold
            fontSize: {
              xs: '2.25rem', // 36px (text-4xl)
              sm: '3rem', // 48px (text-5xl)
              lg: '3.75rem' // 60px (text-6xl)
            },
            lineHeight: 1.25, // leading-tight
            letterSpacing: '-0.02em',
            '& .gradient-text-first': {
              background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }
          }}
        >
          <span className="gradient-text-first">AI 기반 스마트 홍수</span>
        </Typography>
        <Typography
          variant="h1"
          sx={{
            fontWeight: 700, // font-bold
            fontSize: {
              xs: '2.25rem', // 36px (text-4xl)
              sm: '3rem', // 48px (text-5xl)
              lg: '3.75rem' // 60px (text-6xl)
            },
            lineHeight: 1.25, // leading-tight
            letterSpacing: '-0.02em',
            '& .gradient-text-second': {
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }
          }}
        >
          <span className="gradient-text-second">방재 시스템</span>
        </Typography>
      </Box>

      {/* Description */}
      <Typography
        variant="body1"
        sx={{
          fontWeight: 300, // font-normal
          color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#475569',
          fontSize: {
            xs: '1rem', // 18px (text-lg)
            sm: '1.125rem' // 20px (text-xl)
          },
          mb: 6,
          maxWidth: '600px', // max-w-2xl
          mx: 'auto',
          lineHeight: 1.5, // leading-relaxed
        }}
      >
        실시간 CCTV 모니터링, 홍수 관측, 자동 차수막 제어를 통해
        지능형 조기 경보 시스템으로 지역사회를 보호합니다.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1,
          justifyContent: 'center',
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          startIcon={<PlayArrow />}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: 500, // font-medium
            fontSize: '1.125rem', // 18px
            background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 15px 35px rgba(37, 99, 235, 0.4)'
            }
          }}
        >
          제어 패널로 이동
        </Button>
        {!isAuthenticated && (
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate(ROUTES.LOGIN)}
            endIcon={<ArrowForward />}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 500, // font-medium
              fontSize: '1.125rem', // 18px
              borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#3b82f6',
              color: isDark ? 'white' : '#3b82f6',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.5)' : '#2563eb',
              }
            }}
          >
            관리자 로그인
          </Button>
        )}
      </Box>
    </Box>
  );
}
