'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

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
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas shadow-dropdown"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">
          We use essential cookies for login and error tracking. See our{' '}
          <Link
            href="/cookies"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Cookie Notice
          </Link>{' '}
          for details.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-sm bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          OK
        </button>
      </div>
    </div>
  );
}
