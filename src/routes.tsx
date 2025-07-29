import React from 'react';

import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { PATHS } from '@/constants/constants';

import { Upscaler } from './home/ComfyUIGenerator';
import { Hidream } from './home/Hidream';
import { Home } from './home/home';
import { Multitalk } from './home/MultiTalk';
import { UltraRealismGenerator } from './home/Ultra_real_workflow';
import { Wan22 } from './home/Wan22';
import RootLayout from './root-layout';

export const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path={PATHS.HOME} element={<Home />} />
          <Route path={PATHS.UPSCALE} element={<Upscaler />} />
          <Route path={PATHS.ULTRA_REALISM} element={<UltraRealismGenerator />} />
          <Route path='/multi-talk' element={<Multitalk />} />
          <Route path='/hidream' element={<Hidream />} />
          {/* Add more routes as needed */}
          <Route path='/wan22' element={<Wan22 />} />
        </Route>

        <Route path='*' element={<h1>Not Found</h1>} />
      </Routes>
    </Router>
  );
};
