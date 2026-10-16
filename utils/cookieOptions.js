export const getFrontendCookieOptions = (overrides = {}) => {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  
  // In production (e.g. founder.cafeqr.in), share cookie with .cafeqr.in so Ghost login works seamlessly on app.cafeqr.in
  let domain = undefined;
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('cafeqr.in')) {
    domain = '.cafeqr.in';
  }

  return {
    expires: 7,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
    ...(domain ? { domain } : {}),
    ...overrides,
  };
};
