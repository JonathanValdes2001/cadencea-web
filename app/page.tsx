import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo */}
        <div className="mx-auto w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl flex items-center justify-center mb-8">
          <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Cadencea
          </span>
        </h1>
        
            <p className="text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Professional tools for music creators - from file organization and cloud backup to VST license management.
            </p>
        
        {/* Main CTA */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link 
            href="/download" 
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-12 py-4 rounded-xl text-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-2xl"
          >
            Download Now
          </Link>
          <Link 
            href="/software/effects" 
            className="border border-slate-600 text-white px-12 py-4 rounded-xl text-xl font-medium hover:bg-slate-800 transition-all"
          >
            Browse Effects
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-gray-400">
          <Link href="/account/vault-dashboard" className="hover:text-white transition-colors">
            Vault Dashboard
          </Link>
          <Link href="/access" className="hover:text-white transition-colors">
            Cadencea Access
          </Link>
          <Link href="/account/subscription" className="hover:text-white transition-colors">
            Subscription
          </Link>
          <Link href="/cart" className="hover:text-white transition-colors">
            Cart
          </Link>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(120,119,198,0.05)_50%,transparent_100%)]"></div>
        </div>
      </div>
    </div>
  );
}
