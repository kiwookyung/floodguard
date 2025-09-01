import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Logo({ size = 96, isDark = false, withText = true }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: size * 1.1,
      }}
    >
      {/* === 로고 이미지 === */}
      <Box
        sx={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      >
        <img
          src="/rogo.png"
          alt="침킬 로고"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>

      {/* === 텍스트 오른쪽 배치 === */}
      {withText && (
        <Box sx={{ textAlign: 'left' }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: size * 0.6,
              lineHeight: 1,
              background: 'linear-gradient(to bottom, #166534, #0d9488, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            침킬
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: size * 0.4,
              color: isDark ? '#cbd5e1' : '#64748b',
              fontWeight: 500,
              mt: 0.5,
            }}
          >
            스마트 방재 시스템
          </Typography>
        </Box>
      )}
    </Box>
  );
}
