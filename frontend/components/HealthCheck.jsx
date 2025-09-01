import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import { getHealthCheck } from '../services/healthcheck.js';

export default function HealthCheck() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHealthCheck();
      setStatus(response);
    } catch (err) {
      setError(err.message || '서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = () => {
    if (loading) return <CircularProgress size={16} />;
    if (error) return <Error sx={{ fontSize: 16 }} />;
    if (status?.status === 'ok') return <CheckCircle sx={{ fontSize: 16 }} />;
    return <Error sx={{ fontSize: 16 }} />;
  };

  const getStatusText = () => {
    if (loading) return '확인 중...';
    if (error) return 'System Inactive';
    if (status?.status === 'ok') return 'System Active';
    return 'System Inactive';
  };

  const getStatusColor = () => {
    if (loading) return 'default';
    if (error) return 'error';
    if (status?.status === 'ok') return 'success';
    return 'error';
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: getStatusColor() === 'success' ? '#10b981' : '#ef4444',
            boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.75rem',
          }}
        >
          {getStatusText()}
        </Typography>
      </Box>
    </Box>
  );
} 