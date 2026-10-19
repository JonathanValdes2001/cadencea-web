import assert from 'node:assert/strict';
import { test } from 'node:test';
import { changeAccountPassword, passwordChangeError } from '../lib/password-change.mjs';

const input = {
  currentPassword: 'old-password-for-test',
  newPassword: 'new-password-for-test',
  confirmPassword: 'new-password-for-test',
};
const user = { id: 'user-one', email: 'test@example.com' };

function fixture({ verifyError = null, updateError = null, codeError = null, switchedUser = false } = {}) {
  const calls = [];
  let reads = 0;
  return {
    calls,
    auth: {
      async getUser() {
        reads++;
        return { data: { user: switchedUser && reads > 1 ? { ...user, id: 'user-two' } : user }, error: null };
      },
      async updateUser(attributes) { calls.push(['update', attributes]); return { error: updateError }; },
      async reauthenticate() { calls.push(['code']); return { error: codeError }; },
    },
    verifier: {
      async signInWithPassword(credentials) {
        calls.push(['verify', credentials]);
        return { data: { user: verifyError ? null : user }, error: verifyError };
      },
      async signOut(options) { calls.push(['cleanup', options]); return { error: null }; },
    },
  };
}

test('checks the old password before updating the signed-in account, without changing its session', async () => {
  const f = fixture();
  assert.equal(await changeAccountPassword(f.auth, f.verifier, input), 'updated');
  assert.deepEqual(f.calls, [
    ['verify', { email: user.email, password: input.currentPassword }],
    ['cleanup', { scope: 'local' }],
    ['update', { password: input.newPassword, current_password: input.currentPassword }],
  ]);
});

test('a wrong current password never updates the account or sends email', async () => {
  const f = fixture({ verifyError: { code: 'invalid_credentials' } });
  await assert.rejects(changeAccountPassword(f.auth, f.verifier, input), /current password is incorrect/);
  assert.deepEqual(f.calls.map(([name]) => name), ['verify', 'cleanup']);
});

test('invalid form values never contact auth', async () => {
  for (const values of [
    { ...input, currentPassword: '' },
    { ...input, newPassword: 'short', confirmPassword: 'short' },
    { ...input, confirmPassword: 'different' },
    { ...input, newPassword: input.currentPassword, confirmPassword: input.currentPassword },
  ]) {
    const f = fixture();
    await assert.rejects(changeAccountPassword(f.auth, f.verifier, values));
    assert.deepEqual(f.calls, []);
  }
});

test('requires a verified, signed-in identity and stops if another tab changes it', async () => {
  const f = fixture({ switchedUser: true });
  await assert.rejects(changeAccountPassword(f.auth, f.verifier, input), /session changed/);
  assert.equal(f.calls.some(([name]) => name === 'update'), false);
  const missing = fixture();
  missing.auth.getUser = async () => ({ data: { user: null }, error: null });
  await assert.rejects(changeAccountPassword(missing.auth, missing.verifier, input), /Sign in again/);
  assert.deepEqual(missing.calls, []);
});

test('does not change a different identity if current-password verification returns another user', async () => {
  const f = fixture();
  f.verifier.signInWithPassword = async () => ({ data: { user: { ...user, id: 'other-user' } }, error: null });
  await assert.rejects(changeAccountPassword(f.auth, f.verifier, input), /Sign in again/);
  assert.deepEqual(f.calls, [['cleanup', { scope: 'local' }]]);
});

test('supports secure password change by emailing a nonce only when required', async () => {
  for (const code of ['reauthentication_needed', 'reauth_nonce_missing']) {
    const f = fixture({ updateError: { code } });
    assert.equal(await changeAccountPassword(f.auth, f.verifier, input), 'code_required');
    assert.equal(f.calls.at(-1)[0], 'code');
  }
  const retry = fixture();
  assert.equal(await changeAccountPassword(retry.auth, retry.verifier, { ...input, nonce: ' 123456 ' }), 'updated');
  assert.equal(retry.calls.at(-1)[1].nonce, '123456');
});

test('bad confirmation codes and delivery errors stay errors instead of reporting success', async () => {
  const badCode = fixture({ updateError: { code: 'reauthentication_not_valid' } });
  await assert.rejects(changeAccountPassword(badCode.auth, badCode.verifier, { ...input, nonce: '123456' }), /invalid or has expired/);
  assert.equal(badCode.calls.some(([name]) => name === 'code'), false);
  const delivery = fixture({ updateError: { code: 'reauthentication_needed' }, codeError: { code: 'over_email_send_rate_limit' } });
  await assert.rejects(changeAccountPassword(delivery.auth, delivery.verifier, input), /Too many attempts/);
});

test('provider password policy, expired sessions and network failures have useful messages', async () => {
  assert.match(passwordChangeError({ code: 'weak_password' }), /security requirements/);
  assert.match(passwordChangeError({ code: 'session_expired' }), /Sign in again/);
  assert.match(passwordChangeError({ code: 'insufficient_aal' }), /two-factor/);
  const f = fixture({ updateError: { code: 'weak_password' } });
  await assert.rejects(changeAccountPassword(f.auth, f.verifier, input), /security requirements/);
  assert.match(passwordChangeError(new Error('sensitive internal detail')), /connection/);
});
