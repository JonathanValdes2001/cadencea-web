import React from 'react';

export default function Products() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            Our Products
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Professional tools for music creators, from file organization and cloud backups to VST license management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Cadancea Vault */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-purple-500 transition-all duration-300 hover:transform hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl mb-6"></div>
            <h3 className="text-2xl font-bold text-white mb-4">Cadencea Vault</h3>
            <p className="text-gray-300 mb-6">
              Professional file organization, sharing, and cloud backup solution for music creators. Keep your samples, projects, and stems organized across all devices.
            </p>
            <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all">
              Download Now
            </button>
          </div>

          {/* Cadancea Access */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-green-500 transition-all duration-300 hover:transform hover:scale-105 relative">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Cadencea Access</h3>
            <p className="text-gray-300 mb-6">
              VST and audio software license manager. Organize, activate, and manage all your plugin licenses in one centralized application.
            </p>
            <span className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Coming Soon
            </span>
            <button className="w-full border border-green-600 text-green-400 py-3 px-6 rounded-lg font-medium hover:bg-green-600 hover:text-white transition-all">
              Get Notified
            </button>
          </div>

          {/* Software Store */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:transform hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">VST Marketplace</h3>
            <p className="text-gray-300 mb-6">
              Browse and purchase professional VST effects and instruments. All licenses are automatically managed through Cadencea Access.
            </p>
            <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all">
              Browse Software
            </button>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Coming Soon</h2>
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">AI-Powered Project Assistant</h3>
            <p className="text-gray-300">
              Intelligent suggestions for project organization, automated tagging, and smart collaboration features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
