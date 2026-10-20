const PROTECTED_ROUTE_PREFIXES = Object.freeze([
  '/account/settings',
  '/account/subscription',
  '/account/cloud-storage',
  '/billing/success',
]);

// Pages protected on their own, without their sub-routes: the /account
// overview is private, but /account/confirm-deletion must stay reachable from
// the emailed link.
const PROTECTED_EXACT_ROUTES = Object.freeze(['/account']);

export function isProtectedRoute(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return (
    PROTECTED_EXACT_ROUTES.includes(path) ||
    PROTECTED_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
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
