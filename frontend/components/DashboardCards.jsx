import React from 'react';
import { Card, CardContent, Box, Typography, useTheme } from '@mui/material';
import {
  Security,
  Warning,
  CheckCircle,
  Analytics,
} from '@mui/icons-material';

function MetricCard({ title, value, subtitle, icon, color = 'primary', trend }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={1}
      sx={{
        width: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: isDark ? 'rgba(75, 85, 99, 0.9)' : 'background.paper',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {title}
            </Typography>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
            {trend && (
              <Typography
                variant="caption"
                sx={{
                  color: String(trend).includes('+') ? 'success.main' : 'error.main',
                  fontWeight: 500,
                }}
              >
                {trend}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: { xs: 40, md: 50 },
              height: { xs: 40, md: 50 },
              backgroundColor: `${color}.main`,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardCards({
  activeAlerts = 0,
  controlledGates = 0,
  systemStatus = 0,
  predictionAccuracy = 0
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: { xs: 2, md: 2 },
        mt: 1,
        mb: 1,
      }}
    >
      <MetricCard
        title="활성 알림"
        value={activeAlerts}
        subtitle="현재 사고"
        icon={<Warning sx={{ color: 'white', fontSize: { xs: 20, md: 24 } }} />}
        color="error"
      />

      <MetricCard
        title="제어된 차수막"
        value={controlledGates}
        subtitle="현재 활성화"
        icon={<Security sx={{ color: 'white', fontSize: { xs: 20, md: 24 } }} />}
        color="info"
      />

      <MetricCard
        title="시스템 상태"
        value={`${systemStatus}%`}
        subtitle="운영 가동률"
        icon={<CheckCircle sx={{ color: 'white', fontSize: { xs: 20, md: 24 } }} />}
        color="success"
      />

      <MetricCard
        title="실측 정확도"
        value={`${predictionAccuracy}%`}
        subtitle="AI 모델 성능"
        icon={<Analytics sx={{ color: 'white', fontSize: { xs: 20, md: 24 } }} />}
        color="primary"
      />
    </Box>
  );
}
