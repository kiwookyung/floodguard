// src/components/common/Footer.jsx

import React from 'react';
import { Box, Typography } from '@mui/material';
import Logo from '../Logo';

export default function Footer({ isDark }) {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        mt: 0,
        borderTop: '0.5px solid',
        borderColor: 'divider',
        background: isDark
          ? 'linear-gradient(to bottom, #1e293b 0%, #0f172a 100%)'
          : 'linear-gradient(to bottom, #e2e8f0 0%, #cbd5e1 100%)',
        px: { xs: 2, sm: 3, lg: 4 },
      }}
    >
      <Box
        sx={{
          maxWidth: '1280px',
          mx: 'auto',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Logo size={24} isDark={isDark} withText={false} />
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 14 }}>
            SSAFY 2학기 프로젝트 광주 C101 제작
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center'
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            © 2025 Smart Prevention System • All Rights Reserved
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            AI-Powered Technology
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
