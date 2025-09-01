import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Typography,
  Button,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  Grid,
  Chip,
  useTheme
} from '@mui/material';
import { Visibility, VisibilityOff, VerifiedUser, Lock } from '@mui/icons-material';
import useAuthStore from '../stores/authStore';
import { ROUTES } from '../routes/constants';
import LoginHeader from '../components/common/LoginHeader';
import Logo from '../components/Logo';

const LoginPage = ({ isDark, setIsDark }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    clearError
  } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.DASHBOARD);
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleLogin = async () => {
    if (!email || !password) return;
    const result = await login(email, password);
    if (result.success) {
      setEmail('');
      setPassword('');
      // 로그인 성공 시 즉시 대시보드로 이동
      navigate(ROUTES.DASHBOARD);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          : 'linear-gradient(135deg, #f0fdfa 0%, #f9fafb 50%, #e2e8f0 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 배경 장식 요소들 */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 1
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
          filter: 'blur(60px)',
          zIndex: 1
        }}
      />

      <LoginHeader isDark={isDark} setIsDark={setIsDark} />

      <Grid container sx={{ minHeight: 'calc(100vh - 64px)', position: 'relative', zIndex: 2 }}>
        {/* Left Section - 브랜딩 및 소개 */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: { xs: 'center', md: 'flex-start' },
            px: { xs: 3, md: 8, lg: 10 },
            py: { xs: 6, md: 10, lg: 12 },
            textAlign: { xs: 'center', md: 'left' }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', md: 'flex-start' },
              maxWidth: 480
            }}
          >
            <Chip
              icon={<VerifiedUser sx={{ color: '#3b82f6' }} />}
              label="AI 기반 감지 시스템"
              sx={{
                mb: 4,
                fontWeight: 600,
                fontSize: '0.875rem',
                px: 3,
                py: 1.5,
                borderRadius: '9999px',
                background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                color: '#3b82f6'
              }}
            />

            <Typography
              variant="h2"
              fontWeight={800}
              sx={{
                mb: 3,
                background: 'linear-gradient(135deg, #0284c7 0%, #10b981 50%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: { xs: '2.5rem', md: '3rem', lg: '3.5rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.02em'
              }}
            >
              첨단 홍수 방재 시스템
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                mb: 4,
                maxWidth: 420,
                lineHeight: 1.6,
                fontWeight: 400,
                opacity: 0.8
              }}
            >
              AI 기반 관측 알고리즘과 자동화된 비상 대응 프로토콜을 통한 실시간 모니터링
            </Typography>

            {/* 추가 정보 칩들 */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Chip
                label="실시간 모니터링"
                size="small"
                sx={{
                  background: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
                  color: '#10b981',
                  fontWeight: 500
                }}
              />
              <Chip
                label="자동화 제어"
                size="small"
                sx={{
                  background: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                  border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                  color: '#8b5cf6',
                  fontWeight: 500
                }}
              />
            </Box>
          </Box>
        </Grid>

        {/* Right Section - 로그인 폼 */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 3, md: 4, lg: 6 },
            py: { xs: 4, md: 8 }
          }}
        >
          <Paper
            elevation={8}
            sx={{
              width: '100%',
              maxWidth: 460,
              p: { xs: 4, md: 5, lg: 6 },
              borderRadius: 4,
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: isDark
                ? '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                : '0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* 폼 배경 장식 */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))',
                filter: 'blur(30px)',
                zIndex: 0
              }}
            />

            <Box sx={{ textAlign: 'center', mb: 5, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Logo size={80} isDark={isDark} withText={false} />
              </Box>
              <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 1 }}>
                관리자 접근
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, opacity: 0.8 }}>
                플러드가드 제어 센터에 대한 보안 인증
              </Typography>
              <Chip
                icon={<VerifiedUser sx={{ color: '#10b981' }} />}
                label="다중 인증 활성화"
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
                  color: '#10b981',
                  border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#bbf7d0'}`,
                  px: 2,
                  py: 1,
                  '& .MuiChip-icon': {
                    color: '#10b981'
                  }
                }}
              />
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 4,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'error.main',
                  '& .MuiAlert-icon': {
                    color: 'error.main'
                  }
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'relative', zIndex: 1 }}>
              <TextField
                label="관리자 사용자명"
                placeholder="관리자 사용자명을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => handleFocus('email')}
                onBlur={() => handleBlur('email')}
                onKeyPress={handleKeyPress}
                fullWidth
                variant="outlined"
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    '& fieldset': {
                      border: 'none'
                    },
                    '&:hover': {
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)',
                      background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.02)'
                    },
                    '&.Mui-focused': {
                      borderColor: '#3b82f6',
                      borderWidth: '1px',
                      boxShadow: `0 0 0 3px ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'}`,
                      background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.05)'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 600,
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#374151',
                    '&.Mui-focused': {
                      color: '#3b82f6'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    fontWeight: 500,
                    color: isDark ? 'rgba(255, 255, 255, 0.9)' : '#111827'
                  }
                }}
              />

              <TextField
                label="보안 비밀번호"
                placeholder="보안 비밀번호를 입력하세요"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => handleFocus('password')}
                onBlur={() => handleBlur('password')}
                onKeyPress={handleKeyPress}
                fullWidth
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{
                          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                          '&:hover': {
                            color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                            background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                          }
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    '& fieldset': {
                      border: 'none'
                    },
                    '&:hover': {
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)',
                      background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.02)'
                    },
                    '&.Mui-focused': {
                      borderColor: '#3b82f6',
                      borderWidth: '1px',
                      boxShadow: `0 0 0 3px ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'}`,
                      background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.05)'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 600,
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#374151',
                    '&.Mui-focused': {
                      color: '#3b82f6'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    fontWeight: 500,
                    color: isDark ? 'rgba(255, 255, 255, 0.9)' : '#111827'
                  }
                }}
              />

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleLogin}
                disabled={loading || !email || !password}
                startIcon={<Lock />}
                sx={{
                  py: 2,
                  fontWeight: 700,
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #2563eb 0%, #059669 100%)',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(37, 99, 235, 0.4)',
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #047857 100%)'
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.3)'
                  },
                  '&:disabled': {
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                    transform: 'none',
                    boxShadow: 'none'
                  },
                  '& .MuiButton-startIcon': {
                    color: 'white'
                  }
                }}
              >
                {loading ? '로그인 중...' : '제어 센터 접근'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginPage;
