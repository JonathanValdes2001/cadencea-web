import React from 'react';

export default function LicenseManager() {
  const licenses = [
    { 
      product: 'YUMA 1.0', 
      licenseKey: 'YUMA-1234-5678-ABCD', 
      status: 'Active', 
      activations: '2/3',
      expiry: 'Lifetime'
    },
    { 
      product: 'Reverb Pro VST', 
      licenseKey: 'RVPR-8765-4321-WXYZ', 
      status: 'Active', 
      activations: '1/5',
      expiry: 'March 15, 2025'
    },
    { 
      product: 'Beta Effects Pack', 
      licenseKey: 'BETA-1111-2222-3333', 
      status: 'Beta', 
      activations: '1/1',
      expiry: 'June 1, 2024'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Licenses</h1>
          <p className="text-gray-300">Overview of your software licenses - full management requires Cadencea Access</p>
        </div>

        {/* Cadancea Access Notice */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Full License Management with Cadencea Access</h3>
              <p className="text-gray-300 mb-4">
                This page provides a read-only overview of your VST and software licenses. For advanced license management, 
                activation, transfers, and automatic organization, you'll need Cadencea Access (coming soon).
              </p>
              <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all">
                Get Notified About Cadencea Access
              </button>
            </div>
          </div>
        </div>

        {/* License Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Active Licenses</h3>
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white">3</p>
            <p className="text-gray-400 text-sm">Products activated</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Expiring Soon</h3>
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white">1</p>
            <p className="text-gray-400 text-sm">Beta Effects Pack</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Available Activations</h3>
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white">6</p>
            <p className="text-gray-400 text-sm">Remaining slots</p>
          </div>
        </div>

        {/* License List */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-6">Your Licenses</h2>
          
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left text-gray-300 font-medium py-3">Product</th>
                  <th className="text-left text-gray-300 font-medium py-3">License Key</th>
                  <th className="text-left text-gray-300 font-medium py-3">Status</th>
                  <th className="text-left text-gray-300 font-medium py-3">Activations</th>
                  <th className="text-left text-gray-300 font-medium py-3">Expiry</th>
                  <th className="text-left text-gray-300 font-medium py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license, index) => (
                  <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        </div>
                        <span className="text-white font-medium">{license.product}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <code className="text-gray-300 bg-slate-700 px-2 py-1 rounded text-sm">{license.licenseKey}</code>
                        <button className="text-gray-400 hover:text-white">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        license.status === 'Active' ? 'bg-green-900/50 text-green-300' :
                        license.status === 'Beta' ? 'bg-blue-900/50 text-blue-300' :
                        'bg-gray-900/50 text-gray-300'
                      }`}>
                        {license.status}
                      </span>
                    </td>
                    <td className="py-4 text-white">{license.activations}</td>
                    <td className="py-4 text-gray-300">{license.expiry}</td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <button className="text-purple-400 hover:text-purple-300 text-sm">
                          Manage
                        </button>
                        <button className="text-gray-400 hover:text-white text-sm">
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-white font-medium mb-4">Add New License</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter license key"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all">
                Activate License
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-white font-medium mb-4">Need Help?</h3>
            <div className="space-y-3">
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                License Transfer
              </button>
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
