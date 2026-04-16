import React from 'react';
import type { Metadata } from 'next';
import LegalLayout from '../../components/LegalLayout';

export const metadata: Metadata = {
  title: 'Cookie Notice — Cadencea',
  description:
    'How Cadencea uses cookies and similar tracking technologies on cadencea.app and in the desktop application.',
};

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie and Tracking Notice" effectiveDate="April 15, 2026">
      <h2>1. Introduction</h2>
      <p>
        This notice explains how Yuma Pellon Valdes (Org.nr. 930343870) uses
        cookies and similar tracking technologies on the Cadencea website
        (cadencea.app) and within the Cadencea Vault desktop application.
      </p>

      <h2>2. What Are Cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a
        website. They serve various functions such as remembering your login
        state and helping us understand how our services are used. Similar
        technologies include local storage and session tokens.
      </p>

      <h2>3. Cookies and Technologies We Use</h2>

      <h3>3.1 Strictly Necessary (Cannot Be Disabled)</h3>
      <p>
        These are essential for the Service to function and do not require
        your consent under GDPR:
      </p>
      <ul>
        <li>
          <strong>Supabase authentication cookies/tokens:</strong> Maintain
          your logged-in session across page loads and application restarts.
          These are set when you log in and expire when you log out or after
          a defined session period
        </li>
        <li>
          <strong>Stripe session cookies:</strong> Used during the checkout
          process to securely handle payment. These are set by Stripe and are
          subject to Stripe&rsquo;s own privacy policy
        </li>
        <li>
          <strong>Cloudflare security cookies:</strong> Used by our CDN
          provider for security purposes such as bot detection and DDoS
          protection
        </li>
      </ul>

      <h3>3.2 Functional / Performance</h3>
      <p>
        These help us maintain and improve the Service. They operate under
        our legitimate interest (GDPR Art. 6(1)(f)):
      </p>
      <ul>
        <li>
          <strong>Sentry error tracking:</strong> When an error or crash
          occurs in the application or on the website, Sentry collects
          technical information including error messages, stack traces,
          device type, operating system, browser version, and IP address.
          This data is used solely for identifying and fixing bugs. IP
          addresses are not stored beyond 90 days. Sentry does not track your
          browsing behavior or build user profiles
        </li>
      </ul>

      <h3>3.3 Cookies We Do NOT Use</h3>
      <p>We want to be transparent about what we do not do:</p>
      <ul>
        <li>We do not use advertising or retargeting cookies</li>
        <li>
          We do not use social media tracking pixels (Facebook Pixel, etc.)
        </li>
        <li>
          We do not use third-party analytics platforms (Google Analytics,
          etc.)
        </li>
        <li>We do not share cookie data with advertising networks</li>
        <li>We do not engage in cross-site tracking of any kind</li>
      </ul>

      <h2>4. Tracking in the Desktop Application</h2>
      <p>
        The Cadencea Vault desktop application uses Sentry for error and
        crash reporting, as described above. The application also stores
        authentication tokens locally on your device to maintain your login
        state. No other tracking technologies are used within the desktop
        application.
      </p>

      <h2>5. Managing Cookies</h2>
      <p>
        You can manage cookies through your browser settings. Please note
        that disabling strictly necessary cookies will prevent you from
        logging in and using the Service. Most browsers allow you to view and
        delete cookies, block all cookies, or block third-party cookies.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        Under GDPR, you have the right to object to processing based on
        legitimate interest (which covers our use of Sentry). To exercise
        this right, contact us at{' '}
        <a href="mailto:privacy@cadencea.app">privacy@cadencea.app</a>.
        Please note that disabling error tracking may impact our ability to
        identify and fix issues affecting your experience.
      </p>

      <h2>7. Changes to This Notice</h2>
      <p>
        We may update this notice if we add or remove tracking technologies.
        Changes will be posted on our website. If we introduce any new
        categories of tracking (e.g., analytics), we will update this notice
        and obtain consent where required.
      </p>

      <h2>8. Contact</h2>
      <p>For questions about our use of cookies and tracking:</p>
      <ul>
        <li>
          <strong>Company:</strong> Yuma Pellon Valdes (Org.nr. 930343870)
        </li>
        <li>
          <strong>Privacy inquiries:</strong>{' '}
          <a href="mailto:privacy@cadencea.app">privacy@cadencea.app</a>
        </li>
        <li>
          <strong>Website:</strong>{' '}
          <a href="https://cadencea.app">https://cadencea.app</a>
        </li>
      </ul>

      <p>
        © 2026 Yuma Pellon Valdes (Org.nr. 930343870). All rights reserved.
      </p>
    </LegalLayout>
  );
}
