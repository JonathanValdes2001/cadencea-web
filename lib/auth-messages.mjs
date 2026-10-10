/**
 * What the sign-in and sign-up forms show for a Supabase auth error
 * (WEB-V2-SPEC §5.7). The raw message still goes to the console; these are
 * display strings only. A rate limit or a dropped connection gets its own
 * message, because "try again" is exactly the wrong advice for a rate limit.
 */

export const AUTH_MESSAGES = Object.freeze({
  invalidCredentials: "That email and password don't match. Check them and try again.",
  emailNotConfirmed: 'Confirm your email first. We sent you a link when you signed up.',
  rateLimited: 'Too many attempts. Wait a few minutes, then try again.',
  network: "We couldn't reach Cadencea. Check your connection and try again.",
  alreadyRegistered: 'An account with this email already exists. Sign in instead.',
  invalidEmail: 'Enter a valid email address.',
  weakPassword: 'Choose a stronger password: longer, and not a common one.',
  fallback: 'Something went wrong. Please try again.',
});

/** A deliberately loose check: something@something.tld, no spaces. Supabase does the real validation. */
export function looksLikeEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function describe(error) {
  if (!error) return { message: '', status: undefined, name: '' };
  if (typeof error === 'string') return { message: error, status: undefined, name: '' };
  return {
    message: typeof error.message === 'string' ? error.message : '',
    status: typeof error.status === 'number' ? error.status : undefined,
    name: typeof error.name === 'string' ? error.name : '',
  };
}

function isRateLimit({ message, status }) {
  return status === 429 || /rate limit|too many requests|for security purposes/i.test(message);
}

function isNetwork({ message, status, name }) {
  return (
    name === 'AuthRetryableFetchError' ||
    (status === 0 && name !== '') ||
    /failed to fetch|networkerror|network request failed|load failed/i.test(message)
  );
}

/** The sign-in form's message for a failed `signInWithPassword`. */
export function signInErrorMessage(error) {
  const e = describe(error);
  if (e.message === 'Invalid login credentials') return AUTH_MESSAGES.invalidCredentials;
  if (e.message === 'Email not confirmed') return AUTH_MESSAGES.emailNotConfirmed;
  if (isRateLimit(e)) return AUTH_MESSAGES.rateLimited;
  if (isNetwork(e)) return AUTH_MESSAGES.network;
  return AUTH_MESSAGES.fallback;
}

/** The sign-up form's message for a failed `signUp`. */
export function signUpErrorMessage(error) {
  const e = describe(error);
  if (isRateLimit(e)) return AUTH_MESSAGES.rateLimited;
  if (isNetwork(e)) return AUTH_MESSAGES.network;
  if (/already registered|already exists/i.test(e.message)) return AUTH_MESSAGES.alreadyRegistered;
  if (/invalid format|validate email|invalid email/i.test(e.message)) return AUTH_MESSAGES.invalidEmail;
  if (/password/i.test(e.message) && /weak|pwned|known|at least|characters/i.test(e.message)) {
    return AUTH_MESSAGES.weakPassword;
  }
  return AUTH_MESSAGES.fallback;
}
