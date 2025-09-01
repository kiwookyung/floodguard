import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';

const LiveVideoFeed = ({ jetsonIp, autoConnect = false }) => {
  const [imageData, setImageData] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [ws, setWs] = useState(null);
  const imageUrlRef = useRef(null);

  // 로컬 테스트를 위한 기본 URL 설정
  const getWebSocketUrl = () => {
    if (jetsonIp) {
      return `ws://${jetsonIp}:8765/ws`;
    }
    // 로컬 테스트용
    return 'ws://localhost:8765/ws';
  };

  const connectWebSocket = () => {
    const wsUrl = getWebSocketUrl();
    console.log(`WebSocket 연결 시도: ${wsUrl}`);

    setIsConnecting(true);
    setError(null);

    const newWs = new WebSocket(wsUrl);

    newWs.onopen = () => {
      console.log(`WebSocket 연결 성공: ${wsUrl}`);
      setIsConnecting(false);
      setError(null);
      setWs(newWs);

      // 연결 즉시 스트리밍 시작 요청
      startStreaming(newWs);
    };

    newWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'frame') {
          // Base64 이미지 데이터를 Blob으로 변환
          const byteCharacters = atob(data.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });

          // 이전 이미지 URL이 있다면 메모리에서 해제
          if (imageUrlRef.current) {
            URL.revokeObjectURL(imageUrlRef.current);
          }

          // 새로운 이미지 URL 생성
          const newImageUrl = URL.createObjectURL(blob);
          setImageData(newImageUrl);
          imageUrlRef.current = newImageUrl;
        } else if (data.type === 'stream_started') {
          console.log('스트리밍 시작됨:', data.message);
          setIsStreaming(true);
        } else if (data.type === 'stream_stopped') {
          console.log('스트리밍 중지됨:', data.message);
          setIsStreaming(false);
        }
      } catch (error) {
        console.error('메시지 파싱 오류:', error);
      }
    };

    newWs.onerror = (err) => {
      console.error('WebSocket 에러:', err);
      setError('영상 스트림 연결에 실패했습니다. 서버가 실행 중인지 확인하세요.');
      setIsConnecting(false);
      setIsStreaming(false);
    };

    newWs.onclose = () => {
      console.log('WebSocket 연결 종료');
      setIsConnecting(false);
      setIsStreaming(false);
      setWs(null);
    };

    return newWs;
  };

  const startStreaming = (websocket) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({ type: 'start_stream' }));
    }
  };

  const stopStreaming = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'stop_stream' }));
    }
  };

  const handleConnect = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      const newWs = connectWebSocket();
      setWs(newWs);
    }
  };

  const handleDisconnect = () => {
    if (ws) {
      stopStreaming();
      ws.close();
      setWs(null);
      setIsStreaming(false);

      // 이미지 정리
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        setImageData(null);
      }
    }
  };

  // autoConnect가 true이면 컴포넌트 마운트 시 자동 연결
  useEffect(() => {
    if (autoConnect && jetsonIp) {
      handleConnect();
    }
  }, [autoConnect, jetsonIp]);

  // 컴포넌트가 언마운트될 때 정리
  useEffect(() => {
    return () => {
      if (ws) {
        stopStreaming();
        ws.close();
      }
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, [ws]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#000' }}>
      {/* 연결 상태 표시 및 컨트롤 버튼 */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 3,
          display: 'flex',
          gap: 1,
        }}
      >
        {!ws || ws.readyState !== WebSocket.OPEN ? (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleConnect}
            disabled={isConnecting}
            startIcon={<PlayArrow />}
          >
            {isConnecting ? '연결 중...' : '연결'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={handleDisconnect}
            startIcon={<Stop />}
          >
            연결 해제
          </Button>
        )}
      </Box>

      {/* 연결 상태 표시 */}
      {isConnecting && (
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', zIndex: 2,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, color: 'white',
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2">카메라 연결 중...</Typography>
        </Box>
      )}

      {/* 에러 표시 */}
      {error && !isConnecting && (
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', zIndex: 2,
            textAlign: 'center', color: 'white', p: 2,
          }}
        >
          <Typography variant="body2" color="error.light">
            {error}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleConnect}
            sx={{ mt: 1, color: 'white', borderColor: 'white' }}
          >
            재연결 시도
          </Button>
        </Box>
      )}

      {/* 연결되지 않은 상태 */}
      {!ws && !isConnecting && !error && (
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', zIndex: 2,
            textAlign: 'center', color: 'white', p: 2,
          }}
        >
          <Typography variant="body2">
            카메라에 연결하려면 "연결" 버튼을 클릭하세요
          </Typography>
        </Box>
      )}

      {/* 비디오 스트림 표시 */}
      {imageData && (
        <img
          src={imageData}
          alt="Live Stream"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      )}

      {/* 스트리밍 상태 표시 */}
      {isStreaming && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1,
            fontSize: '0.75rem',
          }}
        >
          🔴 LIVE
        </Box>
      )}
    </Box>
  );
};

export default LiveVideoFeed;