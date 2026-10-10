import type { Metadata } from 'next';

// The pricing page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'The Cadencea Vault app is free. Cloud storage from €4.99 a month for 50 GB. Prices in euros, including VAT.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
