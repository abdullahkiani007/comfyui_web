import './styles/global.css';

import React from 'react';

import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';

import App from './app';
import { ToastProvider } from './components/ui/toast';

const container = document.querySelector('#root');
const root = createRoot(container as HTMLElement);

root.render(
  <HelmetProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </HelmetProvider>
);
