'use client';

import { useState } from 'react';

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Free',
      emoji: '🟢',
      monthlyPrice: 0,
      yearlyPrice: 0,
      yearlyDiscount: '',
      features: [
        '5 GB storage',
        '1 device',
        'Cloud sync',
        '1 project share',
        'Manual download only'
      ],
      cta: 'Start Free',
      popular: false,
      accent: 'from-green-500 to-emerald-600'
    },
    {
      name: 'Basic',
      emoji: '🔵',
      monthlyPrice: 4.99,
      yearlyPrice: 49.99,
      yearlyDiscount: 'Save $10',
      features: [
        '50 GB storage',
        '2 devices',
        'Cloud sync',
        'Share up to 3 projects',
        'Basic support'
      ],
      cta: 'Choose Plan',
      popular: false,
      accent: 'from-blue-500 to-cyan-600'
    },
    {
      name: 'Pro',
      emoji: '🟣',
      monthlyPrice: 12.99,
      yearlyPrice: 129.99,
      yearlyDiscount: 'Save $26',
      features: [
        '500 GB storage',
        'Unlimited devices',
        'Cloud sync',
        'Share up to 10 projects',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      popular: true,
      accent: 'from-purple-500 to-violet-600'
    },
    {
      name: 'Studio',
      emoji: '🔴',
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      yearlyDiscount: 'Save $60',
      features: [
        '2 TB storage',
        'Unlimited devices',
        'Unlimited project sharing',
        'Team invites',
        'Full cloud backup'
      ],
      cta: 'Choose Plan',
      popular: false,
      accent: 'from-red-500 to-pink-600'
    },
    {
      name: 'Ultra',
      emoji: '🟠',
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      yearlyDiscount: 'Save $100',
      features: [
        '5 TB storage',
        'Unlimited devices',
        'Studio features +',
        'Priority sync servers',
        'Live project preview in dashboard'
      ],
      cta: 'Choose Plan',
      popular: false,
      accent: 'from-orange-500 to-amber-600'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative px-6 py-20 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black"></div>
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Unlock the full potential of Cadencea Vault with flexible pricing designed for every artist, from bedroom producers to professional studios.
          </p>
        </div>
      </div>

      {/* Pricing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-full p-2 flex items-center space-x-1">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              !isYearly
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              isYearly
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
              Save up to 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'border-purple-500/50 bg-gradient-to-b from-purple-900/20 to-gray-900/40 ring-2 ring-purple-500/30'
                  : 'border-gray-700/50 bg-gradient-to-b from-gray-900/40 to-gray-900/20 hover:border-gray-600/50'
              } backdrop-blur-sm`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="text-3xl mb-2">{plan.emoji}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-400">
                      {plan.monthlyPrice === 0 ? '' : isYearly ? '/year' : '/month'}
                    </span>
                  </div>
                  {isYearly && plan.yearlyDiscount && (
                    <div className="text-sm text-green-400">{plan.yearlyDiscount}</div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm">
                      <svg
                        className="h-4 w-4 text-green-400 mr-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-purple-500/25'
                      : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ/Additional Info Section */}
      <div className="bg-gradient-to-b from-gray-900/50 to-black border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h3 className="text-2xl font-bold text-white mb-6">
            All plans include core Cadencea Vault features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-2">Secure & Private</h4>
              <p className="text-gray-400">End-to-end encryption for all your music projects and data.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-2">Easy Migration</h4>
              <p className="text-gray-400">Seamlessly import projects from any DAW or existing setup.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-2">24/7 Support</h4>
              <p className="text-gray-400">Get help when you need it from our music-savvy support team.</p>
            </div>
          </div>
          <div className="mt-10">
            <p className="text-gray-400 text-sm">
              Questions about pricing? <a href="/contact" className="text-purple-400 hover:text-purple-300">Contact our sales team</a> for enterprise solutions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 