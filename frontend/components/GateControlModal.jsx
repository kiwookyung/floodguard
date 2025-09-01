import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close, Security, PlayArrow, Stop, Warning } from '@mui/icons-material';
import { controlIndividualGate } from '../services/gates.js';

const GateControlModal = ({ open, onClose, device, isAdmin }) => {
  const [gateStatus, setGateStatus] = useState('Closed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!device || !isAdmin) return null;

  // 실제 하드웨어와 연동되는 차수막인지 확인
  const isRealGate = device.type === 'gate-real' ||
    device.type === 'real' ||
    device.id === 'gate_A' ||
    device.id === 'gate_B' ||
    device.is_real === true ||
    device.isReal === true ||
    device.hardware_connected === true;

  // 시뮬레이션용 차수막인지 확인
  const isSimulationGate = !isRealGate;

  const handleGateControl = async (action) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 백엔드 API 형식에 맞게 요청 데이터 구성
      const controlData = {
        command: action // 'open' 또는 'close'
      };

      await controlIndividualGate(device.id, controlData);
      setGateStatus(action === 'open' ? 'Open' : 'Closed');
      setSuccess(true);

      // 성공 메시지 3초 후 제거
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('차수막 제어 실패:', err);

      // 422 에러에 대한 상세 정보 제공
      if (err.response?.status === 422) {
        setError(`요청 형식 오류 (422): 백엔드에서 요청 데이터를 처리할 수 없습니다. 
        요청 데이터: ${JSON.stringify(controlData)}`);
      } else if (err.response?.status === 401) {
        setError('인증 오류 (401): 로그인이 필요하거나 토큰이 만료되었습니다.');
      } else if (err.response?.status === 403) {
        setError('권한 오류 (403): 이 작업을 수행할 권한이 없습니다.');
      } else {
        setError(err.message || '차수막 제어에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGate = () => {
    handleGateControl('open');
  };

  const handleCloseGate = () => {
    handleGateControl('close');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: isRealGate ? 'success.main' : 'warning.main',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Security />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {device.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Device ID: {device.id} | Type: {device.type}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip
                label={device.status}
                color={device.status === 'online' ? 'success' : 'error'}
                size="small"
              />
              <Chip
                label={isRealGate ? '실제 연동' : '시뮬레이션'}
                color={isRealGate ? 'success' : 'warning'}
                size="small"
              />
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {/* 실제 연동 차수막 안내 */}
        {isRealGate && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>실제 하드웨어 연동 차수막</strong>
              <br />
              이 차수막은 실제 물리적 하드웨어와 연결되어 있습니다.
              <br />
              제어 시 실제 차수막이 움직입니다.
            </Typography>
          </Alert>
        )}

        {/* 시뮬레이션 차수막 안내 */}
        {isSimulationGate && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>시뮬레이션 차수막</strong>
              <br />
              이 차수막은 시뮬레이션용입니다.
              <br />
              실제 하드웨어와 연결되지 않습니다.
            </Typography>
          </Alert>
        )}

        {/* 제어 버튼 */}
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            차수막 제어
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleOpenGate}
              disabled={loading || gateStatus === 'Open'}
              startIcon={<PlayArrow />}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={20} /> : '열기'}
            </Button>

            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={handleCloseGate}
              disabled={loading || gateStatus === 'Closed'}
              startIcon={<Stop />}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={20} /> : '닫기'}
            </Button>
          </Stack>

          {/* 현재 상태 표시 */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              현재 상태:
            </Typography>
            <Chip
              label={gateStatus}
              color={gateStatus === 'Open' ? 'success' : 'default'}
              size="large"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Paper>

        {/* 성공/에러 메시지 */}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            차수막 제어가 성공적으로 완료되었습니다!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* 디버깅 정보 */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>디버깅 정보:</strong>
            <br />
            • 차수막 ID: {device.id}
            <br />
            • 차수막 타입: {device.type}
            <br />
            • 실제 연동: {isRealGate ? '예' : '아니오'}
            <br />
            • 관리자 권한: {isAdmin ? '예' : '아니오'}
            <br />
            • API 엔드포인트: /api/gates/{device.id}/control
            <br />
            • 요청 형식: {"{ \"command\": \"open\" }"} 또는 {"{ \"command\": \"close\" }"}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GateControlModal; 