import React from 'react';

export default function Subscription() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Subscription</h1>
          <p className="text-gray-300">Manage your recurring subscriptions and billing</p>
        </div>

        {/* Current Subscription */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Current Plan</h2>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white">Cloud Storage Pro</h3>
              <p className="text-gray-300">1TB cloud storage with advanced sync features</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">$19.99</p>
              <p className="text-gray-400 text-sm">per month</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-gray-400 text-sm">Next billing date</p>
              <p className="text-white font-medium">April 15, 2024</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Payment method</p>
              <p className="text-white font-medium">•••• •••• •••• 4242</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all">
              Upgrade Plan
            </button>
            <button className="border border-slate-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-700 transition-all">
              Update Payment
            </button>
            <button className="text-red-400 hover:text-red-300 px-6 py-2 rounded-lg font-medium transition-colors">
              Cancel
            </button>
          </div>
        </div>



        {/* Billing History */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-6">Recent Billing</h2>
          
          <div className="space-y-4">
            {[
              { date: 'March 15, 2024', amount: '$19.99', status: 'Paid', invoice: 'INV-2024-003' },
              { date: 'February 15, 2024', amount: '$19.99', status: 'Paid', invoice: 'INV-2024-002' },
              { date: 'January 15, 2024', amount: '$19.99', status: 'Paid', invoice: 'INV-2024-001' }
            ].map((bill, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">{bill.date}</p>
                  <p className="text-gray-400 text-sm">Invoice {bill.invoice}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="text-white font-medium">{bill.amount}</p>
                  <span className="bg-green-900/50 text-green-300 px-2 py-1 rounded text-xs">{bill.status}</span>
                  <button className="text-purple-400 hover:text-purple-300 text-sm">
                    Download
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