import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import { Close, Videocam, Warning } from '@mui/icons-material';
import LiveVideoFeed from './LiveVideoFeed';

const LiveCameraModal = ({ open, onClose, device }) => {
  if (!device) return null;

  // Jetson Nano의 실제 IP 주소 (프로젝트 환경에 맞게 수정 필요)
  const JETSON_IP = '192.168.100.214'; // Actual Jetson Nano IP

  // 실제 스트리밍 가능한 CCTV인지 확인
  const isRealCCTV = device.id == 2;

  // 시뮬레이션용 CCTV인지 확인
  const isSimulationCCTV = !isRealCCTV;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Videocam sx={{ color: isRealCCTV ? 'success.main' : 'warning.main' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {device.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Device ID: {device.id} | Type: {device.type}
            </Typography>
          </Box>
          <Chip
            label={isRealCCTV ? '실시간 스트리밍' : '시뮬레이션 CCTV'}
            color={isRealCCTV ? 'success' : 'warning'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {isSimulationCCTV ? (
          // 시뮬레이션용 CCTV일 때 연결 안내 메시지
          <Paper
            sx={{
              width: '100%',
              height: 480,
              bgcolor: 'warning.50',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              border: '2px dashed',
              borderColor: 'warning.main',
            }}
          >
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h4" color="warning.main" gutterBottom>
                📹
              </Typography>
              <Typography variant="h6" color="warning.main" fontWeight={600} gutterBottom>
                CCTV 연결을 해주세요
              </Typography>
              <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                이 CCTV는 시뮬레이션용입니다.
                <br />
                실제 스트리밍을 위해서는 하드웨어 연결이 필요합니다.
              </Typography>
            </Box>
          </Paper>
        ) : (
          // 실제 스트리밍 가능한 CCTV일 때 영상 표시
          <Paper
            sx={{
              width: '100%',
              height: 480,
              bgcolor: 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {/* Jetson Nano IP 주소 확인 메시지 */}
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                px: 2,
                py: 1,
                borderRadius: 1,
                fontSize: '0.75rem',
              }}
            >
              Jetson IP: {JETSON_IP}
            </Box>

            {/* 모달이 열려있을 때만 LiveVideoFeed 컴포넌트 렌더링 */}
            {open && (
              <LiveVideoFeed
                jetsonIp={JETSON_IP}
                autoConnect={true} // 모달이 열리면 자동으로 연결
                deviceId={device.id}
              />
            )}
          </Paper>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LiveCameraModal;