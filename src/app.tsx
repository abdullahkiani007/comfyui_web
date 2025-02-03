import React from 'react';

import { Helmet } from 'react-helmet-async';

import { AppRoutes } from './routes';

const App = () => {
  return (
    <>
      <Helmet>
        <title>NxtofTemplate</title>
        <meta
          name='description'
          content='Boilerplate template designed to quickly bootstrap a React.js Web App, SPA, website or landing page with TypeScript, Shadcn/ui, TailwindCSS, Vite, SWC, ESLint, Husky and much more in just 30 seconds.'
        />
        <meta name='keywords' content='template , react , shadcn , husky , react router' />
      </Helmet>
      <AppRoutes />
    </>
  );
};

export default App;
