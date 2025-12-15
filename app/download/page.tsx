'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Download() {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Free',
      emoji: '🟢',
      monthlyPrice: 0,
      yearlyPrice: 0,
      yearlyDiscount: '',
      features: [
        '2 GB storage',
        '1 device',
        'Cloud sync',
        'Basic support'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Basic',
      emoji: '🔵',
      monthlyPrice: 4.99,
      yearlyPrice: 49.99,
      yearlyDiscount: 'Save $10',
      features: [
        '50 GB storage',
        '1 device',
        'Cloud sync',
        'Basic support'
      ],
      cta: 'Choose Plan',
      popular: false
    },
    {
      name: 'Standard',
      emoji: '🟣',
      monthlyPrice: 14.99,
      yearlyPrice: 149.99,
      yearlyDiscount: 'Save $30',
      features: [
        '250 GB storage',
        '2 devices',
        'Cloud sync',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Pro',
      emoji: '⭐',
      monthlyPrice: 24.99,
      yearlyPrice: 249.99,
      yearlyDiscount: 'Save $50',
      features: [
        '500 GB storage',
        '3 devices',
        'Cloud sync',
        'Priority support'
      ],
      cta: 'Choose Plan',
      popular: false
    },
    {
      name: 'Studio',
      emoji: '🔴',
      monthlyPrice: 59.99,
      yearlyPrice: 599.99,
      yearlyDiscount: 'Save $120',
      features: [
        '2 TB storage',
        '5 devices',
        'Cloud sync',
        'Premium support'
      ],
      cta: 'Choose Plan',
      popular: false
    },
    {
      name: 'Ultra',
      emoji: '🟠',
      monthlyPrice: 129.99,
      yearlyPrice: 1299.99,
      yearlyDiscount: 'Save $260',
      features: [
        '5 TB storage',
        '20 devices',
        'Cloud sync',
        'Premium support'
      ],
      cta: 'Choose Plan',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl flex items-center justify-center mb-8">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Cadencea
              </span>{' '}
              <span className="text-white">Vault</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Professional file organization, sharing, and cloud backup solution for music creators. 
              Keep your samples, projects, and stems organized across all devices.
            </p>
            
            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-2xl flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Download for Mac
              </button>
              <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-2xl flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v18l-6-1.5V3l6 1.5zM11 6.75L9.5 6.5v5.25l1.5.25V6.75z"/>
                </svg>
                Download for Windows
              </button>
              <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-2xl flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 16.428c-.39.39-1.024.39-1.414 0L12 12.274l-4.154 4.154c-.39.39-1.024.39-1.414 0-.39-.39-.39-1.024 0-1.414L10.586 11 6.432 6.846c-.39-.39-.39-1.024 0-1.414.39-.39 1.024-.39 1.414 0L12 9.586l4.154-4.154c.39-.39 1.024-.39 1.414 0 .39.39.39 1.024 0 1.414L13.414 11l4.154 4.154c.39.39.39 1.024 0 1.414z"/>
                </svg>
                Download for Linux
              </button>
            </div>

          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(120,119,198,0.05)_50%,transparent_100%)]"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything you need to create
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Streamline your creative workflow with professional-grade tools designed for modern music production.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Project Management */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-purple-500 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Project Management</h3>
              <p className="text-gray-300">
                Organize your music projects with intuitive file management, version control, and collaborative workflows.
              </p>
            </div>

            {/* Cloud Backup */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-blue-500 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Secure Cloud Backup</h3>
              <p className="text-gray-300">
                Automatic, encrypted backups ensure your creative work is always safe and accessible from anywhere.
              </p>
            </div>

            {/* File Sharing */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-green-500 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">File Sharing</h3>
              <p className="text-gray-300">
                Share projects and collaborate with other artists seamlessly. Control access and permissions for each shared project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 border-t border-slate-800 bg-black text-white">
        {/* Hero Section */}
        <div className="relative px-6 py-20 lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black"></div>
          <div className="relative mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Choose Your Plan
            </h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
      </section>

      {/* System Requirements */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            System Requirements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">macOS</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>macOS 10.15 or later</li>
                <li>Intel or Apple Silicon</li>
                <li>4GB RAM minimum</li>
                <li>2GB free disk space</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Windows</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>Windows 10 or later</li>
                <li>64-bit processor</li>
                <li>4GB RAM minimum</li>
                <li>2GB free disk space</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Linux</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>Ubuntu 18.04 or later</li>
                <li>64-bit processor</li>
                <li>4GB RAM minimum</li>
                <li>2GB free disk space</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
