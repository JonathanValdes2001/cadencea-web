'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Faq from '@/components/ui/Faq';
import { useLazyModule } from '@/components/useLazyModule';
import { useShowV2 } from '@/components/v2/common/V2Flag';
import {
  api,
  ApiError,
  type BillingPlansResponse,
  type CheckoutSessionResponse,
  type SubscriptionStatusResponse,
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
    features: ['Project sharing', 'All your computers', 'Email support'],
    cta: 'Start free',
    popular: false,
  },
  {
    name: 'Basic',
    monthlyPrice: 4.99,
    yearlyPrice: 49.99,
    yearlyDiscount: 'Save €9.89',
    storage: '50 GB cloud storage',
    features: ['Everything in Free'],
    cta: 'Choose Basic',
    popular: false,
  },
  {
    name: 'Standard',
    monthlyPrice: 14.99,
    yearlyPrice: 149.99,
    yearlyDiscount: 'Save €29.89',
    storage: '250 GB cloud storage',
    features: ['Everything in Basic', 'Priority email support'],
    cta: 'Choose Standard',
    popular: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 24.99,
    yearlyPrice: 249.99,
    yearlyDiscount: 'Save €49.89',
    storage: '500 GB cloud storage',
    features: ['Everything in Standard', 'Priority email support'],
    cta: 'Choose Pro',
    popular: false,
  },
];

const includedFeatures = [
  {
    title: 'Lossless',
    desc: 'Files are stored byte for byte. No transcoding or normalizing, on any plan.',
  },
  {
    title: 'Private by default',
    desc: 'Encrypted in transit. Only you and the collaborators you invite can open your projects.',
  },
  {
    title: 'Bring your library',
    desc: 'Point Cadencea Vault at the folders you already have. Nothing is moved or converted.',
  },
  {
    title: 'Every computer, plus sharing',
    desc: 'Use the app on all your computers and share projects with roles.',
  },
  {
    title: 'Downgrade safely',
    desc: "Downgrading never deletes files. If you're over the new limit, uploads pause until you're back under it.",
  },
  {
    title: 'Real support',
    desc: 'Email support from the people who build Cadencea.',
  },
];

const pricingFaq = [
  {
    q: 'Do collaborators need a paid plan?',
    a: 'No. People you invite join with a free account.',
  },
  {
    q: 'What counts toward my storage?',
    a: 'The cloud copies of your projects. Your local folders never count.',
  },
  {
    q: 'Can I change plans later?',
    a: "Yes. Email support@cadencea.app and we'll switch your plan. Downgrading never deletes files.",
  },
  {
    q: 'Which currency do you charge in?',
    a: 'Euros.',
  },
];

const SWITCH_PLAN_HREF = 'mailto:support@cadencea.app?subject=Switch%20my%20Cadencea%20plan';

/**
 * The paid plan a signed-in user is still billed for, or null. Checkout always
 * starts a new subscription, so a subscriber who picked another plan here would
 * pay for both; until plans can be switched in place, support switches them.
 */
function activePaidPlan(status: SubscriptionStatusResponse): string | null {
  const plan = status.plan?.toLowerCase();
  if (!plan || plan === 'free') return null;
  return /^(canceled|incomplete_expired)/.test(status.status ?? '') ? null : plan;
}

export default function PricingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const showV2 = useShowV2();
  // Preview only (WEB-V2-SPEC §5.5): production doesn't announce the Market
  // yet, not even in its JavaScript, so its preview pieces are one chunk that
  // only the preview loads.
  const preview = useLazyModule(() => import('@/components/v2/credits/PricingPreview'), showV2);
  const [isYearly, setIsYearly] = useState(false);
  const [backendPlans, setBackendPlans] =
    useState<BillingPlansResponse | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paidPlan, setPaidPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPaidPlan(null);
      return;
    }
    let cancelled = false;
    api
      .get<SubscriptionStatusResponse>('/billing/subscription-status')
      .then((res) => {
        if (!cancelled) setPaidPlan(activePaidPlan(res));
      })
      .catch(() => {
        // Unknown status: the plan buttons behave as before.
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

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
            Free app. Pay only for cloud space.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Cadencea Vault and your local library are free. Choose how much
            lossless cloud storage you need, and cancel anytime.
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
                    {showV2 && preview && <preview.PlanCreditsLine plan={plan.name} check={<Check />} />}
                  </ul>

                  {paidPlan && !isFree ? (
                    plan.name.toLowerCase() === paidPlan ? (
                      <p className="mt-10 inline-flex h-11 items-center justify-center rounded-sm border border-line text-sm font-semibold tracking-wide text-ink-muted">
                        Current plan
                      </p>
                    ) : (
                      <a
                        href={SWITCH_PLAN_HREF}
                        className="mt-10 inline-flex h-11 items-center justify-center rounded-sm border border-ink text-sm font-semibold tracking-wide text-ink hover:bg-elevated"
                      >
                        Email us to switch
                      </a>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan)}
                      disabled={loadingPlan !== null && loadingPlan !== plan.name}
                      aria-busy={loadingPlan === plan.name}
                      className={`mt-10 inline-flex h-11 items-center justify-center rounded-sm text-sm font-semibold tracking-wide disabled:cursor-not-allowed disabled:opacity-60 ${
                        isFree
                          ? 'border border-ink text-ink hover:bg-elevated'
                          : 'bg-accent text-white hover:bg-accent-hover'
                      }`}
                    >
                      {loadingPlan === plan.name ? 'Redirecting…' : plan.cta}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {error && (
            <p
              role="alert"
              className="mx-auto mt-8 max-w-xl text-center text-sm text-danger"
            >
              {error}
            </p>
          )}
          {paidPlan && (
            <p className="mx-auto mt-8 max-w-xl text-center text-sm text-ink">
              To switch plans, email{' '}
              <a href={SWITCH_PLAN_HREF} className="font-medium text-accent-ink hover:text-accent-hover">
                support@cadencea.app
              </a>{' '}
              and we&rsquo;ll move your subscription over, so you&rsquo;re never billed twice.
            </p>
          )}
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-ink-muted">
            Prices in euros. Cancel anytime; your plan stays active until the
            end of the billing period.
          </p>
        </div>
      </section>

      {showV2 && preview && <preview.PricingCreditsSection />}

      {/* Included features */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-20 lg:py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
              Included in every plan
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              What every plan includes.
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
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20 lg:py-24 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Pricing questions.
          </h2>
          {showV2 && preview ? (
            <preview.PricingFaqWithMarket className="mt-10" items={pricingFaq} />
          ) : (
            <Faq className="mt-10" items={pricingFaq} />
          )}
          <p className="mt-16 text-sm text-ink-muted">
            Studio or team?{' '}
            <a href="/contact" className="font-medium text-accent hover:text-accent-hover">
              Get in touch
            </a>
            .
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
