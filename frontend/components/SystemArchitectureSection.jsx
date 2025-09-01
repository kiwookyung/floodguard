import React from 'react';
import { Box, Typography } from '@mui/material';
import { Layers, Timeline, Settings, Hub, ArrowForward } from '@mui/icons-material';

export default function SystemArchitectureSection({ isDark }) {
  return (
    <Box
      sx={{
        py: { xs: 20, lg: 25 },
        background: isDark
          ? 'linear-gradient(to bottom, #475569 0%, #64748b 100%)'
          : 'linear-gradient(to bottom, #f1f5f9 0%, #e2e8f0 100%)',
        px: { xs: 2, sm: 3, lg: 4 },
      }}
    >
      <Box sx={{ maxWidth: '1280px', mx: 'auto', textAlign: 'center', mb: 14 }}>
        <Typography
          variant="h2"
          sx={{
            mb: 2,
            color: isDark ? 'white' : 'text.primary',
            fontSize: '1.875rem',
            fontWeight: 700,
          }}
        >
          How It Works
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary',
            fontSize: '1rem',
            lineHeight: 1.6,
            maxWidth: '672px',
            mx: 'auto',
          }}
        >
          신뢰성과 신속한 대응을 위해 설계된 종합적인 시스템 아키텍처
        </Typography>
      </Box>

      <Box
        sx={{
          maxWidth: '960px',
          mx: 'auto',
          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'background.paper',
          borderRadius: 4,
          p: 5,
          border: isDark ? '2px solid rgba(255,255,255,0.2)' : '2px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
          boxShadow: isDark
            ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDark
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(34, 197, 94, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(147, 51, 234, 0.12) 50%, rgba(34, 197, 94, 0.12) 100%)',
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: isDark
              ? 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0, 0, 0, 0.08) 0%, transparent 70%)',
            animation: 'rotate 20s linear infinite',
            zIndex: 0,
          },
          '@keyframes rotate': {
            '0%': {
              transform: 'rotate(0deg)',
            },
            '100%': {
              transform: 'rotate(360deg)',
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' },
            gap: 6,
            position: 'relative',
            zIndex: 1,
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              p: 3,
              borderRadius: 2,
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
              },
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                backgroundColor: 'primary.main',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Layers sx={{ color: 'white', fontSize: 26 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '1.125rem',
                mb: 1,
                color: isDark ? 'white' : 'text.primary'
              }}
            >
              데이터 수집
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary'
              }}
            >
              CCTV 카메라, 수치표고모델(DEM), 기상 관측소
            </Typography>
          </Box>

          {/* Arrow between first and second card */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)',
              zIndex: 2,
            }}
          >
            <ArrowForward sx={{ fontSize: 32 }} />
          </Box>

          <Box
            sx={{
              textAlign: 'center',
              p: 3,
              borderRadius: 2,
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
              },
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                backgroundColor: 'success.main',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Timeline sx={{ color: 'white', fontSize: 26 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '1.125rem',
                mb: 1,
                color: isDark ? 'white' : 'text.primary'
              }}
            >
              AI 처리
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary'
              }}
            >
              머신러닝 알고리즘이 패턴을 분석하고 위험을 예측
            </Typography>
          </Box>

          {/* Arrow between second and third card */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)',
              zIndex: 2,
            }}
          >
            <ArrowForward sx={{ fontSize: 32 }} />
          </Box>

          <Box
            sx={{
              textAlign: 'center',
              p: 3,
              borderRadius: 2,
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
              },
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                backgroundColor: '#9333ea',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Settings sx={{ color: 'white', fontSize: 26 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '1.125rem',
                mb: 1,
                color: isDark ? 'white' : 'text.primary'
              }}
            >
              자동 대응
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary'
              }}
            >
              차수막 작동, 알림 발송, 비상 프로토콜 실행
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}


