import React from 'react';

export default function CadenceaAccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Cadencea Access
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Professional license manager for VSTs and audio software downloaded from our marketplace.
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mx-auto mb-8 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">Coming Soon</h2>
            <p className="text-gray-300 mb-8 text-lg">
              Cadencea Access is currently in development. This powerful license manager will help you organize,
              activate, and manage all your VST plugins and audio software licenses in one centralized location.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-3 text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Automatic license activation</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-gray-400">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>Multi-device license management</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-gray-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>VST plugin organization</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-gray-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>License transfer & backup</span>
              </div>
            </div>


            <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all">
              Get Notified When Available
            </button>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
        </div>
      </div>
    </div>
  );
}
