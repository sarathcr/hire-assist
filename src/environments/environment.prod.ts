const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

export const environment = {
  // Production is true only for the main production domain
  isProduction:
    hostname.includes('hire-assist.vercel.app') &&
    !hostname.includes('prehire-assist'),

  baseUrl: 'https://localhost:7238',

  // Dynamic URL Selection
  authorizationUrl: hostname.includes('prehire-assist')
    ? 'https://prehireassistsecurity.runasp.net'
    : hostname.includes('hire-assist.vercel.app')
      ? 'https://hireassistsecurity.runasp.net'
      : 'https://devhireassistsecurity.runasp.net',

  assessmentUrl: hostname.includes('prehire-assist')
    ? 'https://prehireassistassessment.runasp.net'
    : hostname.includes('hire-assist.vercel.app')
      ? 'https://hireassistassessment.runasp.net'
      : 'https://devhireassistassessment.runasp.net',

  collectionUrl: hostname.includes('prehire-assist')
    ? 'https://prehireassistcollection.runasp.net'
    : hostname.includes('hire-assist.vercel.app')
      ? 'https://hireassistcollection.runasp.net'
      : 'https://devhireassistcollection.runasp.net',

  intreviewUrl: hostname.includes('prehire-assist')
    ? 'https://prehireassistinterview.runasp.net'
    : hostname.includes('hire-assist.vercel.app')
      ? 'https://hireassistinterview.runasp.net'
      : 'https://devhireassistinterview.runasp.net',
};
