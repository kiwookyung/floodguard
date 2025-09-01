
import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { Logout, LightMode, DarkMode, ArrowBack, Login } from '@mui/icons-material';
import { ROUTES } from '../routes/constants';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import FeaturesSection from '../components/FeaturesSection';
import SystemArchitectureSection from '../components/SystemArchitectureSection';
import HeroSection from '../components/HeroSection';
import Footer from '../components/common/Footer';
import Logo from '../components/Logo';
import LoginHeader from '../components/common/LoginHeader';

export default function IndexPage({ isDark, setIsDark }) {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <Box sx={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)'
        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 25%, #f1f5f9 50%, #e2e8f0 75%, #cbd5e1 100%)'
    }}>

      <LoginHeader isDark={isDark} setIsDark={setIsDark} showAdminLogin={true} />

      {/* Hero Section */}
      <HeroSection isDark={isDark} navigate={navigate} />

      {/* Features Section */}
      <FeaturesSection isDark={isDark} />

      {/* System Architecture Section */}
      <SystemArchitectureSection isDark={isDark} />

      {/* Footer */}
      <Footer isDark={isDark} />
    </Box>
  );
}
