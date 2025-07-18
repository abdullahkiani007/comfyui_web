import React from 'react';

import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { PATHS } from '@/constants/constants';

import { Upscaler } from './home/ComfyUIGenerator';
import { Home } from './home/home';
import { UltraRealismGenerator } from './home/Ultra_real_workflow';
import RootLayout from './root-layout';

export const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path={PATHS.HOME} element={<Home />} />
          <Route path={PATHS.UPSCALE} element={<Upscaler />} />
          <Route path={PATHS.ULTRA_REALISM} element={<UltraRealismGenerator />} />
        </Route>

        <Route path='*' element={<h1>Not Found</h1>} />
      </Routes>
    </Router>
  );
};
