export const PATHS = {
  HOME: '/',
  UPSCALE: '/upscale',
  ULTRA_REALISM: '/ultra-realism'
};

export const NavLinks = [
  {
    name: 'Home',
    href: PATHS.HOME
  },
  {
    name: 'Upscaler',
    href: PATHS.UPSCALE
  },
  {
    name: 'Ultra Realism',
    href: PATHS.ULTRA_REALISM
  }
];

export enum jobTypes {
  'upscaler',
  'ultra_realism'
}
