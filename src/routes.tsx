import React from 'react';

import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { PATHS } from '@/constants/constants';

import RootLayout from './root-layout';

export const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path={PATHS.HOME} element={<h1>Home</h1>} />
        </Route>

        <Route path='*' element={<h1>Not Found</h1>} />
      </Routes>
    </Router>
  );
};
