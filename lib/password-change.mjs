/** @typedef {import('@supabase/supabase-js').SupabaseClient['auth']} Auth */

/**
 * Verify the current password with a disposable, non-persistent client so the
 * browser's existing session (including its MFA assurance) is never replaced.
 * The password update itself uses the signed-in user's ordinary auth client.
 * @param {Auth} auth
 * @param {Auth} verifier
 * @param {{currentPassword: string, newPassword: string, confirmPassword: string, nonce?: string}} input
 * @returns {Promise<'updated' | 'code_required'>}
 */
export async function changeAccountPassword(auth, verifier, input) {
  if (!input.currentPassword) throw new Error('Enter your current password.');
  if (input.newPassword.length < 8) throw new Error('Use at least 8 characters for your new password.');
  if (input.newPassword !== input.confirmPassword) throw new Error('The new passwords do not match.');
  if (input.newPassword === input.currentPassword) throw new Error('Choose a different password from your current one.');

  const { data, error: userError } = await auth.getUser();
  if (userError || !data.user?.email) throw new Error('Sign in again before changing your password.');
  const user = data.user;
  try {
    const { data: verified, error } = await verifier.signInWithPassword({
      email: user.email,
      password: input.currentPassword,
    });
    if (error) throw new Error(passwordChangeError(error, true));
    if (verified.user?.id !== user.id) throw new Error('Sign in again before changing your password.');
  } finally {
    // Revoke only the disposable verification session, never other devices.
    // Cleanup failures must not hide the actual verification error.
    await verifier.signOut({ scope: 'local' }).catch(() => {});
  }

  const { data: current, error: currentError } = await auth.getUser();
  if (currentError || current.user?.id !== user.id) throw new Error('Your session changed. Sign in again before changing your password.');

  const { error } = await auth.updateUser({
    password: input.newPassword,
    current_password: input.currentPassword,
    ...(input.nonce?.trim() ? { nonce: input.nonce.trim() } : {}),
  });
  if (!error) return 'updated';
  if (!input.nonce?.trim() && ['reauthentication_needed', 'reauth_nonce_missing'].includes(error.code ?? '')) {
    const { error: codeError } = await auth.reauthenticate();
    if (codeError) throw new Error(passwordChangeError(codeError));
    return 'code_required';
  }
  throw new Error(passwordChangeError(error));
}

/** @param {unknown} error @param {boolean} [verifying] */
export function passwordChangeError(error, verifying = false) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
  if (code === 'invalid_credentials') return verifying ? 'Your current password is incorrect.' : 'Your password could not be verified. Try again.';
  if (code === 'same_password') return 'Choose a different password from your current one.';
  if (code === 'weak_password') return 'This password does not meet the account security requirements. Choose a longer, stronger password.';
  if (['reauthentication_not_valid', 'otp_expired', 'reauth_nonce_missing'].includes(String(code))) return 'The confirmation code is invalid or has expired. Try again or request a new code.';
  if (['over_request_rate_limit', 'over_email_send_rate_limit'].includes(String(code))) return 'Too many attempts. Wait a moment before trying again.';
  if (['session_not_found', 'session_expired', 'bad_jwt', 'refresh_token_not_found'].includes(String(code))) return 'Your session has expired. Sign in again before changing your password.';
  if (code === 'insufficient_aal') return 'Complete two-factor verification before changing your password.';
  return 'Could not change your password. Check your connection and try again.';
}
