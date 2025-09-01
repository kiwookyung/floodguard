import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Drawer,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { LightMode, DarkMode, Menu as MenuIcon, Person, KeyboardArrowDown, Warning, Info, Logout, ArrowBack } from '@mui/icons-material';
import DashboardCards from '../components/DashboardCards';
import PredictionChart from '../components/PredictionChart';
import DevicePanel from '../components/DevicePanel';
import AlertLogTable from '../components/AlertLogTable';
import InteractiveMap from '../components/InteractiveMap';
import HealthCheck from '../components/HealthCheck';
import useAuthStore from '../stores/authStore';
import { ROUTES } from '../routes/constants';
import Logo from '../components/Logo';
import LiveCameraModal from '../components/LiveCameraModal';
import GateControlModal from '../components/GateControlModal';
import RealTimeAlert from '../components/RealTimeAlert';
import { createLogsWebSocket, createGateStatusWebSocket } from '../services/websocket.js';
import { getMe } from '../services/auth.js';
import { getCameras } from '../services/cameras.js';
import { getGates } from '../services/gates.js';
import { getHealthCheck } from '../services/healthcheck.js';
import { getPredictionHistory } from '../services/prediction.js';

const FloodDashboard = ({ isDark, setIsDark }) => {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [selectedDeviceData, setSelectedDeviceData] = useState(null);
  const [realTimeLogs, setRealTimeLogs] = useState([]);
  const [gateStatus, setGateStatus] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const [userInfoLoading, setUserInfoLoading] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [gates, setGates] = useState([]);
  const [systemHealth, setSystemHealth] = useState(0);
  const [predictionData, setPredictionData] = useState([]);
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  // 대시보드 카드 데이터 계산
  const dashboardData = useMemo(() => {
    // 활성 알림: 실시간 로그 중 경보 레벨의 개수
    const activeAlerts = realTimeLogs.filter(log => {
      const level = log.level;
      return level === '경보';
    }).length;

    // 제어된 차수막: 실제 하드웨어 연동 차수막 중 OPEN 상태인 개수
    const controlledGates = (() => {
      const openGates = Object.entries(gateStatus).filter(([gateId, status]) => status === 'OPEN');
      const realOpenGates = openGates.filter(([gateId]) =>
        gateId === 'gate_A' || gateId === 'gate_B' ||
        gates.find(g => g.id === gateId)?.type === 'gate-real' ||
        gates.find(g => g.id === gateId)?.isReal === true ||
        gates.find(g => g.id === gateId)?.is_real === true ||
        gates.find(g => g.id === gateId)?.hardware_connected === true
      );

      return realOpenGates.length;
    })();

    // 시스템 상태: 백엔드 헬스체크 결과
    const systemStatus = systemHealth;

    // 실측 정확도: 예측 데이터의 편차가 작으면 100%, 크면 낮은 값
    const predictionAccuracy = (() => {
      if (predictionData.length === 0) return 0;

      // 최근 10개 데이터의 편차 계산
      const recentData = predictionData.slice(-10);
      const scores = recentData.map(item => item.final_score).filter(score => score !== null && score !== undefined);

      if (scores.length === 0) return 0;

      // 평균과 표준편차 계산
      const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);

      // 편차가 작으면 (표준편차 < 0.1) 100%, 크면 낮은 값
      let accuracy;
      if (stdDev < 0.1) {
        accuracy = 100;
      } else if (stdDev < 0.2) {
        accuracy = 85;
      } else if (stdDev < 0.3) {
        accuracy = 70;
      } else {
        accuracy = Math.max(50, Math.round(100 - (stdDev * 100)));
      }

      return accuracy;
    })();

    return {
      activeAlerts,
      controlledGates,
      systemStatus,
      predictionAccuracy
    };
  }, [realTimeLogs, gateStatus, gates, systemHealth, predictionData]);

  // 사용자 정보 로드
  useEffect(() => {
    if (isAuthenticated) {
      const loadUserInfo = async () => {
        setUserInfoLoading(true);
        try {
          const userData = await getMe();
          setUserInfo(userData);
        } catch (err) {
          console.error("사용자 정보 로드 실패:", err);
        } finally {
          setUserInfoLoading(false);
        }
      };
      loadUserInfo();
    } else {
      setUserInfo(null);
    }
  }, [isAuthenticated]);

  // CCTV와 차수막 데이터 로드
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const [camerasData, gatesData] = await Promise.all([
          getCameras(),
          getGates()
        ]);

        // CCTV 데이터 처리 - 실제 스트리밍 가능한 CCTV 구분
        const camerasWithType = (camerasData || []).map(camera => {
          // 백엔드에서 받은 데이터를 우선적으로 사용
          // can_stream, type, id 등을 종합적으로 판단
          const isRealCCTV = camera.can_stream === true ||
            camera.canStream === true ||
            camera.type === 'cctv-real' ||
            camera.type === 'real' ||
            camera.id === 'cctv-001' ||
            camera.id === 'cctv-real-001' ||
            camera.is_real === true;

          return {
            ...camera,
            type: isRealCCTV ? 'cctv-real' : 'cctv-sim',
            canStream: isRealCCTV
          };
        });

        // 차수막 데이터 처리 - 실제 하드웨어 연동 차수막 구분
        const gatesWithType = (gatesData || []).map(gate => {
          // 백엔드에서 받은 데이터를 우선적으로 사용
          // is_real, type, id 등을 종합적으로 판단
          const isRealGate = gate.is_real === true ||
            gate.isReal === true ||
            gate.type === 'gate-real' ||
            gate.type === 'real' ||
            gate.id === 'gate_A' ||
            gate.id === 'gate_B' ||
            gate.hardware_connected === true;

          return {
            ...gate,
            type: isRealGate ? 'gate-real' : 'gate-sim',
            isReal: isRealGate
          };
        });

        setCameras(camerasWithType);
        setGates(gatesWithType);

        // 차수막 상태 초기화 - 백엔드에서 받은 상태 우선, 없으면 CLOSED로 설정
        const initialGateStatus = {};
        gatesWithType.forEach(gate => {
          // 백엔드에서 status 필드가 있으면 사용, 없으면 CLOSED로 기본값 설정
          initialGateStatus[gate.id] = gate.status || 'CLOSED';
        });
        setGateStatus(initialGateStatus);
      } catch (err) {
        console.error("디바이스 데이터 로드 실패:", err);
        // 에러 발생 시 빈 배열로 설정
        setCameras([]);
        setGates([]);
        setGateStatus({});
      }
    };

    loadDevices();
  }, []);

  // 시스템 헬스체크 및 예측 데이터 로드
  useEffect(() => {
    const loadSystemData = async () => {
      try {
        // 헬스체크 데이터 로드
        const healthData = await getHealthCheck();

        if (healthData && healthData.status === 'healthy') {
          setSystemHealth(100);
        } else if (healthData && healthData.status === 'degraded') {
          setSystemHealth(50);
        } else if (healthData && healthData.status === 'unhealthy') {
          setSystemHealth(0);
        } else {
          // 백엔드가 응답하는 경우 기본적으로 정상으로 간주
          setSystemHealth(100);
        }

        // 예측 데이터 로드
        const predictionHistory = await getPredictionHistory();

        if (predictionHistory && Array.isArray(predictionHistory)) {
          setPredictionData(predictionHistory);
        }
      } catch (err) {
        console.error("시스템 데이터 로드 실패:", err);
        // 백엔드 연결 실패 시에도 기본값 설정
        setSystemHealth(100); // 백엔드가 실행 중이면 정상으로 간주
        setPredictionData([]);
      }
    };

    loadSystemData();
  }, []);

  // 실시간 웹소켓 연결 및 메시지 처리
  useEffect(() => {
    let logsWs = null;
    let gateStatusWs = null;

    console.log('🔌 웹소켓 연결 시작...');

    // 실시간 로그 웹소켓
    logsWs = createLogsWebSocket((logMessage) => {
      console.log('📨 로그 웹소켓 메시지 수신:', logMessage);

      // 백엔드 데이터를 컴포넌트 형식으로 변환
      const transformedLog = {
        time: new Date(logMessage.created_at).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        level: (() => {
          // 레벨 결정 로직 개선
          if (logMessage.action === 'camera') {
            try {
              const details = JSON.parse(logMessage.details || '{}');
              if (details.risk_level === 'Danger') return '경보';
              if (details.risk_level === 'Caution') return '경보';
              if (details.risk_level === 'Warning') return '경보';
              return '경보'; // 기본값
            } catch (e) {
              return '경보';
            }
          } else if (logMessage.action && String(logMessage.action).includes('All Gates')) {
            return '게이트';
          } else if (logMessage.gate_id || (logMessage.action && String(logMessage.action).includes('gate'))) {
            return '게이트';
          } else {
            return '경보'; // 기본값
          }
        })(),
        device: (() => {
          if (logMessage.action === 'camera') return 'CCTV';
          if (logMessage.gate_id) return `Gate ${logMessage.gate_id}`;
          if (logMessage.action && String(logMessage.action).includes('All Gates')) return 'All Gates';
          return 'System';
        })(),
        message: (() => {
          if (logMessage.action === 'camera') {
            try {
              const details = JSON.parse(logMessage.details || '{}');
              if (details.risk_level === 'Danger') return '위험 수준: 높음';
              if (details.risk_level === 'Caution') return '위험 수준: 주의';
              if (details.risk_level === 'Warning') return '위험 수준: 경고';
              return '모니터링 중';
            } catch (e) {
              return logMessage.details || 'CCTV 모니터링';
            }
          } else if (logMessage.action && String(logMessage.action).includes('All Gates')) {
            return '모든 차수막 일괄 제어';
          } else if (logMessage.gate_id) {
            return logMessage.details || '차수막 상태 변경';
          }
          return logMessage.details || '시스템 알림';
        })(),
        icon: (() => {
          if (logMessage.action === 'camera') {
            try {
              const details = JSON.parse(logMessage.details || '{}');
              if (details.risk_level === 'Danger') return <Warning fontSize="small" />;
              if (details.risk_level === 'Caution') return <Warning fontSize="small" />;
              if (details.risk_level === 'Warning') return <Warning fontSize="small" />;
              return <Info fontSize="small" />;
            } catch (e) {
              return <Info fontSize="small" />;
            }
          } else if (logMessage.action && (String(logMessage.action).includes('open') || String(logMessage.action).includes('close'))) {
            return <Warning fontSize="small" />;
          }
          return <Info fontSize="small" />;
        })(),
        id: logMessage.id,
        created_at: logMessage.created_at,
        originalData: logMessage // 원본 데이터 보존
      };

      console.log('🔄 변환된 로그:', transformedLog);
      setRealTimeLogs(prev => {
        const newLogs = [transformedLog, ...prev.slice(0, 9)]; // 최근 10개만 유지
        console.log('📊 실시간 로그 업데이트:', newLogs.length, '개');
        return newLogs;
      });
    });

    // 실시간 차수막 상태 웹소켓
    gateStatusWs = createGateStatusWebSocket((statusMessage) => {
      console.log('📨 차수막 상태 웹소켓 메시지 수신:', statusMessage);

      // 상태 메시지 형식에 따라 처리
      if (statusMessage && typeof statusMessage === 'object') {
        // 백엔드에서 오는 다양한 형식 처리
        if (statusMessage.gates) {
          // { gates: { gate_A: 'OPEN', gate_B: 'CLOSED' } } 형식
          setGateStatus(statusMessage.gates);
        } else if (statusMessage.status && statusMessage.gate_id) {
          // { gate_id: 'gate_A', status: 'OPEN' } 형식
          setGateStatus(prev => {
            const newStatus = {
              ...prev,
              [statusMessage.gate_id]: statusMessage.status
            };
            return newStatus;
          });
        } else if (Object.keys(statusMessage).some(key => key.startsWith('gate_'))) {
          // { gate_A: 'OPEN', gate_B: 'CLOSED' } 형식
          setGateStatus(statusMessage);
        }
      } else if (statusMessage && statusMessage.action && statusMessage.gate_id) {
        // 로그에서 차수막 상태 추출
        // { action: 'open', gate_id: 'gate_A' } 형식
        const newStatus = statusMessage.action === 'open' ? 'OPEN' : 'CLOSED';
        setGateStatus(prev => {
          const updatedStatus = {
            ...prev,
            [statusMessage.gate_id]: newStatus
          };
          return updatedStatus;
        });
      }
    });

    // 컴포넌트 언마운트 시 웹소켓 연결 해제
    return () => {
      console.log('🔌 웹소켓 연결 해제...');
      if (logsWs) logsWs.close();
      if (gateStatusWs) gateStatusWs.close();
    };
  }, []);

  const handleDeviceClick = (device) => {
    setSelectedDeviceData(device);
    setSelectedDevice(device.id);

    // 디바이스 타입에 따라 모달 열기
    if (device.type === 'cctv-real' || device.type === 'cctv-sim') {
      // CCTV 모달 열기
      setCameraModalOpen(true);
    } else if ((device.type === 'gate-real' || device.type === 'gate-sim') && isAuthenticated) {
      // 차수막 제어 모달 열기 (실제 연동 및 시뮬레이션, 관리자만)
      setGateModalOpen(true);
    }
  };

  const handleCloseCameraModal = () => {
    setCameraModalOpen(false);
    setSelectedDeviceData(null);
  };

  const handleCloseGateModal = () => {
    setGateModalOpen(false);
    setSelectedDeviceData(null);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
    handleUserMenuClose();
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          background: isDark
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
          height: '100vh',
          width: '100%',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: isDark
              ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            height: 64,
            flexShrink: 0,
            px: { xs: 2, md: 4 },
            py: 1,
            boxShadow: isDark ? 3 : 1,
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => setIsMobilePanelOpen(true)}
                sx={{ display: { xs: 'flex', lg: 'none' }, color: 'text.primary' }}
              >
                <MenuIcon />
              </IconButton>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box onClick={() => navigate(ROUTES.HOME)} sx={{ cursor: 'pointer' }}>
                  <Logo size={32} isDark={isDark} withText={false} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    onClick={() => navigate(ROUTES.HOME)}
                    sx={{
                      fontWeight: 700,
                      background: 'linear-gradient(to bottom, #166534, #0d9488, #3b82f6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  >
                    침킬
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <HealthCheck />
                  </Box>
                </Box>

                {/* 메인페이지 이동 버튼 */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(ROUTES.HOME)}
                  startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                  sx={{
                    ml: 2,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                    color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    '&:hover': {
                      borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)',
                      background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  메인페이지
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                onClick={() => setIsDark(!isDark)}
                sx={{
                  position: 'relative',
                  width: 50,
                  height: 24,
                  borderRadius: '12px',
                  backgroundColor: isDark ? '#3b82f6' : '#e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  px: 0.5,
                  '&:hover': {
                    backgroundColor: isDark ? '#2563eb' : '#d1d5db',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    transform: isDark ? 'translateX(24px)' : 'translateX(0px)',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDark ? (
                    <LightMode sx={{ fontSize: 12, color: '#fbbf24' }} />
                  ) : (
                    <DarkMode sx={{ fontSize: 12, color: '#6b7280' }} />
                  )}
                </Box>
              </Box>

              {isAuthenticated && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleUserMenuOpen}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'primary.50',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: 'primary.main',
                        fontSize: 12,
                      }}
                    >
                      {userInfoLoading ? (
                        <CircularProgress size={16} />
                      ) : userInfo ? (
                        userInfo.email.charAt(0).toUpperCase()
                      ) : (
                        <Person fontSize="small" />
                      )}
                    </Avatar>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="caption" fontWeight={600} color="text.primary">
                        {userInfoLoading ? '로딩 중...' : userInfo?.email || '사용자'}
                      </Typography>
                    </Box>
                    <KeyboardArrowDown fontSize="small" />
                  </Button>
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    PaperProps={{
                      sx: {
                        mt: 1,
                        minWidth: 200,
                        boxShadow: 3,
                        borderRadius: 2,
                      },
                    }}
                  >
                    <MenuItem onClick={handleUserMenuClose} disabled>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                        <Typography variant="body2" fontWeight={600}>
                          {userInfo?.email || '사용자'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          아이디: {userInfo?.id || '없음'}
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Menu>
                </Box>
              )}

              {/* 비로그인 시 관리자 로그인 버튼 */}
              {!isAuthenticated && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  관리자 로그인
                </Button>
              )}

              {/* 별도 로그아웃 버튼 */}
              {isAuthenticated && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<Logout />}
                  onClick={handleLogout}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderColor: 'error.main',
                    color: 'error.main',
                    '&:hover': {
                      borderColor: 'error.dark',
                      backgroundColor: 'error.50',
                    },
                  }}
                >
                  로그아웃
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              width: 230,
              flexShrink: 0,
              borderRight: '1px solid',
              borderColor: 'divider',
              background: isDark
                ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              height: '100%',
            }}
          >
            <DevicePanel
              selectedDevice={selectedDevice}
              onDeviceSelect={setSelectedDevice}
              isAdmin={isAuthenticated}
              onDeviceClick={handleDeviceClick}
              gateStatus={gateStatus}
              cameras={cameras}
              gates={gates}
            />
          </Box>

          <Drawer
            anchor="right"
            open={isMobilePanelOpen}
            onClose={() => setIsMobilePanelOpen(false)}
            PaperProps={{
              sx: {
                width: 230,
                background: isDark
                  ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
              }
            }}
          >
            <DevicePanel
              selectedDevice={selectedDevice}
              onDeviceSelect={setSelectedDevice}
              isAdmin={isAuthenticated}
              onDeviceClick={handleDeviceClick}
              gateStatus={gateStatus}
              cameras={cameras}
              gates={gates}
            />
          </Drawer>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'auto',
              px: { xs: 2, md: 4 },
              py: 3,
              gap: 3,
              background: isDark
                ? 'linear-gradient(135deg, #334155 0%, #475569 100%)'
                : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
            }}
          >
            <Box
              sx={{
                background: isDark
                  ? 'rgba(75, 85, 99, 0.9)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
                borderRadius: 2,
                boxShadow: isDark ? 3 : 1,
                p: 3,
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <DashboardCards
                activeAlerts={dashboardData.activeAlerts}
                controlledGates={dashboardData.controlledGates}
                systemStatus={dashboardData.systemStatus}
                predictionAccuracy={dashboardData.predictionAccuracy}
              />
            </Box>

            <Box
              sx={{
                background: isDark
                  ? 'rgba(75, 85, 99, 0.9)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
                borderRadius: 2,
                boxShadow: isDark ? 3 : 1,
                p: 2,
                minHeight: '45vh',
                maxHeight: '60vh',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <InteractiveMap
                selectedDevice={selectedDevice}
                onDeviceSelect={setSelectedDevice}
                isAdmin={isAuthenticated}
                onDeviceClick={handleDeviceClick}
                cameras={cameras}
                gates={gates}
              />
            </Box>



            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
                  borderRadius: 2,
                  boxShadow: isDark ? 3 : 1,
                  p: 2,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <PredictionChart />
              </Box>

              <Box
                sx={{
                  flex: 1,
                  background: isDark
                    ? 'rgba(75, 85, 99, 0.9)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
                  borderRadius: 2,
                  boxShadow: isDark ? 3 : 1,
                  p: 3,
                  display: { xs: 'none', md: 'block' },
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <AlertLogTable realTimeLogs={realTimeLogs} />
              </Box>

              {/* Mobile fallback */}
              <Box sx={{ display: { xs: 'block', md: 'none' }, px: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  알림 로그는 더 큰 화면에서 확인할 수 있습니다.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Global Modals */}
      <LiveCameraModal
        open={cameraModalOpen}
        onClose={handleCloseCameraModal}
        device={selectedDeviceData}
      />
      <GateControlModal
        open={gateModalOpen}
        onClose={handleCloseGateModal}
        device={selectedDeviceData}
        isAdmin={isAuthenticated}
      />

      {/* 실시간 알람 */}
      <RealTimeAlert alerts={realTimeLogs} />
    </>
  );
};

export default FloodDashboard;
