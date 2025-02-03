import React from 'react';

import { Outlet } from 'react-router-dom';

// import { Toaster } from './components/ui/toaster';

const RootLayout = () => {
  return (
    <div>
      <header className='relative'></header>
      <main>
        <Outlet />
      </main>
      {/* <Toaster /> */}
    </div>
  );
};

export default RootLayout;
