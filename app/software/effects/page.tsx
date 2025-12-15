import React from 'react';
import Link from 'next/link';

export default function Effects() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/software" className="text-gray-400 hover:text-white transition-colors">
                Software & Sounds
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-white font-medium">Effects</li>
          </ol>
        </nav>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Effects
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Professional audio effects and plugins for your music production workflow. From vintage emulations to cutting-edge processors.
          </p>
        </div>

        {/* Coming Soon Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Reverb & Delay Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center hover:border-purple-500/50 transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Reverbs & Delays</h3>
            <p className="text-gray-400 mb-6">
              Classic and modern reverb algorithms with pristine delays for spatial enhancement.
            </p>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Hall Reverbs</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Vintage Delays</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>Creative Spaces</span>
              </div>
            </div>
          </div>

          {/* EQ & Filters Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center hover:border-blue-500/50 transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">EQs & Filters</h3>
            <p className="text-gray-400 mb-6">
              Precision equalizers and creative filters for perfect frequency sculpting.
            </p>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Parametric EQs</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                <span>Vintage Filters</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Creative Filtering</span>
              </div>
            </div>
          </div>

          {/* Dynamics Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center hover:border-green-500/50 transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Compressors & Dynamics</h3>
            <p className="text-gray-400 mb-6">
              Professional dynamics processing for perfect mix control and punch.
            </p>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Vintage Compressors</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-lime-500 rounded-full"></div>
                <span>Multiband Dynamics</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Gates & Expanders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mx-auto mb-8 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">Professional Audio Effects Coming Soon</h2>
            <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
              We're developing a comprehensive suite of professional audio effects that combine the warmth of vintage hardware with modern digital precision.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <h4 className="text-white font-semibold mb-3">Premium Processing</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>• High-quality audio algorithms</li>
                  <li>• Vintage hardware modeling</li>
                  <li>• Zero-latency processing</li>
                  <li>• Intuitive user interfaces</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="text-white font-semibold mb-3">Studio Ready</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>• Professional audio quality</li>
                  <li>• Optimized CPU performance</li>
                  <li>• Full automation support</li>
                  <li>• Preset management system</li>
                </ul>
              </div>
            </div>

            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all">
              Get Notified When Available
            </button>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Link 
            href="/software"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to all Software & Sounds
          </Link>
        </div>
      </div>
    </div>
  );
}
