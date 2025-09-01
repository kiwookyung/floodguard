import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TablePagination,
  useTheme,
} from '@mui/material';
import { Error, Warning, Info, Clear, Close } from '@mui/icons-material';
import { getLogs } from '../services/logs.js';

// 로그 데이터 변환 함수
const transformLogData = (apiLogs) => {
  return apiLogs.map(log => {
    // 시간 포맷팅
    let time = 'Invalid Date';
    try {
      if (log.created_at) {
        time = new Date(log.created_at).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
    } catch (e) {
      console.warn('시간 파싱 실패:', e);
    }

    // 레벨과 디바이스 결정
    let level = '경보';
    let device = 'System';
    let message = log.details || '시스템 알림';

    if (log.action === 'camera') {
      device = 'CCTV';
      try {
        const details = JSON.parse(log.details || '{}');
        if (details.risk_level === 'Danger') {
          level = '경보';
          message = `위험 수준: 높음 (${details.final_score})`;
        } else if (details.risk_level === 'Caution') {
          level = '경보';
          message = `위험 수준: 주의 (${details.final_score})`;
        } else if (details.risk_level === 'Warning') {
          level = '경보';
          message = `위험 수준: 경고 (${details.final_score})`;
        } else {
          level = '경보';
          message = `모니터링 중 (${details.final_score})`;
        }
      } catch (e) {
        level = '경보';
        message = log.details || 'CCTV 모니터링';
      }
    } else if (log.gate_id || (log.action && String(log.action).includes('gate'))) {
      device = log.gate_id ? `Gate ${log.gate_id}` : 'Gate';
      level = '게이트';
      if (log.action && String(log.action).includes('All Gates')) {
        device = 'All Gates';
        message = '모든 차수막 일괄 제어';
      } else {
        message = log.details || '차수막 상태 변경';
      }
    } else {
      level = '경보';
      message = log.details || '시스템 알림';
    }

    return {
      time,
      level,
      device,
      message,
      id: log.id,
      created_at: log.created_at,
      originalData: log // 원본 데이터 보존
    };
  });
};

// 레벨별 색상 매핑
const levelColor = {
  '경보': 'warning',
  '게이트': 'info'
};

const AlertLogTable = ({ realTimeLogs = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('day');

  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 상세 정보 팝업 상태
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 로그 데이터 로드
  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const logsData = await getLogs(period);
        // API 응답을 컴포넌트 형식으로 변환
        const transformedLogs = transformLogData(logsData);
        setLogs(transformedLogs);
      } catch (err) {
        console.error("로그 데이터 로드 실패:", err);
        setError(err.message);
        // 에러 시 빈 배열로 설정
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [period]);

  // 필터링된 로그 데이터
  const filteredLogs = useMemo(() => {
    // 실시간 로그와 기존 로그를 합침
    const allLogs = [...realTimeLogs, ...logs];

    return allLogs.filter(log => {
      // 레벨 필터링
      if (levelFilter !== 'all' && log.level !== levelFilter) {
        return false;
      }

      // 디바이스 필터링
      if (deviceFilter !== 'all') {
        if (deviceFilter === 'gate' && !log.device.toLowerCase().includes('gate')) {
          return false;
        }
        if (deviceFilter === 'cctv' && log.device !== 'CCTV') {
          return false;
        }
      }

      // 검색어 필터링
      if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [realTimeLogs, logs, levelFilter, deviceFilter, searchTerm]);

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setPage(0);
  }, [searchTerm, levelFilter, deviceFilter, period]);

  const clearFilters = () => {
    setSearchTerm('');
    setLevelFilter('all');
    setDeviceFilter('all');
    setPage(0); // 필터 클리어 시 페이지 리셋
  };

  const hasFilters = searchTerm || levelFilter !== 'all' || deviceFilter !== 'all';

  // 페이지네이션 핸들러
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 상세 정보 팝업 핸들러
  const handleLogClick = (log) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedLog(null);
  };

  // 페이지네이션된 로그 데이터
  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box
      sx={{
        bgcolor: isDark ? 'rgba(75, 85, 99, 0.9)' : 'background.paper',
        borderRadius: 2,
        p: { xs: 2, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            알림 로그
          </Typography>
          <Typography variant="caption" color="text.secondary">
            최근 시스템 알림
            {realTimeLogs.length > 0 && (
              <span style={{ color: 'primary.main', fontWeight: 600 }}>
                {' '}(실시간: {realTimeLogs.length}개)
              </span>
            )}
          </Typography>
        </Box>
        {hasFilters && (
          <Tooltip title="필터 초기화">
            <IconButton
              size="small"
              onClick={clearFilters}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                color: 'text.secondary',
              }}
            >
              <Clear fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          size="small"
          placeholder="알림 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
        <FormControl size="small" fullWidth>
          <InputLabel>레벨</InputLabel>
          <Select value={levelFilter} label="레벨" onChange={(e) => setLevelFilter(e.target.value)}>
            <MenuItem value="all">모든 레벨</MenuItem>
            <MenuItem value="경보">경보</MenuItem>
            <MenuItem value="게이트">게이트</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>디바이스</InputLabel>
          <Select value={deviceFilter} label="디바이스" onChange={(e) => setDeviceFilter(e.target.value)}>
            <MenuItem value="all">모든 디바이스</MenuItem>
            <MenuItem value="gate">차수막</MenuItem>
            <MenuItem value="cctv">CCTV</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>기간</InputLabel>
          <Select value={period} label="기간" onChange={(e) => setPeriod(e.target.value)}>
            <MenuItem value="day">일</MenuItem>
            <MenuItem value="week">주</MenuItem>
            <MenuItem value="month">월</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Result count */}
      <Typography variant="caption" color="text.secondary">
        총 {logs.length}개 중 {filteredLogs.length}개 표시
        {hasFilters && ' (필터링됨)'}
      </Typography>

      {/* Table */}
      <Box
        sx={{
          flex: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 2,
          overflow: 'hidden',
          '&:hover': {
            overflow: 'auto',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '3px',
            },
          },
        }}
      >
        <TableContainer component={Paper} sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>시간</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>레벨</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>디바이스</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log, idx) => (
                  <TableRow
                    key={log.id || idx}
                    hover
                    onClick={() => handleLogClick(log)}
                    sx={{
                      cursor: 'pointer',
                      // 실시간 로그는 배경색으로 구분
                      bgcolor: realTimeLogs.some(rtLog => rtLog.id === log.id) ? 'primary.50' : 'transparent',
                      '&:hover': {
                        bgcolor: realTimeLogs.some(rtLog => rtLog.id === log.id) ? 'primary.100' : 'action.hover'
                      }
                    }}
                  >
                    <TableCell>{log.time}</TableCell>
                    <TableCell>
                      <Chip
                        icon={<Warning fontSize="small" />}
                        label={log.level}
                        color={levelColor[log.level]}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>{log.device}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {hasFilters
                        ? '필터와 일치하는 알림이 없습니다'
                        : '사용 가능한 알림이 없습니다'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* 페이지네이션 */}
      <TablePagination
        component="div"
        count={filteredLogs.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage="페이지당 행 수:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
      />

      {/* 상세 정보 팝업 */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              알림 상세정보
            </Typography>
            <IconButton onClick={handleCloseDetailDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={<Warning fontSize="small" />}
                  label={selectedLog.level}
                  color={levelColor[selectedLog.level]}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {selectedLog.time}
                </Typography>
              </Box>

              {/* 레벨 설명 */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  레벨
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {selectedLog.level}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(() => {
                    switch (selectedLog.level) {
                      case '경보': return '주의가 필요한 상황';
                      case '게이트': return '차수막 제어 명령 실행';
                      default: return '시스템 알림';
                    }
                  })()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  디바이스
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {selectedLog.device}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  메시지
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedLog.message}
                </Typography>
              </Box>

              {/* 원본 데이터 표시 (디버깅용) */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  원본 데이터
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{
                  fontFamily: 'monospace',
                  bgcolor: 'grey.50',
                  p: 1,
                  borderRadius: 1,
                  display: 'block',
                  whiteSpace: 'pre-wrap'
                }}>
                  {JSON.stringify(selectedLog.originalData, null, 2)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog} color="primary">
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertLogTable;
