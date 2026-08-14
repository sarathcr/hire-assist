const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

const gatewayUrl = hostname.includes('prehire-assist')
  ? 'https://prehireassistapi.runasp.net'
  : hostname.includes('hire-assist.vercel.app')
    ? 'https://hireassistapi.runasp.net'
    : 'https://devhireassistapi.runasp.net'; // Default fallback for localhost and dev

export const environment = {
  // Production is true only for the main production domain
  isProduction:
    hostname.includes('hire-assist.vercel.app') &&
    !hostname.includes('prehire-assist'),

  baseUrl: 'https://localhost:7238',

  authorizationUrl: gatewayUrl,
  assessmentUrl: gatewayUrl,
  collectionUrl: gatewayUrl,
  intreviewUrl: gatewayUrl,
};
