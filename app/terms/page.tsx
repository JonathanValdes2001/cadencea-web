import React from 'react';
import type { Metadata } from 'next';
import LegalLayout from '../../components/LegalLayout';

export const metadata: Metadata = {
  title: 'Terms of Service | Cadencea',
  description:
    'Legally binding terms governing use of Cadencea Vault, the Cadencea website, and related services.',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" effectiveDate="April 15, 2026">
      <h2>1. Introduction and Acceptance</h2>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally
        binding agreement between you (&ldquo;User,&rdquo; &ldquo;you&rdquo;)
        and Yuma Pellon Valdes, sole proprietorship registered in Norway under
        Org.nr. 930343870 (&ldquo;Cadencea,&rdquo; &ldquo;we,&rdquo;
        &ldquo;us&rdquo;), governing your access to and use of the Cadencea
        Vault desktop application, the Cadencea website (cadencea.app), cloud
        services, and any related services (collectively, the
        &ldquo;Service&rdquo;).
      </p>
      <p>
        By creating an account, downloading the application, or otherwise using
        the Service, you acknowledge that you have read, understood, and agree
        to be bound by these Terms. If you do not agree, you must not use the
        Service.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 13 years of age to create an account and use the
        Service. If you are between 13 and 18 years of age, you represent that
        you have obtained consent from a parent or legal guardian to use the
        Service. We reserve the right to request verification of age or
        parental consent at any time.
      </p>

      <h2>3. Account Registration and Security</h2>
      <p>
        To access certain features, you must create an account by providing
        accurate, current, and complete information. You are solely
        responsible for maintaining the confidentiality of your account
        credentials and for all activities that occur under your account. You
        agree to notify us immediately at{' '}
        <a href="mailto:support@cadencea.app">support@cadencea.app</a> of any
        unauthorized use of your account.
      </p>
      <p>
        We reserve the right to suspend or terminate accounts that contain
        false information, are used in violation of these Terms, or remain
        inactive for an extended period.
      </p>

      <h2>4. Description of the Service</h2>
      <p>
        Cadencea Vault is a desktop application for music producers that
        provides local project file management, cloud storage and
        synchronization, and collaborative file sharing. The Service includes
        a free tier and paid subscription tiers with varying storage limits.
      </p>
      <p>
        The Service is currently in public beta. While we strive for stability
        and reliability, you acknowledge that some features may be incomplete,
        contain errors, or change without notice during this period.
      </p>

      <h2>5. Subscription Plans and Pricing</h2>
      <h3>5.1 Available Plans</h3>
      <p>The Service offers the following subscription tiers:</p>
      <ul>
        <li>
          <strong>Free:</strong> $0/month — 5 GB cloud storage
        </li>
        <li>
          <strong>Basic:</strong> $4.99/month or $49.90/year — 50 GB cloud
          storage
        </li>
        <li>
          <strong>Standard:</strong> $14.99/month or $149.90/year — 250 GB
          cloud storage
        </li>
        <li>
          <strong>Pro:</strong> $24.99/month or $249.90/year — 500 GB cloud
          storage
        </li>
      </ul>
      <p>
        All prices are in US Dollars (USD). Prices, storage limits, features,
        and tier structures are subject to change. We will notify you of any
        pricing changes at least 30 days before they take effect. Changes will
        apply at the start of your next billing cycle.
      </p>

      <h3>5.2 Billing and Payment</h3>
      <p>
        Paid subscriptions are billed in advance on a monthly or annual basis
        depending on the plan selected. Payment is processed securely through
        Stripe. We do not store your payment card details on our servers.
      </p>
      <p>
        Subscriptions automatically renew at the end of each billing period
        unless cancelled before the renewal date. You may cancel your
        subscription at any time through your account settings or by
        contacting{' '}
        <a href="mailto:support@cadencea.app">support@cadencea.app</a>.
      </p>

      <h3>5.3 Cancellation and Downgrade</h3>
      <p>
        Upon cancellation of a paid subscription, you retain access to paid
        features until the end of your current billing period. After that,
        your account reverts to the Free tier. If your stored data exceeds the
        Free tier limit (5 GB), you will not be able to upload new files until
        your usage is within the limit, but your existing files will not be
        deleted.
      </p>

      <h3>5.4 Right of Withdrawal (Angrerett)</h3>
      <p>
        Under the Norwegian Consumer Contracts Act (angrerettloven), you have
        a 14-day right of withdrawal for digital content purchases. By
        subscribing to a paid plan, you expressly request immediate access to
        the Service and acknowledge that you thereby waive your right of
        withdrawal once the Service has been made available to you. If you do
        not waive this right, access to paid features will be delayed until
        the withdrawal period has expired.
      </p>

      <h2>6. User Content and Intellectual Property</h2>
      <h3>6.1 Your Content</h3>
      <p>
        You retain full ownership of all files, audio projects, samples,
        recordings, and other content you upload, store, or share through the
        Service (&ldquo;User Content&rdquo;). Cadencea does not claim any
        ownership rights over your User Content.
      </p>
      <p>
        By using the cloud storage and sharing features, you grant Cadencea a
        limited, non-exclusive license to store, transmit, and process your
        User Content solely for the purpose of providing the Service to you.
        This license terminates when you delete your content or your account.
      </p>

      <h3>6.2 Our Intellectual Property</h3>
      <p>
        The Cadencea Vault application, website, branding, logos, design,
        source code, and documentation are the intellectual property of Yuma
        Pellon Valdes and are protected by Norwegian and international
        copyright law. You may not copy, modify, distribute, reverse-engineer,
        or create derivative works of the Service except as expressly
        permitted by these Terms or applicable law.
      </p>

      <h2>7. Acceptable Use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>
          Upload, store, or share content that infringes on the intellectual
          property rights of others
        </li>
        <li>Distribute malware, viruses, or other harmful software</li>
        <li>
          Attempt to gain unauthorized access to the Service, other accounts,
          or related systems
        </li>
        <li>
          Use the Service for any unlawful purpose under Norwegian or
          applicable law
        </li>
        <li>
          Circumvent, disable, or otherwise interfere with security features
          of the Service
        </li>
        <li>
          Share your account credentials with third parties or allow multiple
          individuals to use a single account
        </li>
        <li>
          Use automated tools to access the Service in a manner that places
          unreasonable load on the infrastructure
        </li>
      </ul>
      <p>
        We reserve the right to remove content and suspend or terminate
        accounts that violate these Terms, with or without notice.
      </p>

      <h2>8. Cloud Storage and Data</h2>
      <p>
        Your files are stored using third-party cloud infrastructure
        (Backblaze B2). While we implement reasonable security measures, we do
        not guarantee that files will never be lost, corrupted, or accessed by
        unauthorized parties. You are responsible for maintaining your own
        local backups of important files.
      </p>
      <p>
        If your account is terminated or you cancel your subscription, we will
        retain your cloud-stored files for a period of 30 days, after which
        they may be permanently deleted.
      </p>

      <h2>9. Sharing and Collaboration</h2>
      <p>
        The Service includes features for sharing projects with other users.
        When you share a project, a copy is made available to the recipient.
        You are solely responsible for ensuring you have the right to share
        any content you distribute through the Service. Revoking a share does
        not delete copies already made by the recipient.
      </p>

      <h2>10. Disclaimer of Warranties</h2>
      <p>
        <span className="legal-emphasis">
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; without warranties of any kind, either express or
          implied, including but not limited to warranties of merchantability,
          fitness for a particular purpose, and non-infringement. We do not
          warrant that the Service will be uninterrupted, error-free, or free
          of harmful components.
        </span>
      </p>
      <p>
        During the public beta period, you acknowledge that the Service may
        contain bugs, incomplete features, and other issues that could affect
        performance and reliability.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        <span className="legal-emphasis">
          To the maximum extent permitted by Norwegian law, Yuma Pellon Valdes
          shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages, including but not limited to
          loss of data, loss of revenue, or loss of business opportunities,
          arising from your use of the Service.
        </span>
      </p>
      <p>
        Our total aggregate liability for any claims arising from or related
        to the Service shall not exceed the amount you paid to us in the 12
        months preceding the claim.
      </p>

      <h2>12. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. We will notify
        you of material changes by email or through the Service at least 30
        days before the changes take effect. Your continued use of the
        Service after such changes constitutes acceptance of the updated
        Terms. If you do not agree with the changes, you must stop using the
        Service and cancel your account.
      </p>

      <h2>13. Termination</h2>
      <p>
        You may terminate your account at any time by contacting{' '}
        <a href="mailto:support@cadencea.app">support@cadencea.app</a> or
        through your account settings. We may terminate or suspend your access
        to the Service at any time for violation of these Terms, with
        reasonable notice where possible.
      </p>

      <h2>14. Governing Law and Disputes</h2>
      <p>
        These Terms are governed by the laws of Norway. Any disputes arising
        from these Terms or the Service shall be resolved by the competent
        courts of Oslo, Norway. For consumers residing in the EU/EEA, this
        does not affect your right to bring proceedings in your country of
        residence as provided by mandatory consumer protection laws.
      </p>

      <h2>15. Contact</h2>
      <p>If you have questions about these Terms, please contact us at:</p>
      <ul>
        <li>
          <strong>Company:</strong> Yuma Pellon Valdes
        </li>
        <li>
          <strong>Org.nr.:</strong> 930343870
        </li>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:support@cadencea.app">support@cadencea.app</a>
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
