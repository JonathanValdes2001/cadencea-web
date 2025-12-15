import React from 'react';
import Link from 'next/link';

export default function Sounds() {
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
            <li className="text-white font-medium">Sounds</li>
          </ol>
        </nav>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
              Sounds
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Premium sample libraries, loops, and presets to inspire your creativity. From cinematic orchestras to underground beats.
          </p>
        </div>

        {/* Coming Soon Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Sample Packs Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center hover:border-green-500/50 transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2C7 1.45 7.45 1 8 1h8c.55 0 1 .45 1 1v2h5v2h-2v15c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6H2V4h5zM9 3v1h6V3H9zM6 6v15h12V6H6z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Sample Packs</h3>
            <p className="text-gray-400 mb-6">
              Curated collections of high-quality samples across multiple genres and styles.
            </p>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Electronic Samples</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Hip-Hop Collections</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Ambient Textures</span>
              </div>
            </div>
          </div>

          {/* Loops Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center hover:border-teal-500/50 transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Loops & Stems</h3>
            <p className="text-gray-400 mb-6">
              Ready-to-use loops and stems that seamlessly integrate into your productions.
            </p>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Drum Loops</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                <span>Melodic Stems</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Bass Lines</span>
              </div>
            </div>
          </div>

          {/* Cinematic Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center hover:border-orange-500/50 transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Cinematic Libraries</h3>
            <p className="text-gray-400 mb-6">
              Epic orchestral samples and atmospheric sounds for film, game, and trailer music.
            </p>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Orchestra Samples</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Epic Percussion</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Atmospheric Pads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl mx-auto mb-8 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">Premium Sound Libraries Coming Soon</h2>
            <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
              We're curating the finest collection of sounds from renowned producers and sound designers worldwide. 
              Every sample is professionally recorded and mastered to industry standards.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <h4 className="text-white font-semibold mb-3">Quality Standards</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>• 24-bit/96kHz audio quality</li>
                  <li>• Professionally mixed & mastered</li>
                  <li>• Tempo and key information</li>
                  <li>• Royalty-free licensing</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="text-white font-semibold mb-3">Diverse Collection</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>• Multiple genres covered</li>
                  <li>• Various BPM ranges</li>
                  <li>• Stems and full mixes</li>
                  <li>• Regular content updates</li>
                </ul>
              </div>
            </div>

            <button className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-3 rounded-xl font-medium hover:from-green-700 hover:to-teal-700 transition-all">
              Get Early Access
            </button>
          </div>
        </div>

        {/* Sound Categories Preview */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Upcoming Sound Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Electronic', color: 'from-blue-500 to-purple-600' },
              { name: 'Hip-Hop', color: 'from-yellow-500 to-orange-600' },
              { name: 'Ambient', color: 'from-teal-500 to-green-600' },
              { name: 'Rock', color: 'from-red-500 to-pink-600' },
              { name: 'Jazz', color: 'from-indigo-500 to-blue-600' },
              { name: 'World', color: 'from-orange-500 to-red-600' },
              { name: 'Classical', color: 'from-purple-500 to-pink-600' },
              { name: 'Experimental', color: 'from-gray-500 to-slate-600' }
            ].map((category) => (
              <div key={category.name} className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-lg mx-auto mb-2 opacity-50`}></div>
                <span className="text-gray-400 text-sm">{category.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Link 
            href="/software"
            className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors"
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
