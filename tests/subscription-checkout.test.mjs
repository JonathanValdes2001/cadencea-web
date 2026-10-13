import assert from 'node:assert/strict';
import { test } from 'node:test';
import { subscriptionCheckout } from '../lib/subscription-checkout.mjs';

function client(subscription, checkoutError) {
  const calls = [];
  return {
    calls,
    get: async () => subscription,
    post: async (path, body) => {
      calls.push({ path, body });
      if (path.includes('checkout') && checkoutError) throw checkoutError;
      return { url: path };
    },
  };
}

for (const status of ['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete', 'active quota_over']) {
  test(`existing ${status} subscriber manages their subscription`, async () => {
    const api = client({ plan: 'basic', status });
    await subscriptionCheckout(api, 'price_pro');
    assert.deepEqual(api.calls, [{ path: '/billing/create-portal-session', body: undefined }]);
  });
}

test('free user can buy the selected plan', async () => {
  const api = client({ plan: 'free', status: 'active' });
  await subscriptionCheckout(api, 'price_basic');
  assert.deepEqual(api.calls, [{ path: '/billing/create-checkout-session', body: { price_id: 'price_basic' } }]);
});

test('stale local status obeys Stripe conflict and opens portal once', async () => {
  const api = client({ plan: 'free', status: 'active' }, { status: 409 });
  await subscriptionCheckout(api, 'price_pro');
  assert.deepEqual(api.calls.map(c => c.path), ['/billing/create-checkout-session', '/billing/create-portal-session']);
});

test('subscription lookup failure never attempts purchase', async () => {
  const api = client(null);
  api.get = async () => { throw new Error('offline'); };
  await assert.rejects(subscriptionCheckout(api, 'price_basic'), /offline/);
  assert.deepEqual(api.calls, []);
});

test('malformed subscription data never attempts purchase', async () => {
  const api = client({});
  await assert.rejects(subscriptionCheckout(api, 'price_basic'), /verify your subscription/);
  assert.deepEqual(api.calls, []);
});

test('busy checkout and payment errors never retry or open portal', async () => {
  for (const status of [400, 429, 503]) {
    const api = client({ plan: 'free', status: 'active' }, { status });
    await assert.rejects(subscriptionCheckout(api, 'price_basic'));
    assert.equal(api.calls.length, 1);
  }
});

test('portal failure never falls back to a new purchase', async () => {
  const api = client({ plan: 'basic', status: 'active' });
  api.post = async path => { api.calls.push(path); throw new Error('portal unavailable'); };
  await assert.rejects(subscriptionCheckout(api, 'price_basic'), /portal unavailable/);
  assert.deepEqual(api.calls, ['/billing/create-portal-session']);
});
