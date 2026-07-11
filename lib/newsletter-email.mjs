import nodemailer from 'nodemailer';

function requiredEnv(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing newsletter mail configuration: ${name}`);
  return value;
}
export function getNewsletterMailConfig(env = process.env) {
  const host = requiredEnv(env, 'SMTP_HOST');
  const port = Number(env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid newsletter mail configuration: SMTP_PORT');
  }

  const publicUrl = new URL(
    requiredEnv(env, 'NEWSLETTER_PUBLIC_URL'),
  );
  const isLocalDevelopment = env.NODE_ENV !== 'production' &&
    ['localhost', '127.0.0.1'].includes(publicUrl.hostname);
  if (publicUrl.protocol !== 'https:' && !(isLocalDevelopment && publicUrl.protocol === 'http:')) {
    throw new Error('NEWSLETTER_PUBLIC_URL must use HTTPS outside local development');
  }

  return {
    host,
    port,
    secure: port === 465,
    user: requiredEnv(env, 'SMTP_USER'),
    pass: requiredEnv(env, 'SMTP_PASS'),
    from: requiredEnv(env, 'FROM_EMAIL'),
    publicUrl,
  };
}

export function buildNewsletterConfirmationUrl(token, env = process.env) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    throw new Error('Invalid newsletter confirmation token');
  }
  const { publicUrl } = getNewsletterMailConfig(env);
  const url = new URL('/api/newsletter/confirm', publicUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendNewsletterConfirmation(
  { email, token },
  { env = process.env, createTransport = nodemailer.createTransport } = {},
) {
  const config = getNewsletterMailConfig(env);
  const confirmationUrl = buildNewsletterConfirmationUrl(token, env);
  const transport = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: { user: config.user, pass: config.pass },
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  return transport.sendMail({
    from: config.from,
    to: email,
    subject: 'Confirm your Cadencea newsletter subscription',
    text: `Confirm your Cadencea newsletter subscription: ${confirmationUrl}`,
    html: [
      '<h1>Confirm your subscription</h1>',
      '<p>Thanks for subscribing to Cadencea updates.</p>',
      `<p><a href="${escapeHtml(confirmationUrl)}">Confirm newsletter subscription</a></p>`,
      '<p>If you did not request this, you can ignore this email.</p>',
    ].join(''),
  });
}
