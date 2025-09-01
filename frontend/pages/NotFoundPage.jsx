import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Home, ArrowBack, Search, Error } from '@mui/icons-material';
import { ROUTES } from '../routes/constants';

const NotFoundPage = ({ isDark, setIsDark }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3
    }}>
      <Container maxWidth="md">
        <Paper
          elevation={6}
          sx={{
            p: 6,
            borderRadius: '16px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {/* 404 Icon */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                width: 120,
                height: 120,
                bgcolor: 'error.main',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 8px 32px rgba(244, 67, 54, 0.3)'
              }}
            >
              <Error sx={{ fontSize: 60, color: 'white' }} />
            </Box>
          </Box>

          {/* 404 Text */}
          <Typography
            variant="h1"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(135deg, #f44336 0%, #ff9800 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '4rem', md: '6rem' }
            }}
          >
            404
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: 'text.primary'
            }}
          >
            페이지를 찾을 수 없습니다
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 4,
              maxWidth: 500,
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            URL을 다시 확인하거나 아래 버튼을 사용하여 홈페이지로 돌아가세요.
          </Typography>

          {/* Action Buttons */}
          <Box sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Home />}
              onClick={() => navigate(ROUTES.HOME)}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(37, 99, 235, 0.3)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              홈으로 돌아가기
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 600,
                borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              이전 페이지
            </Button>
          </Box>

          {/* Additional Help */}
          <Box sx={{ mt: 6, p: 3, bgcolor: 'background.paper', borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
              도움이 필요하신가요?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              다음 페이지들을 확인해보세요:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="text"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                sx={{ color: 'primary.main', fontWeight: 500 }}
              >
                대시보드
              </Button>
              <Button
                variant="text"
                onClick={() => navigate(ROUTES.LOGIN)}
                sx={{ color: 'primary.main', fontWeight: 500 }}
              >
                로그인
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default NotFoundPage; 