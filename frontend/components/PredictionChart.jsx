import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, useTheme, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { getPredictionHistory } from '../services/prediction.js';
import { createPredictionWebSocket } from '../services/websocket.js';

const PredictionChart = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [websocketConnected, setWebsocketConnected] = useState(false);

  const intervalRef = useRef(null);
  const websocketRef = useRef(null);

  // 백엔드 데이터를 차트 형식으로 변환
  const transformData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) return [];

    // 시간 순서대로 정렬 (최신 시간이 오른쪽에 오도록)
    const sortedData = rawData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return sortedData.map(item => ({
      time: new Date(item.timestamp).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      risk: Math.round(item.final_score * 100), // 0.399 -> 39.9 -> 40
      timestamp: item.timestamp,
      originalScore: item.final_score
    }));
  };

  // 예측 데이터 로드
  const loadPredictionData = async () => {
    try {
      const response = await getPredictionHistory();
      if (response && Array.isArray(response)) {
        const transformedData = transformData(response);
        setChartData(transformedData);
        setLastUpdate(new Date());
        setLoading(false);
      }
    } catch (error) {
      console.error('예측 데이터 로드 실패:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // 수동 새로고침
  const handleManualRefresh = () => {
    setLoading(true);
    loadPredictionData();
  };

  // 자동 새로고침 토글
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // WebSocket 연결 설정
  const setupWebSocket = () => {
    try {
      const ws = createPredictionWebSocket();
      if (ws) {
        websocketRef.current = ws;

        ws.onopen = () => {
          setWebsocketConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'prediction' && data.data) {
              // 새로운 예측 데이터를 차트에 추가
              const newDataPoint = {
                timestamp: data.data.timestamp || new Date().toISOString(),
                final_score: data.data.final_score || 0
              };

              setChartData(prev => {
                const updated = [...prev, newDataPoint];
                // 최대 24개 데이터 유지
                return updated.slice(-24);
              });
              setLastUpdate(new Date());
            }
          } catch (error) {
            console.error('WebSocket 메시지 파싱 오류:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket 에러:', error);
          setWebsocketConnected(false);
        };

        ws.onclose = () => {
          setWebsocketConnected(false);
        };
      }
    } catch (error) {
      console.error('WebSocket 설정 실패:', error);
    }
  };

  // WebSocket 연결 해제
  const cleanupWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setWebsocketConnected(false);
  };

  // 초기 데이터 로드 및 자동 새로고침 설정
  useEffect(() => {
    // 초기 데이터 로드
    loadPredictionData();

    // WebSocket 연결 시도
    setupWebSocket();

    // 자동 새로고침 설정 (10초마다, WebSocket이 없을 때만)
    if (autoRefresh && !websocketConnected) {
      intervalRef.current = setInterval(() => {
        loadPredictionData();
      }, 10000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      cleanupWebSocket();
    };
  }, []);

  // 자동 새로고침 상태 변경 시 인터벌 재설정
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // WebSocket이 연결되지 않았을 때만 폴링 사용
    if (autoRefresh && !websocketConnected) {
      intervalRef.current = setInterval(() => {
        loadPredictionData();
      }, 10000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, websocketConnected]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Box
      sx={{
        bgcolor: isDark ? 'rgba(75, 85, 99, 0.9)' : 'background.paper',
        borderRadius: 2,
        p: { xs: 2, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 헤더 영역 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
            홍수 위험 예측
          </Typography>
          <Typography variant="caption" color="text.secondary">
            실시간 위험 측정값
          </Typography>
        </Box>

        {/* 컨트롤 버튼들 */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* 연결 상태 표시 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: websocketConnected ? '#10b981' : autoRefresh ? '#f59e0b' : '#6b7280',
                animation: websocketConnected ? 'pulse 1s infinite' : autoRefresh ? 'pulse 2s infinite' : 'none'
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {websocketConnected ? '실시간' : autoRefresh ? '폴링(10초)' : '수동'}
            </Typography>
          </Box>

          {/* 자동 새로고침 토글 버튼 (WebSocket이 없을 때만 표시) */}
          {!websocketConnected && (
            <Tooltip title={autoRefresh ? '자동 새로고침 끄기' : '자동 새로고침 켜기'}>
              <IconButton
                size="small"
                onClick={toggleAutoRefresh}
                sx={{
                  p: 0.5,
                  color: autoRefresh ? 'warning.main' : 'text.secondary',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: 'currentColor',
                    opacity: 0.7
                  }}
                />
              </IconButton>
            </Tooltip>
          )}

          {/* 수동 새로고침 버튼 */}
          <Tooltip title="지금 새로고침">
            <IconButton
              size="small"
              onClick={handleManualRefresh}
              disabled={loading}
              sx={{
                p: 0.5,
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'action.hover'
                },
                '&:disabled': {
                  color: 'text.disabled'
                }
              }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 마지막 업데이트 시간 표시 */}
      {lastUpdate && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
          마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
        </Typography>
      )}

      <Box
        sx={{
          flex: 1,
          minHeight: 200,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          p: { xs: 1, md: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error" variant="body2">
            데이터 로드 실패: {error}
          </Typography>
        ) : chartData.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            데이터가 없습니다
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis
                dataKey="time"
                stroke={theme.palette.divider}
                strokeWidth={0.5}
                tick={{ fontSize: 12 }}
                reversed={false}
              />
              <YAxis
                label={{
                  value: '위험도 (%)',
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 12,
                  fill: theme.palette.text.primary,
                }}
                stroke={theme.palette.divider}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                ticks={[0, 25, 50, 75, 100]}
              />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                }}
                labelStyle={{ fontSize: 12 }}
                itemStyle={{ fontSize: 12 }}
                formatter={(value, name) => [
                  `${value}% (${(value / 100).toFixed(3)})`,
                  '위험도'
                ]}
                labelFormatter={(label) => `시간: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="risk"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: theme.palette.primary.main,
                  stroke: theme.palette.primary.main,
                  strokeWidth: 1,
                  strokeOpacity: 0.5,
                }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>

      {/* CSS 애니메이션 스타일 */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default PredictionChart;
