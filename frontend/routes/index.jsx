import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import IndexPage from '../pages/IndexPage';
import LoginPage from '../pages/LoginPage';
import FloodDashboard from '../pages/FloodDashboard';
import NotFoundPage from '../pages/NotFoundPage';
import { ROUTES } from './constants';

const AppRoutes = ({ isDark, setIsDark }) => {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<IndexPage isDark={isDark} setIsDark={setIsDark} />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage isDark={isDark} setIsDark={setIsDark} />} />
      <Route path={ROUTES.DASHBOARD} element={<FloodDashboard isDark={isDark} setIsDark={setIsDark} />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage isDark={isDark} setIsDark={setIsDark} />} />
      <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
    </Routes>
  );
};

export default AppRoutes; 