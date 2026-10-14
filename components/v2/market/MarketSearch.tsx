'use client';

import React from 'react';
import Form from 'next/form';
import { Search } from '@/components/ui/Icons';

/** Compact search shared by the landing page and filtered category views. */
export default function MarketSearch({
  id,
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
}: {
  id: string;
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
}) {
  return (
    <Form action="/market" role="search" onSubmit={onSubmit}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
        <input
          id={id}
          name="q"
          type="search"
          value={value}
          onChange={onChange ? (event) => onChange(event.currentTarget.value) : undefined}
          placeholder={placeholder}
          className="h-10 w-full rounded-sm border border-white/20 bg-white/5 pl-10 pr-3 text-base text-dark-text placeholder:text-dark-muted focus:border-brand-400 md:text-sm"
        />
      </div>
    </Form>
  );
}
