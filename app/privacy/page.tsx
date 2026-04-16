import React from 'react';
import type { Metadata } from 'next';
import LegalLayout from '../../components/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy — Cadencea',
  description:
    'How Cadencea collects, uses, and protects your personal data under the GDPR.',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate="April 15, 2026">
      <h2>1. Data Controller</h2>
      <p>
        Yuma Pellon Valdes, sole proprietorship registered in Norway (Org.nr.
        930343870), is the data controller for personal data processed through
        the Cadencea Vault application, the Cadencea website (cadencea.app),
        and related cloud services (collectively, the &ldquo;Service&rdquo;).
      </p>
      <ul>
        <li>
          <strong>Contact email:</strong>{' '}
          <a href="mailto:privacy@cadencea.app">privacy@cadencea.app</a>
        </li>
        <li>
          <strong>Website:</strong>{' '}
          <a href="https://cadencea.app">https://cadencea.app</a>
        </li>
      </ul>

      <h2>2. What Personal Data We Collect</h2>
      <h3>2.1 Data You Provide</h3>
      <ul>
        <li>
          <strong>Account information:</strong> Email address, display name,
          and password (hashed) when you create an account
        </li>
        <li>
          <strong>Profile information:</strong> Any optional profile details
          you choose to add
        </li>
        <li>
          <strong>Support correspondence:</strong> Emails and messages you
          send to our support channels
        </li>
      </ul>

      <h3>2.2 Data Collected Automatically</h3>
      <ul>
        <li>
          <strong>Usage data:</strong> Features used, session duration, and
          general interaction patterns with the application
        </li>
        <li>
          <strong>Error and crash reports:</strong> Technical information
          about application errors, collected via Sentry, including device
          type, operating system, and application version
        </li>
        <li>
          <strong>Authentication tokens:</strong> Session tokens for
          maintaining your login state, managed by Supabase
        </li>
        <li>
          <strong>IP address:</strong> Logged temporarily during
          authentication and API requests
        </li>
      </ul>

      <h3>2.3 Data We Do Not Collect</h3>
      <ul>
        <li>
          We do not access, analyze, or listen to the contents of your audio
          files or project data
        </li>
        <li>
          We do not store payment card details — all payment processing is
          handled securely by Stripe
        </li>
        <li>
          We do not use cookies for advertising or third-party tracking
        </li>
      </ul>

      <h2>3. Why We Process Your Data (Legal Basis)</h2>
      <p>
        Under the General Data Protection Regulation (GDPR), we process your
        personal data based on the following legal grounds:
      </p>
      <ul>
        <li>
          <strong>Contract fulfillment (Art. 6(1)(b)):</strong> Processing
          your account information, authentication, cloud storage, and
          synchronization is necessary to provide the Service you signed up
          for
        </li>
        <li>
          <strong>Legitimate interest (Art. 6(1)(f)):</strong> Error tracking
          via Sentry and basic usage analytics help us maintain, improve, and
          secure the Service. We have assessed that this interest does not
          override your fundamental rights
        </li>
        <li>
          <strong>Consent (Art. 6(1)(a)):</strong> Marketing communications
          are only sent with your explicit consent, which you can withdraw at
          any time
        </li>
        <li>
          <strong>Legal obligation (Art. 6(1)(c)):</strong> We may retain
          certain data to comply with Norwegian tax, accounting, or other
          legal requirements
        </li>
      </ul>

      <h2>4. How We Use Your Data</h2>
      <p>We use personal data to:</p>
      <ul>
        <li>
          Provide, operate, and maintain the Service, including
          authentication, cloud sync, and sharing
        </li>
        <li>
          Process subscription payments and manage billing through Stripe
        </li>
        <li>
          Send essential communications about your account, service changes,
          and security notices
        </li>
        <li>
          Send marketing communications about product updates and new
          features (with your consent)
        </li>
        <li>
          Monitor and fix errors, crashes, and performance issues via Sentry
        </li>
        <li>Enforce our Terms of Service and protect against misuse</li>
      </ul>

      <h2>5. Third-Party Processors (Data Sharing)</h2>
      <p>
        We share personal data only with the following third-party service
        providers (&ldquo;processors&rdquo;) who process data on our behalf:
      </p>
      <ul>
        <li>
          <strong>Supabase (USA):</strong> Authentication and database
          hosting. Processes account data, email, and authentication tokens
        </li>
        <li>
          <strong>Backblaze B2 (USA):</strong> Cloud file storage. Stores your
          uploaded project files under your unique user ID
        </li>
        <li>
          <strong>Stripe (USA):</strong> Payment processing. Handles all
          payment card data directly; we receive only confirmation of payment
          status and subscription details
        </li>
        <li>
          <strong>Railway (USA):</strong> Cloud API hosting. Our backend
          server runs on Railway infrastructure
        </li>
        <li>
          <strong>Sentry (USA):</strong> Error and crash reporting. Receives
          technical error data, device information, and IP addresses for
          debugging purposes
        </li>
        <li>
          <strong>Vercel (USA):</strong> Website hosting for cadencea.app
        </li>
        <li>
          <strong>Cloudflare (USA):</strong> DNS, content delivery network
          (CDN), and email routing services
        </li>
      </ul>
      <p>
        Several of our processors are based in the United States. Data
        transfers to the US are conducted in compliance with GDPR Chapter V,
        relying on the EU-U.S. Data Privacy Framework where available, or
        Standard Contractual Clauses (SCCs) approved by the European
        Commission.
      </p>
      <p>
        We do not sell, rent, or trade your personal data to third parties
        for their own purposes.
      </p>

      <h2>6. Data Retention</h2>
      <ul>
        <li>
          <strong>Account data:</strong> Retained for as long as your account
          is active. Upon account deletion, personal data is deleted within 30
          days, except where retention is required by law
        </li>
        <li>
          <strong>Cloud-stored files:</strong> Retained for 30 days after
          account deletion or subscription cancellation, then permanently
          deleted
        </li>
        <li>
          <strong>Error logs (Sentry):</strong> Automatically deleted after 90
          days
        </li>
        <li>
          <strong>Payment records:</strong> Retained as required by Norwegian
          bookkeeping law (bokføringsloven), typically 5 years
        </li>
        <li>
          <strong>Marketing consent records:</strong> Retained for as long as
          you are subscribed to marketing communications, plus a reasonable
          period for record-keeping
        </li>
      </ul>

      <h2>7. Your Rights Under GDPR</h2>
      <p>As a data subject, you have the following rights:</p>
      <ul>
        <li>
          <strong>Right of access (Art. 15):</strong> Request a copy of the
          personal data we hold about you
        </li>
        <li>
          <strong>Right to rectification (Art. 16):</strong> Request
          correction of inaccurate or incomplete data
        </li>
        <li>
          <strong>Right to erasure (Art. 17):</strong> Request deletion of
          your personal data (&ldquo;right to be forgotten&rdquo;)
        </li>
        <li>
          <strong>Right to data portability (Art. 20):</strong> Receive your
          data in a structured, machine-readable format
        </li>
        <li>
          <strong>Right to restrict processing (Art. 18):</strong> Request
          that we limit how we use your data
        </li>
        <li>
          <strong>Right to object (Art. 21):</strong> Object to processing
          based on legitimate interest
        </li>
        <li>
          <strong>Right to withdraw consent:</strong> Withdraw consent for
          marketing communications at any time
        </li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{' '}
        <a href="mailto:privacy@cadencea.app">privacy@cadencea.app</a>. We
        will respond within 30 days as required by GDPR.
      </p>
      <p>
        If you believe we have not handled your data correctly, you have the
        right to lodge a complaint with the Norwegian Data Protection
        Authority (Datatilsynet) at{' '}
        <a href="https://www.datatilsynet.no">www.datatilsynet.no</a>.
      </p>

      <h2>8. Cookies and Tracking Technologies</h2>
      <p>
        The Cadencea website uses the following cookies and similar
        technologies:
      </p>
      <ul>
        <li>
          <strong>Strictly necessary cookies:</strong> Authentication session
          cookies (Supabase) required for login functionality. These cannot be
          disabled as the Service cannot function without them
        </li>
        <li>
          <strong>Error tracking (Sentry):</strong> Collects technical data
          about application errors for debugging. This operates under our
          legitimate interest in maintaining a functional service
        </li>
      </ul>
      <p>
        We do not use advertising cookies, social media tracking pixels, or
        third-party analytics platforms.
      </p>

      <h2>9. Marketing Communications</h2>
      <p>
        We may send you marketing emails about product updates, new features,
        and promotional content only if you have given explicit consent. You
        can unsubscribe at any time by clicking the unsubscribe link in any
        marketing email or by contacting{' '}
        <a href="mailto:privacy@cadencea.app">privacy@cadencea.app</a>.
        Unsubscribing from marketing emails does not affect essential service
        communications (e.g., billing confirmations, security alerts).
      </p>

      <h2>10. Children&rsquo;s Privacy</h2>
      <p>
        The Service is not directed at children under the age of 13. We do
        not knowingly collect personal data from children under 13. If you
        become aware that a child under 13 has provided us with personal
        data, please contact us at{' '}
        <a href="mailto:privacy@cadencea.app">privacy@cadencea.app</a> and we
        will delete such data promptly.
      </p>

      <h2>11. Security</h2>
      <p>
        We implement reasonable technical and organizational measures to
        protect your personal data, including encrypted data transmission
        (HTTPS/TLS), secure password hashing, and access controls. However,
        no method of electronic storage or transmission is completely secure,
        and we cannot guarantee absolute security.
      </p>

      <h2>12. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify
        you of material changes by email or through the Service at least 30
        days before they take effect. The updated policy will be posted on
        our website with a revised effective date.
      </p>

      <h2>13. Contact</h2>
      <p>
        For any privacy-related questions, data requests, or concerns:
      </p>
      <ul>
        <li>
          <strong>Data Controller:</strong> Yuma Pellon Valdes (Org.nr.
          930343870)
        </li>
        <li>
          <strong>Privacy inquiries:</strong>{' '}
          <a href="mailto:privacy@cadencea.app">privacy@cadencea.app</a>
        </li>
        <li>
          <strong>General support:</strong>{' '}
          <a href="mailto:support@cadencea.app">support@cadencea.app</a>
        </li>
        <li>
          <strong>Supervisory authority:</strong> Datatilsynet (Norwegian Data
          Protection Authority),{' '}
          <a href="https://www.datatilsynet.no">www.datatilsynet.no</a>
        </li>
      </ul>

      <p>
        © 2026 Yuma Pellon Valdes (Org.nr. 930343870). All rights reserved.
      </p>
    </LegalLayout>
  );
}
