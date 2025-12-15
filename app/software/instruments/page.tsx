import React from 'react';
import Link from 'next/link';

export default function Instruments() {
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
            <li className="text-white font-medium">Instruments</li>
          </ol>
        </nav>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Instruments
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Professional virtual instruments for music production. From synthesizers to samplers, discover the tools that will define your sound.
          </p>
        </div>

        {/* Coming Soon Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Synth Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center hover:border-purple-500/50 transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Synthesizers</h3>
            <p className="text-gray-400 mb-6">
              Wavetable synthesis, analog modeling, and FM synthesis engines with deep modulation capabilities.
            </p>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Wavetable Synthesizer</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Analog Modeled Synth</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>FM Synthesizer</span>
              </div>
            </div>
          </div>

          {/* Bass Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center hover:border-red-500/50 transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 110-6 3 3 0 010 6zm8 0a3 3 0 110-6 3 3 0 010 6z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Bass Instruments</h3>
            <p className="text-gray-400 mb-6">
              Deep, punchy bass synthesizers and sampled bass instruments for solid low-end foundation.
            </p>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Sub Bass Synthesizer</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Electric Bass</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Upright Bass</span>
              </div>
            </div>
          </div>

          {/* Drums Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center hover:border-orange-500/50 transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Drum Machines</h3>
            <p className="text-gray-400 mb-6">
              Classic and modern drum machines with authentic samples and powerful sequencing capabilities.
            </p>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Analog Drum Machine</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Sample-Based Drums</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Hybrid Drum Engine</span>
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
            
            <h2 className="text-3xl font-bold text-white mb-4">Revolutionary Instruments Coming Soon</h2>
            <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
              We're crafting the next generation of virtual instruments that will transform how you create music. 
              Each instrument is designed with cutting-edge synthesis technology and intuitive interfaces.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <h4 className="text-white font-semibold mb-3">Advanced Features</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>• High-quality synthesis engines</li>
                  <li>• Intuitive modulation system</li>
                  <li>• Preset management</li>
                  <li>• MIDI Learn functionality</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="text-white font-semibold mb-3">Professional Ready</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>• Studio-grade audio quality</li>
                  <li>• Low CPU usage</li>
                  <li>• VST3/AU compatibility</li>
                  <li>• Lifetime updates</li>
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
