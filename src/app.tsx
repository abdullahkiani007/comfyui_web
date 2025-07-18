import React from 'react';

import { Helmet } from 'react-helmet-async';

import { AppRoutes } from './routes';

const App = () => {
  return (
    <>
      <Helmet>
        <title>CodeAcme test workflow</title>
        <meta
          name='description'
          content='test codeacme workflow'
        />
        <meta name='keywords' content='template , react , shadcn , husky , react router' />
      </Helmet>
      <AppRoutes />
    </>
  );
};

export default App;
