'use client';

import React from 'react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';

const Navbar = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    setActiveDropdown(null);
  };

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50" ref={dropdownRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg mr-3"></div>
              <span className="text-white font-bold text-xl tracking-tight">Cadencea</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {/* Software Dropdown */}
              <div className="relative group">
                <button 
                  onClick={() => toggleDropdown('software')}
                  className="text-gray-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  Software & Sounds
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeDropdown === 'software' && (
                  <div className="absolute left-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg border border-slate-700 z-10">
                    <Link 
                      href="/software" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Software
                    </Link>
                    <Link 
                      href="/software/sounds" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Sounds
                    </Link>
                  </div>
                )}
              </div>

              <Link 
                href="/access" 
                className="text-gray-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cadencea Access
              </Link>

              <Link 
                href="/download" 
                className="text-gray-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cadencea Vault
              </Link>

              {/* Account Dropdown */}
              <div className="relative group">
                <button 
                  onClick={() => toggleDropdown('account')}
                  className="text-gray-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  Account
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeDropdown === 'account' && (
                  <div className="absolute left-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg border border-slate-700 z-10">
                    <Link 
                      href="/account/settings" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Account Settings
                    </Link>
                    <Link 
                      href="/account/order-history" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Order History
                    </Link>
                    <Link 
                      href="/account/vault-dashboard" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Vault Dashboard
                    </Link>
                    <Link 
                      href="/account/subscription" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Subscription
                    </Link>
                  </div>
                )}
              </div>

              <Link 
                href="/cart" 
                className="text-gray-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4h4z" />
                </svg>
                Cart
              </Link>
            </div>
          </div>

          {/* Authentication Links */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-300 text-sm">Loading...</span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <button 
                    onClick={() => toggleDropdown('user')}
                    className="text-gray-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mr-2 flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : user.email}
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {activeDropdown === 'user' && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg border border-slate-700 z-10">
                      <Link 
                        href="/account/settings" 
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white"
                        onClick={() => setActiveDropdown(null)}
                      >
                        Account Settings
                      </Link>
                      <Link 
                        href="/account/order-history" 
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white"
                        onClick={() => setActiveDropdown(null)}
                      >
                        Order History
                      </Link>
                      <Link 
                        href="/dashboard" 
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white"
                        onClick={() => setActiveDropdown(null)}
                      >
                        Dashboard
                      </Link>
                      <hr className="border-slate-600 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-slate-700 hover:text-red-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-white hover:bg-slate-800 p-2 rounded-md"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-slate-800">
              <div className="space-y-1">
                <div className="text-gray-400 px-3 py-2 text-sm font-medium">Software & Sounds</div>
                <Link 
                  href="/software" 
                  className="text-gray-300 hover:text-white hover:bg-slate-800 block px-6 py-2 rounded-md text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Software
                </Link>
                <Link 
                  href="/software/sounds" 
                  className="text-gray-300 hover:text-white hover:bg-slate-800 block px-6 py-2 rounded-md text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sounds
                </Link>
              </div>
              
              <Link 
                href="/access" 
                className="text-gray-300 hover:text-white hover:bg-slate-800 block px-3 py-2 rounded-md text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Cadancea Access
              </Link>
              
              <Link 
                href="/download" 
                className="text-gray-300 hover:text-white hover:bg-slate-800 block px-3 py-2 rounded-md text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Cadancea Vault
              </Link>

              <div className="space-y-1">
                <div className="text-gray-400 px-3 py-2 text-sm font-medium">Account</div>
                <Link 
                  href="/account/settings" 
                  className="text-gray-300 hover:text-white hover:bg-slate-800 block px-6 py-2 rounded-md text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Account Settings
                </Link>
                <Link 
                  href="/account/order-history" 
                  className="text-gray-300 hover:text-white hover:bg-slate-800 block px-6 py-2 rounded-md text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Order History
                </Link>
                <Link 
                  href="/account/vault-dashboard" 
                  className="text-gray-300 hover:text-white hover:bg-slate-800 block px-6 py-2 rounded-md text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Vault Dashboard
                </Link>
                <Link 
                  href="/account/subscription" 
                  className="text-gray-300 hover:text-white hover:bg-slate-800 block px-6 py-2 rounded-md text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Subscription
                </Link>
              </div>

              <Link 
                href="/cart" 
                className="text-gray-300 hover:text-white hover:bg-slate-800 block px-3 py-2 rounded-md text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Shopping Cart
              </Link>

              {/* Mobile Authentication Links */}
              <div className="border-t border-slate-700 pt-4 mt-4">
                {loading ? (
                  <div className="flex items-center justify-center px-3 py-2">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-gray-300 text-sm">Loading...</span>
                  </div>
                ) : user ? (
                  <>
                    <div className="px-3 py-2 text-sm text-gray-300 border-b border-slate-700 mb-2">
                      Signed in as: <span className="font-medium text-white">
                        {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : user.email}
                      </span>
                    </div>
                    <Link 
                      href="/account/settings" 
                      className="text-gray-300 hover:text-white hover:bg-slate-800 block px-3 py-2 rounded-md text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Account Settings
                    </Link>
                    <Link 
                      href="/account/order-history" 
                      className="text-gray-300 hover:text-white hover:bg-slate-800 block px-3 py-2 rounded-md text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Order History
                    </Link>
                    <Link 
                      href="/dashboard" 
                      className="text-gray-300 hover:text-white hover:bg-slate-800 block px-3 py-2 rounded-md text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="text-red-300 hover:text-red-200 hover:bg-slate-800 block w-full text-left px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="text-gray-300 hover:text-white hover:bg-slate-800 block px-3 py-2 rounded-md text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/register" 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white block px-3 py-2 rounded-md text-sm font-medium mt-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
