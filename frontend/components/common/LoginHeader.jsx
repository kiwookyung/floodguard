// components/common/LoginHeader.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, IconButton, Menu, MenuItem, Avatar, Typography, CircularProgress } from '@mui/material';
import { ArrowBack, Logout, LightMode, DarkMode, Login, Person, KeyboardArrowDown } from '@mui/icons-material';
import useAuthStore from '../../stores/authStore';
import { ROUTES } from '../../routes/constants';
import Logo from '../Logo';
import { getMe } from "../../services/auth.js";

export default function LoginHeader({ isDark, setIsDark, showAdminLogin = false }) {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const [userInfo, setUserInfo] = useState(null);
  const [userInfoLoading, setUserInfoLoading] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

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

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };



  return (
    <Box
      component="header"
      sx={{
        borderBottom: '0.5px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 3, lg: 4 },
        bgcolor: isDark ? 'rgba(26,26,26,0.75)' : 'rgba(255,255,255,0.75)'
      }}
    >
      <Box
        onClick={() => navigate(ROUTES.HOME)}
        sx={{ cursor: 'pointer' }}
      >
        <Logo size={36} isDark={isDark} withText={true} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {showAdminLogin && !isAuthenticated ? (
          // IndexPage용 Admin Login 버튼 (로그인 상태가 아닐 때만 표시)
          <Button
            variant="text"
            startIcon={<Login />}
            onClick={() => navigate(ROUTES.LOGIN)}
            sx={{ display: { xs: 'none', sm: 'inline-flex' }, fontWeight: 500, fontSize: 14, lineHeight: 1.2 }}
          >
            관리자 로그인
          </Button>
        ) : !showAdminLogin ? (
          // LoginPage용 Home 버튼
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={() => navigate(ROUTES.HOME)}
            sx={{ display: { xs: 'none', sm: 'inline-flex' }, fontWeight: 500, fontSize: 14, lineHeight: 1.2 }}
          >
            홈으로
          </Button>
        ) : null}

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
                  {userInfoLoading ? 'Loading...' : userInfo?.email || 'User'}
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
                    {userInfo?.email || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {userInfo?.id || 'N/A'}
                  </Typography>
                </Box>
              </MenuItem>
            </Menu>
          </Box>
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

        <Box
          onClick={() => setIsDark(!isDark)}
          sx={{
            position: 'relative',
            width: 48,
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
              transform: 'scale(1.05)'
            }
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
              justifyContent: 'center'
            }}
          >
            {isDark ? (
              <LightMode sx={{ fontSize: 12, color: '#fbbf24' }} />
            ) : (
              <DarkMode sx={{ fontSize: 12, color: '#6b7280' }} />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
