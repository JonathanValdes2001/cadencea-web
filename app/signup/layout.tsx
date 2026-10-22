import type { Metadata } from 'next';

// The sign-up page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create a free Cadencea account for Cadencea Vault.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
