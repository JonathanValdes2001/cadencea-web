import React from 'react';

export default function Cart() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Shopping Cart</h1>
          <p className="text-gray-300">Your selected items and purchases</p>
        </div>

        {/* Empty Cart State */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mx-auto mb-8 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4h4z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
          <p className="text-gray-300 mb-8">
            Browse our effects and software to start building your perfect audio toolkit.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/software/effects" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Browse Effects
            </a>
            <a 
              href="/download" 
              className="border border-slate-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-800 transition-all"
            >
              Download Vault
            </a>
          </div>
        </div>

        {/* Cart Summary (for future use) */}
        <div className="mt-8 bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className="flex justify-between items-center text-gray-400">
            <span>Subtotal</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between items-center text-gray-400 mt-2">
            <span>Tax</span>
            <span>$0.00</span>
          </div>
          <div className="border-t border-slate-600 mt-4 pt-4">
            <div className="flex justify-between items-center text-white font-bold">
              <span>Total</span>
              <span>$0.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 