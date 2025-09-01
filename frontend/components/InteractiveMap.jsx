import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import { Box, Typography, IconButton, Tooltip, Chip, Button } from '@mui/material';
import { RestartAlt } from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 커스텀 아이콘 생성
const createCustomIcon = (type, isSelected = false) => {
  let iconColor, iconSize, iconText;

  // 디버깅을 위한 로그
  console.log('🎨 아이콘 생성:', { type, isSelected });

  switch (type) {
    case 'cctv-real':
    case 'cctv-real-001':
      iconColor = '#16a34a'; // 초록색으로 통일 - 실제 스트리밍 가능
      iconText = '📹';
      break;
    case 'cctv-sim':
    case 'cctv-sim-001':
    case 'cctv-sim-002':
    case 'cctv-sim-003':
    case 'cctv-sim-004':
    case 'cctv-sim-005':
      iconColor = '#16a34a'; // 초록색으로 통일 - 시뮬레이션용
      iconText = '📹';
      break;
    case 'gate-real':
    case 'gate-real-001':
      iconColor = '#3b82f6'; // 파란색 - 실제 연동 차수막
      iconText = '🚪';
      break;
    case 'gate-sim':
    case 'gate-001':
    case 'gate-002':
    case 'gate-003':
    case 'gate-004':
      iconColor = '#3b82f6'; // 파란색으로 통일 - 범례와 일치
      iconText = '🚪';
      break;
    default:
      // 기본값 대신 디바이스 ID에서 타입을 추측
      if (type && typeof type === 'string') {
        if (type.toLowerCase().includes('cctv')) {
          iconColor = '#16a34a';
          iconText = '📹';
        } else if (type.toLowerCase().includes('gate')) {
          iconColor = '#3b82f6';
          iconText = '🚪';
        } else {
          iconColor = '#666666';
          iconText = '❓';
        }
      } else {
        iconColor = '#666666';
        iconText = '❓';
      }
      console.log('⚠️ 알 수 없는 타입, 기본값 사용:', { type, iconColor, iconText });
  }

  // 선택된 디바이스는 더 큰 크기와 강조 테두리
  iconSize = isSelected ? [40, 40] : [32, 32];
  const borderWidth = isSelected ? 4 : 3;
  const borderColor = isSelected ? '#fbbf24' : 'white'; // 선택 시 노란색 테두리
  const shadow = isSelected ? '0 4px 16px rgba(251, 191, 36, 0.6)' : '0 2px 8px rgba(0,0,0,0.3)';

  return L.divIcon({
    html: `
      <div style="
        background-color: ${iconColor};
        width: ${iconSize[0]}px;
        height: ${iconSize[1]}px;
        border-radius: 50%;
        border: ${borderWidth}px solid ${borderColor};
        box-shadow: ${shadow};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${isSelected ? 20 : 16}px;
        position: relative;
        transition: all 0.3s ease;
      ">
        ${iconText}
        ${type === 'cctv-real' ? '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background-color: #fbbf24; border-radius: 50%; border: 1px solid white;"></div>' : ''}
        ${type === 'gate-real' ? '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background-color: #f97316; border-radius: 50%; border: 1px solid white;"></div>' : ''}
      </div>
    `,
    className: 'custom-marker',
    iconSize: iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1] / 2]
  });
};

// 지도 리셋 기능을 위한 컴포넌트
function ResetMapView({ onReset }) {
  const map = useMap();

  const handleReset = () => {
    try {
      map.setView([37.49796164123304, 127.02760159878154], 15);
    } catch (error) {
      console.error('지도 리셋 실패:', error);
    }
  };

  React.useEffect(() => {
    if (onReset) {
      onReset(handleReset);
    }
  }, [onReset]);

  return null;
}

