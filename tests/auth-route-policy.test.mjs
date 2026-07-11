import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isProtectedRoute,
  loginRedirectPath,
  safePostLoginPath,
} from '../lib/auth-route-policy.mjs';

test('protects account data and post-checkout pages server-side', () => {
  for (const path of [
    '/account/settings',
    '/account/settings/security',
    '/account/subscription',
    '/account/cloud-storage',
    '/billing/success',
  ]) {
    assert.equal(isProtectedRoute(path), true, path);
  }
});

test('keeps token links and public commerce pages reachable', () => {
  for (const path of [
    '/account/confirm-deletion',
    '/billing/cancel',
    '/pricing',
    '/login',
    '/signup',
  ]) {
    assert.equal(isProtectedRoute(path), false, path);
  }
});

test('preserves the intended protected destination through login', () => {
  assert.equal(
    loginRedirectPath('/account/settings', '?tab=security'),
    '/login?redirect=%2Faccount%2Fsettings%3Ftab%3Dsecurity',
  );
});

test('accepts only same-origin post-login destinations', () => {
  assert.equal(safePostLoginPath('/account/settings?tab=security'), '/account/settings?tab=security');
  assert.equal(safePostLoginPath('https://attacker.example'), '/');
  assert.equal(safePostLoginPath('//attacker.example/path'), '/');
  assert.equal(safePostLoginPath('/\\attacker.example'), '/');
  assert.equal(safePostLoginPath(null), '/');
});
