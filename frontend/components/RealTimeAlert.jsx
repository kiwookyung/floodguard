import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Typography,
  IconButton,
  Collapse,
  Chip,
  useTheme,
} from '@mui/material';
import { Close, Warning, Error, Info } from '@mui/icons-material';

const RealTimeAlert = ({ realTimeLogs = [] }) => {
  const theme = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [expandedAlerts, setExpandedAlerts] = useState(new Set());

  // 실시간 로그가 추가될 때마다 알림 생성
  useEffect(() => {
    if (realTimeLogs.length > 0) {
      const newAlerts = realTimeLogs
        .filter(log => !alerts.some(alert => alert.id === log.id)) // 중복 방지
        .map(log => ({
          id: log.id,
          device: log.device,
          message: log.message,
          time: log.time,
          level: log.level,
          timestamp: Date.now(),
          isNew: true,
        }));

      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 5)); // 최대 5개 유지

        // 새 알림 자동 확장
        newAlerts.forEach(alert => {
          setExpandedAlerts(prev => new Set([...prev, alert.id]));
        });

        // 3초 후 자동 축소
        setTimeout(() => {
          newAlerts.forEach(alert => {
            setExpandedAlerts(prev => {
              const newSet = new Set(prev);
              newSet.delete(alert.id);
              return newSet;
            });
          });
        }, 3000);
      }
    }
  }, [realTimeLogs]);

  // 알림 제거
  const removeAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      newSet.delete(alertId);
      return newSet;
    });
  };

  // 알림 확장/축소 토글
  const toggleAlert = (alertId) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  // 알림이 없으면 렌더링하지 않음
  if (alerts.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {alerts.map((alert) => (
        <Collapse
          key={alert.id}
          in={true}
          timeout={300}
          sx={{
            '& .MuiCollapse-wrapper': {
              transform: 'translateX(0)',
            },
          }}
        >
          <Alert
            severity="warning"
            icon={<Warning />}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => removeAlert(alert.id)}
              >
                <Close fontSize="inherit" />
              </IconButton>
            }
            sx={{
              mb: 1,
              boxShadow: theme.shadows[8],
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: alert.isNew ? 'scale(1.05)' : 'scale(1)',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: theme.shadows[12],
              },
              animation: alert.isNew ? 'pulse 0.6s ease-in-out' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
            onClick={() => toggleAlert(alert.id)}
          >
            <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
              실시간 경보
            </AlertTitle>

            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                {alert.device}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  label={alert.level}
                  color="warning"
                  size="small"
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary">
                  {alert.time}
                </Typography>
              </Box>
            </Box>

            {/* 확장된 상세 정보 */}
            <Collapse in={expandedAlerts.has(alert.id)} timeout={200}>
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.primary">
                  {alert.message}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  클릭하여 상세 정보 확인
                </Typography>
              </Box>
            </Collapse>

            {/* 축소된 상태에서 보여줄 간단한 메시지 */}
            {!expandedAlerts.has(alert.id) && (
              <Typography variant="caption" color="text.secondary">
                {alert.message.length > 50
                  ? `${alert.message.substring(0, 50)}...`
                  : alert.message
                }
              </Typography>
            )}
          </Alert>
        </Collapse>
      ))}
    </Box>
  );
};

export default RealTimeAlert;
