import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from '@mui/material';
import {
  Security,
  ExpandMore,
  CameraAlt,
} from '@mui/icons-material';
import { getCameras } from '../services/cameras.js';
import { getGates } from '../services/gates.js';

function DeviceListItem({ device, selected, onSelect, onDeviceClick, deviceType }) {
  // device가 존재하지 않으면 렌더링하지 않음
  if (!device || !device.id) {
    return null;
  }

  // CCTV 타입 확인 - API 데이터의 실제 타입 사용
  const isRealCCTV = device.type === 'cctv-real';
  const isSimulationCCTV = device.type === 'cctv-sim';
  const isRealGate = device.type === 'gate-real';

  const handleDeviceClick = () => {
    onSelect(device.id);
    onDeviceClick(device);
  };

  return (
    <Box
      onClick={handleDeviceClick}
      sx={{
        p: 1.5, // 패딩 조정 (2.5 → 2로 줄여서 여백 최적화)
        cursor: 'pointer',
        borderLeft: selected ? '4px solid' : '4px solid transparent',
        bgcolor: selected ? 'primary.50' : 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'primary.50',
        },
        mx: 1,
        mb: 1.5, // 하단 여백 유지
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: deviceType === 'camera' ? 'success.main' : 'primary.main', // CCTV는 모두 초록색으로 통일
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
            }}
          >
            {deviceType === 'camera' ? (
              <CameraAlt sx={{ color: 'white', fontSize: 20 }} />
            ) : (
              <Security sx={{ color: 'white', fontSize: 20 }} />
            )}
            {/* 실제 CCTV 표시용 노란색 점 */}
            {isRealCCTV && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  bgcolor: '#fbbf24',
                  borderRadius: '50%',
                  border: '1px solid white',
                }}
              />
            )}
            {/* 실제 연동 차수막 표시용 주황색 점 */}
            {isRealGate && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  bgcolor: '#f97316', // 주황색으로 변경
                  borderRadius: '50%',
                  border: '1px solid white',
                }}
              />
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%'
              }}
            >
              {device.name}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function DevicePanel({ selectedDevice, onDeviceSelect, isAdmin, onDeviceClick, gateStatus = {} }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // 백엔드 DB에서 데이터를 불러오기 위한 상태
  const [cameras, setCameras] = useState([]);
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cctvExpanded, setCctvExpanded] = useState(true);
  const [gatesExpanded, setGatesExpanded] = useState(true);

  // 백엔드 DB에서 CCTV와 차수막 데이터 로드
  // 백엔드에서 다음 형식으로 데이터를 제공해야 합니다:
  // 
  // CCTV 데이터 형식:
  // {
  //   id: "cctv-001",           // 필수: 고유 ID
  //   name: "강남구 CCTV-001",  // 필수: 표시할 이름
  //   lat: 37.497766,          // 필수: 위도
  //   lon: 127.025837,         // 필수: 경도
  //   status: "online",        // 선택: 상태 (기본값: "online")
  //   description: "설명",     // 선택: 설명 (기본값: "CCTV 카메라")
  //   can_stream: true,        // 선택: 스트리밍 가능 여부 (기본값: false)
  //   type: "cctv-real"        // 선택: 타입 (기본값: can_stream에 따라 결정)
  // }
  //
  // 차수막 데이터 형식:
  // {
  //   id: "gate-001",           // 필수: 고유 ID
  //   name: "강남구 차수막-001", // 필수: 표시할 이름
  //   lat: 37.497766,          // 필수: 위도
  //   lon: 127.025837,         // 필수: 경도
  //   status: "online",        // 선택: 상태 (기본값: "online")
  //   description: "설명",     // 선택: 설명 (기본값: "홍수 방지 차수막")
  //   is_real: true,           // 선택: 실제 연동 여부 (기본값: false)
  //   type: "gate-real"        // 선택: 타입 (기본값: is_real에 따라 결정)
  // }
  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true);
      setError(null);

      try {
        // 백엔드 API에서 데이터 가져오기
        const [camerasData, gatesData] = await Promise.all([
          getCameras(),
          getGates()
        ]);

        // 백엔드 데이터를 프론트엔드 형식에 맞게 변환
        if (camerasData && Array.isArray(camerasData) && camerasData.length > 0) {
          const formattedCameras = camerasData.map(camera => ({
            id: camera.id || camera.camera_id,
            name: camera.name || camera.camera_name,
            lat: camera.lat || camera.latitude,
            lon: camera.lon || camera.longitude,
            status: camera.status || 'online',
            description: camera.description || 'CCTV 카메라',
            canStream: camera.can_stream || camera.canStream || false,
            type: camera.type || (camera.can_stream || camera.canStream ? 'cctv-real' : 'cctv-sim')
          }));
          console.log('🌐 백엔드 DB에서 CCTV 데이터를 불러왔습니다:', formattedCameras);
          setCameras(formattedCameras);
        } else {
          console.log('📱 백엔드에서 CCTV 데이터가 없습니다');
          setCameras([]);
        }

        if (gatesData && Array.isArray(gatesData) && gatesData.length > 0) {
          const formattedGates = gatesData.map(gate => ({
            id: gate.id || gate.gate_id,
            name: gate.name || gate.gate_name,
            lat: gate.lat || gate.latitude,
            lon: gate.lon || gate.longitude,
            status: gate.status || 'online',
            description: gate.description || '홍수 방지 차수막',
            type: gate.type || (gate.is_real || gate.isReal ? 'gate-real' : 'gate-sim')
          }));
          console.log('🌐 백엔드 DB에서 차수막 데이터를 불러왔습니다:', formattedGates);
          setGates(formattedGates);
        } else {
          console.log('📱 백엔드에서 차수막 데이터가 없습니다');
          setGates([]);
        }

      } catch (err) {
        console.error("백엔드 API 호출 실패:", err.message);

        // 에러 타입에 따른 구체적인 메시지 제공
        let errorMessage = "백엔드 연결에 실패했습니다.";

        if (err.response) {
          // 서버 응답이 있는 경우
          if (err.response.status === 404) {
            errorMessage = "백엔드 API 엔드포인트를 찾을 수 없습니다.";
          } else if (err.response.status === 500) {
            errorMessage = "백엔드 서버 오류가 발생했습니다.";
          } else if (err.response.status >= 400) {
            errorMessage = `백엔드 요청 오류 (${err.response.status}).`;
          }
        } else if (err.request) {
          // 요청은 보냈지만 응답이 없는 경우
          errorMessage = "백엔드 서버에 연결할 수 없습니다.";
        }

        setError(errorMessage);

        // API 실패 시 빈 배열로 설정
        setCameras([]);
        setGates([]);
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, []);

  const allDevices = [...cameras, ...gates];
  const totalCount = allDevices.length;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden', // 패널 전체 오버플로우 제어
        maxWidth: '300px', // 패널 최대 너비 제한 (240px → 320px로 확장)
        minWidth: '242px', // 최소 너비 설정 (220px → 280px로 확장)
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0, // 헤더는 고정
        }}
      >
        <Typography variant="h6" fontWeight={600} gutterBottom>
          디바이스 관리
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {cameras.length + gates.length} Total
        </Typography>
      </Box>

      {/* Device Lists - 스크롤 가능한 영역 */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5, // 간격 증가 (1 → 1.5)
          overflow: 'auto', // 통합 스크롤 적용
          px: 0, // 좌우 패딩 조정 (3 → 2로 줄여서 여백 최소화)
          pb: 2, // 하단 패딩 조정 (3 → 2로 줄여서 여백 최소화)
          '&::-webkit-scrollbar': {
            width: '10px'
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'grey.100',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'grey.400',
            borderRadius: '4px',
            '&:hover': {
              bgcolor: 'grey.500'
            }
          }
        }}
      >
        {/* CCTV 카메라 섹션 */}
        <Accordion
          expanded={cctvExpanded}
          onChange={() => setCctvExpanded(!cctvExpanded)}
          sx={{
            '& .MuiAccordionSummary-root': {
              minHeight: 48,
              '&.Mui-expanded': {
                minHeight: 48,
              },
            },
            '& .MuiAccordionDetails-root': {
              p: 0,
              maxHeight: 'none', // 개별 스크롤 제거
              overflow: 'visible' // 개별 스크롤 제거
            },
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            mb: 2,
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              px: 3, // 좌우 패딩 조정 (3 → 2로 줄여서 여백 최소화)
              py: 1.5, // 상하 패딩 유지
              '& .MuiAccordionSummary-content': {
                m: 0,
                alignItems: 'center',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CameraAlt sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={600}>
                CCTV 카메라 ({cameras.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  로딩 중...
                </Typography>
              </Box>
            ) : error ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="error" gutterBottom>
                  {error}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  백엔드 서버를 확인해주세요
                </Typography>
              </Box>
            ) : cameras.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  백엔드에서 CCTV 데이터를 불러올 수 없습니다
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  백엔드 DB에 CCTV 데이터를 추가해주세요
                </Typography>
              </Box>
            ) : (
              cameras.map((device) => (
                <DeviceListItem
                  key={device.id}
                  device={device}
                  deviceType="camera"
                  selected={selectedDevice === device.id}
                  onSelect={onDeviceSelect}
                  onDeviceClick={onDeviceClick}
                />
              ))
            )}
          </AccordionDetails>
        </Accordion>

        {/* 차수막 섹션 */}
        <Accordion
          expanded={gatesExpanded}
          onChange={() => setGatesExpanded(!gatesExpanded)}
          sx={{
            '& .MuiAccordionSummary-root': {
              minHeight: 48,
              '&.Mui-expanded': {
                minHeight: 48,
              },
            },
            '& .MuiAccordionDetails-root': {
              p: 0,
              maxHeight: 'none', // 개별 스크롤 제거
              overflow: 'visible' // 개별 스크롤 제거
            },
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            mb: 2,
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              px: 2, // 좌우 패딩 조정 (3 → 2로 줄여서 여백 최소화)
              py: 1.5, // 상하 패딩 유지
              '& .MuiAccordionSummary-content': {
                m: 0,
                alignItems: 'center',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={600}>
                차수막 ({gates.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  로딩 중...
                </Typography>
              </Box>
            ) : error ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="error" gutterBottom>
                  {error}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  백엔드 서버를 확인해주세요
                </Typography>
              </Box>
            ) : gates.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  백엔드에서 차수막 데이터를 불러올 수 없습니다
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  백엔드 DB에 차수막 데이터를 추가해주세요
                </Typography>
              </Box>
            ) : (
              gates.map((device) => (
                <DeviceListItem
                  key={device.id}
                  device={device}
                  deviceType="gate"
                  selected={selectedDevice === device.id}
                  onSelect={onDeviceSelect}
                  onDeviceClick={onDeviceClick}
                />
              ))
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
}
