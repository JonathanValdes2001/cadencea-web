const PROTECTED_ROUTE_PREFIXES = Object.freeze([
  '/account/settings',
  '/account/subscription',
  '/account/cloud-storage',
  '/billing/success',
]);

export function isProtectedRoute(pathname) {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function loginRedirectPath(pathname, search = '') {
  return `/login?redirect=${encodeURIComponent(`${pathname}${search}`)}`;
}

export function safePostLoginPath(candidate) {
  if (
    typeof candidate !== 'string' ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return '/';
  }
  return candidate;
}
