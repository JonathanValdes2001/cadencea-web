import React from 'react';

export default function VaultDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Vault Dashboard</h1>
          <p className="text-gray-300">Monitor your cloud storage and file synchronization</p>
        </div>

        {/* Storage & Device Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Cloud Storage Used</h3>
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white mb-2">847 GB of 1 TB</p>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{width: '84.7%'}}></div>
            </div>
            <p className="text-gray-400 text-sm mt-2">84.7% used</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Connected Devices</h3>
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white mb-2">2 of 3 devices</p>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{width: '66.7%'}}></div>
            </div>
            <p className="text-gray-400 text-sm mt-2">1 slot available</p>
          </div>
        </div>

        {/* Connected Devices */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Device Management</h2>
          <div className="space-y-4">
            {[
              { name: 'MacBook Pro (Main Studio)', type: 'macOS', lastSync: '2 hours ago', status: 'online' },
              { name: 'Windows Desktop (Home)', type: 'Windows', lastSync: '1 day ago', status: 'offline' }
            ].map((device, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    {device.type === 'macOS' ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09 22C7.78 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.19 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5M13.17 5.33C13.97 4.44 14.59 3.24 14.43 2C13.45 2.07 12.25 2.67 11.4 3.54C10.61 4.36 9.9 5.58 10.08 6.77C11.16 6.86 12.27 6.24 13.17 5.33Z"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3,12V6.75L9,5.43V11.91L3,12M20,3V11.75L10,11.9V5.21L20,3M3,13L9,13.09V19.9L3,18.75V13M20,13.25V22L10,20.09V13.1L20,13.25Z"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{device.name}</h3>
                    <p className="text-gray-400 text-sm">{device.type} • Last synced {device.lastSync}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {device.status === 'online' && (
                    <span className="bg-green-900/50 text-green-300 px-2 py-1 rounded text-xs">Online</span>
                  )}
                  {device.status === 'offline' && (
                    <span className="bg-gray-900/50 text-gray-300 px-2 py-1 rounded text-xs">Offline</span>
                  )}
                  <button className="text-red-400 hover:text-red-300 text-sm">
                    Remove
                  </button>
                  <button className="text-gray-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
