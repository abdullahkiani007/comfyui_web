import React from 'react';

import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ComfyUIGenerator } from './home/ComfyUIGenerator';
import { PATHS } from '@/constants/constants';

import RootLayout from './root-layout';

export const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path={PATHS.HOME} element={<ComfyUIGenerator/>} />
        </Route>

        <Route path='*' element={<h1>Not Found</h1>} />
      </Routes>
    </Router>
  );
};
