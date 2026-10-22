'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

const STORAGE_KEY = 'cadencea.cookie-notice.dismissed';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== '1') {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // localStorage unavailable — banner will reappear next visit, acceptable
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    // Above toasts and bottom-pinned bars until dismissed (WEB-V2-SPEC §3.6); the skip link stays on top.
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-[65] border-t border-line bg-canvas shadow-dropdown"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">
          We use only essential cookies, for signing in and error tracking. See our{' '}
          <Link
            href="/cookies"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Cookie Notice
          </Link>
          .
        </p>
        <Button onClick={dismiss}>Got it</Button>
      </div>
    </div>
  );
}
