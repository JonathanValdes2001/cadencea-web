'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  api,
  ApiError,
  type BillingPlansResponse,
  type CheckoutSessionResponse,
} from '@/lib/api-client';

type Plan = {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyDiscount: string;
  storage: string;
  features: string[];
  cta: string;
  popular: boolean;
};

const plans: Plan[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: '',
    storage: '5 GB cloud storage',
    features: ['Cloud sync', 'Basic support'],
    cta: 'Start free',
    popular: false,
  },
  {
    name: 'Basic',
    monthlyPrice: 4.99,
    yearlyPrice: 49.99,
    yearlyDiscount: 'Save €9.89',
    storage: '50 GB cloud storage',
    features: ['Cloud sync', 'Basic support'],
    cta: 'Choose plan',
    popular: false,
  },
  {
    name: 'Standard',
    monthlyPrice: 14.99,
    yearlyPrice: 149.99,
    yearlyDiscount: 'Save €29.89',
    storage: '250 GB cloud storage',
    features: ['Cloud sync', 'Priority support'],
    cta: 'Choose plan',
    popular: true,
  },
  {
    name: 'Pro',
    monthlyPrice: 24.99,
    yearlyPrice: 249.99,
    yearlyDiscount: 'Save €49.89',
    storage: '500 GB cloud storage',
    features: ['Cloud sync', 'Priority support'],
    cta: 'Choose plan',
    popular: false,
  },
];

const includedFeatures = [
  {
    title: 'Secure & private',
    desc: 'End-to-end encryption for all your music projects and data.',
  },
  {
    title: 'Easy migration',
    desc: 'Seamlessly import projects from any DAW or existing setup.',
  },
  {
    title: 'Human support',
    desc: 'Help when you need it from a music-savvy support team.',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [backendPlans, setBackendPlans] =
    useState<BillingPlansResponse | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<BillingPlansResponse>('/billing/plans')
      .then((res) => {
        if (!cancelled) setBackendPlans(res);
      })
      .catch((err) => {
        console.error('[pricing] Failed to load billing plans:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    setError(null);

    if (plan.monthlyPrice === 0) {
      router.push(user ? '/account/subscription' : '/signup');
      return;
    }

    if (authLoading) return;

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    if (!backendPlans?.stripe_configured) {
      setError('Subscriptions are temporarily unavailable. Please try again soon.');
      return;
    }

    const backendPlan = backendPlans.plans.find(
      (p) => p.id.toLowerCase() === plan.name.toLowerCase()
    );
    const priceId = isYearly
      ? backendPlan?.stripe_price_annual
      : backendPlan?.stripe_price_monthly;

    if (!backendPlan || !priceId) {
      setError('This plan is not available right now. Please contact support.');
      return;
    }

    try {
      setLoadingPlan(plan.name);
      const res = await api.post<CheckoutSessionResponse>(
        '/billing/create-checkout-session',
        { price_id: priceId }
      );
      window.location.href = res.url;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Something went wrong starting checkout. Please try again.';
      setError(message);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="bg-canvas text-ink">
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20 text-center lg:px-8 lg:pb-20 lg:pt-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Pricing
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-5xl font-bold tracking-tight md:text-6xl">
            Choose your plan.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Unlock the full potential of Cadencea Vault with flexible pricing
            designed for every artist — from bedroom producers to professional
            studios.
          </p>

          {/* Monthly / Yearly toggle */}
          <div
            className="mx-auto mt-10 inline-flex items-center rounded-sm border border-line bg-canvas p-1"
            role="tablist"
            aria-label="Billing period"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isYearly}
              onClick={() => setIsYearly(false)}
              className={`h-9 rounded-sm px-5 text-sm font-semibold tracking-wide ${
                !isYearly
                  ? 'bg-ink text-canvas'
                  : 'text-ink hover:bg-elevated'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isYearly}
              onClick={() => setIsYearly(true)}
              className={`h-9 rounded-sm px-5 text-sm font-semibold tracking-wide ${
                isYearly ? 'bg-ink text-canvas' : 'text-ink hover:bg-elevated'
              }`}
            >
              Yearly
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-widest text-price">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const isFree = plan.monthlyPrice === 0;
              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-md border bg-canvas p-8 ${
                    plan.popular
                      ? 'border-ink shadow-card-hover'
                      : 'border-line'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-6 inline-flex items-center rounded-sm bg-accent px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
                      Most popular
                    </span>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-ink">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-widest text-ink-subtle">
                      {plan.storage}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight text-ink">
                        €{price.toFixed(2).replace(/\.00$/, '')}
                      </span>
                      {!isFree && (
                        <span className="text-sm text-ink-muted">
                          / {isYearly ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    {isYearly && plan.yearlyDiscount && (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-price">
                        {plan.yearlyDiscount}
                      </p>
                    )}
                  </div>

                  <ul className="mt-8 flex flex-col gap-3 text-sm text-ink">
                    <li className="flex items-start gap-2">
                      <Check />
                      <span>{plan.storage}</span>
                    </li>
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan)}
                    disabled={loadingPlan !== null && loadingPlan !== plan.name}
                    aria-busy={loadingPlan === plan.name}
                    className={`mt-10 inline-flex h-11 items-center justify-center rounded-sm text-sm font-semibold tracking-wide disabled:cursor-not-allowed disabled:opacity-60 ${
                      plan.popular
                        ? 'bg-accent text-white hover:bg-accent-hover'
                        : 'border border-ink text-ink hover:bg-elevated'
                    }`}
                  >
                    {loadingPlan === plan.name ? 'Redirecting…' : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
          {error && (
            <p
              role="alert"
              className="mx-auto mt-8 max-w-xl text-center text-sm text-red-600"
            >
              {error}
            </p>
          )}
        </div>
      </section>

      {/* Included features */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
              Included in every plan
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              The fundamentals never cost extra.
            </h2>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
            {includedFeatures.map((f) => (
              <div key={f.title} className="border-t border-line pt-6">
                <h3 className="text-lg font-semibold text-ink">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-16 max-w-2xl text-sm text-ink-muted">
            Questions about pricing?{' '}
            <a href="/contact" className="font-medium text-accent hover:text-accent-hover">
              Contact our sales team
            </a>{' '}
            for enterprise solutions.
          </p>
        </div>
      </section>
    </div>
  );
}

function Check() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
