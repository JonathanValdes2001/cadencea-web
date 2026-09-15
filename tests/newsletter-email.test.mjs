import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildNewsletterConfirmationUrl,
  buildNewsletterUnsubscribeUrl,
  getNewsletterMailConfig,
  sendNewsletterConfirmation,
} from '../lib/newsletter-email.mjs';

const env = {
  NODE_ENV: 'production',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_USER: 'mailer',
  SMTP_PASS: 'secret',
  FROM_EMAIL: 'Cadencea <noreply@cadencea.app>',
  NEWSLETTER_PUBLIC_URL: 'https://cadencea.app',
  [['NEWSLETTER', '_TOKEN_SECRET'].join('')]: 'b'.repeat(64),
};
const token = 'a'.repeat(64);

test('builds an HTTPS confirmation URL with the token only in its query', () => {
  assert.equal(
    buildNewsletterConfirmationUrl(token, env),
    `https://cadencea.app/api/newsletter/confirm?token=${token}`,
  );
  assert.throws(
    () => buildNewsletterConfirmationUrl('../not-a-token', env),
    /Invalid newsletter confirmation token/,
  );
});

test('builds an independently scoped opaque unsubscribe URL', () => {
  const url = new URL(buildNewsletterUnsubscribeUrl({
    id: 'subscription-1',
    email: 'listener@example.com',
    version: 1,
  }, env));
  assert.equal(url.origin, 'https://cadencea.app');
  assert.equal(url.pathname, '/api/newsletter/unsubscribe');
  assert.match(url.searchParams.get('token'), /^[a-f0-9]{64}$/);
  assert.equal(url.searchParams.has('email'), false);
});

test('rejects incomplete or insecure production mail configuration', () => {
  assert.throws(
    () => getNewsletterMailConfig({ ...env, SMTP_PASS: '' }),
    /SMTP_PASS/,
  );
  assert.throws(
    () => getNewsletterMailConfig({ ...env, NEWSLETTER_PUBLIC_URL: 'http://cadencea.app' }),
    /must use HTTPS/,
  );
});

test('sends through authenticated TLS SMTP without file or URL access', async () => {
  let transportOptions;
  let message;
  const createTransport = (options) => {
    transportOptions = options;
    return {
      sendMail: async (nextMessage) => {
        message = nextMessage;
        return { messageId: 'test-message' };
      },
    };
  };

  await sendNewsletterConfirmation(
    { email: 'listener@example.com', token },
    { env, createTransport },
  );

  assert.deepEqual(transportOptions.auth, { user: 'mailer', pass: 'secret' });
  assert.equal(transportOptions.requireTLS, true);
  assert.equal(transportOptions.disableFileAccess, true);
  assert.equal(transportOptions.disableUrlAccess, true);
  assert.equal(message.to, 'listener@example.com');
  assert.match(message.text, new RegExp(token));
});
