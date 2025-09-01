import React from 'react';
import { Box, Typography } from '@mui/material';
import { Videocam, Security, Psychology, BarChart } from '@mui/icons-material';

function FeatureCard({ icon, title, description, color, isDark }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        px: 4,
        py: 5,
        textAlign: 'center',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(12px)',
        bgcolor: isDark
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(255,255,255,0.8)',
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
          : '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
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
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(34, 197, 94, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 50%, rgba(34, 197, 94, 0.05) 100%)',
          zIndex: 0,
        },
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: isDark
            ? '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
            : '0 12px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.95)',
          bgcolor: isDark
            ? 'rgba(255,255,255,0.15)'
            : 'rgba(255,255,255,0.9)',
        }
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          backgroundColor: color,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
          position: 'relative',
          zIndex: 1
        }}
      >
        {React.cloneElement(icon, { sx: { color: 'white', fontSize: 26 } })}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          fontSize: '1.125rem',
          mb: 1,
          position: 'relative',
          zIndex: 1,
          color: isDark ? 'white' : 'text.primary'
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.875rem',
          lineHeight: 1.6,
          position: 'relative',
          zIndex: 1,
          color: isDark ? 'rgba(255,255,255,0.8)' : 'text.secondary'
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}

export default function FeaturesSection({ isDark }) {
  return (
    <Box
      sx={{
        py: { xs: 20, lg: 25 },
        px: { xs: 2, sm: 3, lg: 4 },
        background: isDark
          ? 'linear-gradient(to bottom, #334155 0%, #475569 100%)'
          : 'linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)'
      }}
    >
      <Box
        sx={{
          maxWidth: '1280px',
          mx: 'auto'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 14 }}>
          <Typography
            variant="h2"
            sx={{
              mb: 1.5,
              color: 'text.primary',
              fontSize: '1.875rem',
              fontWeight: 700
            }}
          >
            Advanced Flood Prevention Technology
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: '1rem',
              lineHeight: 1.6,
              maxWidth: '672px',
              mx: 'auto'
            }}
          >
            AI, IoT 센서, 자동화된 제어 시스템을 결합한 종합적인 시스템으로
            최고 수준의 홍수 방재를 제공합니다.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
            gap: 5
          }}
        >
          <FeatureCard
            icon={<Videocam />}
            title="실시간 CCTV 모니터링"
            description="AI 기반 자동화된 위험도 평가를 통한 지속적인 감시"
            color="primary.main"
            isDark={isDark}
          />
          <FeatureCard
            icon={<Security />}
            title="자동 방수문 제어"
            description="실시간 상황과 AI 감지에 따라 자동으로 작동하는 스마트 차수막"
            color="#9333ea"
            isDark={isDark}
          />
          <FeatureCard
            icon={<Psychology />}
            title="침수 감지 AI"
            description="머신러닝 모델이 기상 및 환경 패턴과 센서 데이터를 분석하여 위험 인식"
            color="success.main"
            isDark={isDark}
          />
          <FeatureCard
            icon={<BarChart />}
            title="알림 시스템"
            description="실시간 탐지를 통한 즉각 알림"
            color="warning.main"
            isDark={isDark}
          />
        </Box>
      </Box>
    </Box>
  );
}