const InteractiveMap = ({ selectedDevice, onDeviceSelect, isAdmin, onDeviceClick, cameras = [], gates = [] }) => {
  const resetMapRef = useRef(null);
  const mapRef = useRef(null);

  // 백엔드 데이터를 프론트엔드 형식에 맞게 변환
  const transformBackendData = (devices, deviceType) => {
    return devices.map(device => ({
      id: device.id || device.camera_id || device.gate_id,
      name: device.name || device.camera_name || device.gate_name,
      type: device.type || deviceType, // 백엔드에서 받은 type 우선 사용
      lat: device.lat || device.latitude,
      lon: device.lon || device.longitude,
      position: [device.lat || device.latitude, device.lon || device.longitude],
      status: device.status || 'online',
      description: device.description || (deviceType === 'camera' ? 'CCTV 카메라' : '홍수 방지 차수막'),
      canStream: device.can_stream || device.canStream || false
    }));
  };

  // 백엔드 API에서 받은 데이터만 사용
  const allDevices = (() => {
    // 백엔드에서 받은 데이터를 변환
    const backendCameras = Array.isArray(cameras) && cameras.length > 0 ? transformBackendData(cameras, 'cctv-sim') : [];
    const backendGates = Array.isArray(gates) && gates.length > 0 ? transformBackendData(gates, 'gate-sim') : [];

    const backendDevices = [...backendCameras, ...backendGates];

    if (backendDevices.length > 0) {
      console.log('🌐 백엔드 DB에서 데이터를 불러왔습니다:', backendDevices);
      console.log('🔍 디바이스 타입 정보:', backendDevices.map(d => ({ id: d.id, type: d.type, name: d.name })));
      return backendDevices;
    } else {
      console.log('📱 백엔드에서 데이터가 없습니다');
      return [];
    }
  })();

  // 선택된 디바이스가 변경될 때 지도 이동
  useEffect(() => {
    if (selectedDevice && mapRef.current) {
      // 선택된 디바이스 찾기
      const selectedDeviceData = allDevices.find(device => device && device.id === selectedDevice);

      if (selectedDeviceData && selectedDeviceData.position && Array.isArray(selectedDeviceData.position) && selectedDeviceData.position.length === 2) {
        // 해당 위치로 지도 이동 (부드러운 애니메이션)
        mapRef.current.setView(selectedDeviceData.position, 16, {
          animate: true,
          duration: 1
        });
      }
    }
  }, [selectedDevice, allDevices]);

  const handleMarkerClick = (device) => {
    // device 데이터 유효성 검사
    if (!device || !device.id || !device.type) {
      console.warn('유효하지 않은 디바이스 데이터:', device);
      return;
    }

    // 모든 CCTV와 차수막에 대해 모달 열기
    if (device.type === 'cctv-real' || device.type === 'cctv-sim') {
      if (onDeviceSelect) {
        onDeviceSelect(device.id);
      }
      if (onDeviceClick) {
        onDeviceClick(device);
      }
    } else if (device.type === 'gate-real' || device.type === 'gate-sim') {
      // 실제 연동 차수막과 시뮬레이션 차수막 모두 제어 모달 열기
      if (onDeviceSelect) {
        onDeviceSelect(device.id);
      }
      if (onDeviceClick) {
        onDeviceClick(device);
      }
    }
  };

  const handleResetMap = (resetFunction) => {
    resetMapRef.current = resetFunction;
  };

  const handleResetClick = () => {
    try {
      if (resetMapRef.current) {
        resetMapRef.current();
      }
    } catch (error) {
      console.error('지도 리셋 클릭 실패:', error);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', borderRadius: 2 }}>
      <MapContainer
        center={[37.49796164123304, 127.02760159878154]}
        zoom={15}
        style={{ width: '100%', height: '100%', borderRadius: '12px', zIndex: 1 }}
        ref={mapRef} // MapContainer에 ref 추가
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <ResetMapView onReset={handleResetMap} />

        {/* CCTV 및 차수막 마커 표시 */}
        {allDevices
          .filter(device => device && device.position && Array.isArray(device.position) && device.position.length === 2)
          .map((device) => (
            <Marker
              key={device.id}
              position={device.position}
              icon={createCustomIcon(device.type, device.id === selectedDevice)}
              eventHandlers={{
                click: () => handleMarkerClick(device)
              }}
            >
              <Popup>
                <Box sx={{ textAlign: 'center', minWidth: 150 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    {device.name}
                  </Typography>

                  {/* 디버깅용 타입 정보 (개발 완료 후 제거) */}
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', opacity: 0.7 }}>
                    타입: {device.type || 'unknown'}
                  </Typography>

                  {/* 디바이스 타입별 설명 */}
                  <Typography variant="caption" color="text.secondary" display="block">
                    {device.type && device.type.includes('cctv') ? 'CCTV 카메라' : '홍수 방지 차수막'}
                  </Typography>

                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={
                        device.type && device.type.includes('cctv')
                          ? (device.type === 'cctv-real' ? '실시간 스트리밍' : '시뮬레이션')
                          : (device.type === 'gate-real' ? '실제 연동' : '시뮬레이션')
                      }
                      color={
                        device.type && device.type.includes('cctv')
                          ? (device.type === 'cctv-real' ? 'success' : 'error')
                          : (device.type === 'gate-real' ? 'success' : 'warning')
                      }
                      size="small"
                      sx={{
                        fontWeight: 600,
                        backgroundColor:
                          device.type && device.type.includes('cctv')
                            ? (device.type === 'cctv-real' ? '#16a34a' : '#dc2626')
                            : (device.type === 'gate-real' ? '#3b82f6' : '#f59e0b'),
                        color: 'white'
                      }}
                    />
                  </Box>

                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    상태: {device.status === 'online' ? '온라인' : '오프라인'}
                  </Typography>

                  {/* CCTV 스트리밍 버튼 */}
                  {(device.type === 'cctv-real' || device.type === 'cctv-sim') && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button
                        size="small"
                        variant="contained"
                        color={device.type === 'cctv-real' ? 'success' : 'error'}
                        sx={{ fontSize: '0.7rem', px: 1, py: 0.5 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeviceClick && onDeviceClick(device);
                        }}
                      >
                        {device.type === 'cctv-real' ? '실시간 보기' : '연결 필요'}
                      </Button>
                    </Box>
                  )}

                  {/* 차수막 제어 버튼 (관리자일 때만 표시) */}
                  {(device.type === 'gate-real' || device.type === 'gate-sim') && isAdmin && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        sx={{ fontSize: '0.7rem', px: 1, py: 0.5 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeviceClick && onDeviceClick(device);
                        }}
                      >
                        제어하기
                      </Button>
                    </Box>
                  )}

                  {/* 시뮬레이션용 차수막 연결 필요 메시지 */}
                  {device.type === 'gate-sim' && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        color="warning.main"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        ⚠️ 연결이 필요합니다
                      </Typography>
                    </Box>
                  )}

                  {/* 시뮬레이션용 CCTV 연결 필요 메시지 */}
                  {device.type === 'cctv-sim' && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        color="warning.main"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        ⚠️ 스트리밍 연결이 필요합니다
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* 투명한 범례 */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          p: 1.5,
          borderRadius: 1.5,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          color: 'white',
          minWidth: 160,
          zIndex: 999,
        }}
      >
        <Typography variant="caption" fontWeight={600} sx={{ color: 'white', mb: 1, display: 'block' }}>
          지도 범례
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#16a34a', position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: -1, right: -1, width: 4, height: 4, bgcolor: '#fbbf24', borderRadius: '50%', border: '1px solid white' }} />
            </Box>
            <Typography variant="caption" sx={{ color: 'white' }}>CCTV</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#3b82f6', position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: -1, right: -1, width: 4, height: 4, bgcolor: '#f97316', borderRadius: '50%', border: '1px solid white' }} />
            </Box>
            <Typography variant="caption" sx={{ color: 'white' }}>차수막</Typography>
          </Box>
          {/* 선택된 디바이스 정보 표시 */}
          {selectedDevice && (
            <Box sx={{
              mt: 1,
              pt: 1,
              borderTop: '1px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#fbbf24',
                animation: 'pulse 2s infinite'
              }} />
              <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 600 }}>
                선택됨
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* 리셋 버튼 */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 999,
        }}
      >
        <Tooltip title="지도 뷰 초기화" placement="bottom">
          <IconButton
            onClick={handleResetClick}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              },
            }}
          >
            <RestartAlt fontSize="small" />
          </IconButton>
        </Tooltip>
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

export default InteractiveMap;
