import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AUTH_MESSAGES, looksLikeEmail, signInErrorMessage, signUpErrorMessage } from '../lib/auth-messages.mjs';

// WEB-V2-SPEC §5.7: the forms show plain messages; a rate limit or a dropped
// connection must not read "try again", which keeps the user locked out.

test('sign-in maps credentials, confirmation, rate limits and network failures', () => {
  assert.equal(signInErrorMessage({ message: 'Invalid login credentials', status: 400 }), AUTH_MESSAGES.invalidCredentials);
  assert.equal(signInErrorMessage({ message: 'Email not confirmed', status: 400 }), AUTH_MESSAGES.emailNotConfirmed);
  assert.equal(signInErrorMessage({ message: 'Request rate limit reached', status: 429 }), AUTH_MESSAGES.rateLimited);
  assert.equal(signInErrorMessage({ message: 'anything', status: 429 }), AUTH_MESSAGES.rateLimited);
  assert.equal(signInErrorMessage({ message: 'Failed to fetch', status: 0, name: 'AuthRetryableFetchError' }), AUTH_MESSAGES.network);
  assert.equal(signInErrorMessage(new TypeError('Failed to fetch')), AUTH_MESSAGES.network);
  assert.equal(signInErrorMessage({ message: 'Database error querying schema', status: 500 }), AUTH_MESSAGES.fallback);
  assert.equal(signInErrorMessage(null), AUTH_MESSAGES.fallback);
});

test('sign-up maps the common Supabase errors instead of showing them raw', () => {
  assert.equal(signUpErrorMessage({ message: 'User already registered', status: 422 }), AUTH_MESSAGES.alreadyRegistered);
  assert.equal(
    signUpErrorMessage({ message: 'Unable to validate email address: invalid format', status: 400 }),
    AUTH_MESSAGES.invalidEmail,
  );
  assert.equal(signUpErrorMessage({ message: 'Email rate limit exceeded', status: 429 }), AUTH_MESSAGES.rateLimited);
  assert.equal(
    signUpErrorMessage({ message: 'Password is known to be weak and easy to guess, please choose a different one.', status: 422 }),
    AUTH_MESSAGES.weakPassword,
  );
  assert.equal(signUpErrorMessage({ message: 'Something odd', status: 500 }), AUTH_MESSAGES.fallback);
});

test('the email check catches obvious typos and leaves the rest to Supabase', () => {
  for (const ok of ['you@example.com', ' maya.lind+demo@cadencea.app ', 'a@b.co']) assert.equal(looksLikeEmail(ok), true, ok);
  for (const bad of ['foo@', '@example.com', 'foo@bar', 'foo bar@example.com', '', null]) {
    assert.equal(looksLikeEmail(bad), false, String(bad));
  }
});
