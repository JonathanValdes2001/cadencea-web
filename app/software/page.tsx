'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

// Mock product data - replace with real data later
const mockProducts = [
  {
    id: 1,
        name: 'Cadencea Synth Pro',
    category: 'instruments',
    type: 'Synthesizer',
    price: 199,
    description: 'Professional wavetable synthesizer with advanced modulation capabilities.',
    image: 'gradient-purple',
    comingSoon: true,
    featured: true
  },
  {
    id: 2,
    name: 'Vintage Reverb Suite',
    category: 'effects',
    type: 'Reverb',
    price: 89,
    description: 'Collection of classic reverb algorithms from the golden age of digital audio.',
    image: 'gradient-blue',
    comingSoon: true,
    featured: false
  },
  {
    id: 3,
    name: 'Analog Drum Collection',
    category: 'sounds',
    type: 'Sample Pack',
    price: 49,
    description: 'High-quality analog drum samples recorded through vintage hardware.',
    image: 'gradient-green',
    comingSoon: true,
    featured: false
  },
  {
    id: 4,
    name: 'Bass Engine',
    category: 'instruments',
    type: 'Bass Synthesizer',
    price: 129,
    description: 'Powerful bass synthesizer with deep sub-bass capabilities.',
    image: 'gradient-red',
    comingSoon: true,
    featured: true
  },
  {
    id: 5,
    name: 'Cinematic Strings',
    category: 'sounds',
    type: 'Sample Library',
    price: 299,
    description: 'Orchestra-quality string samples for film and game scoring.',
    image: 'gradient-orange',
    comingSoon: true,
    featured: false
  },
  {
    id: 6,
    name: 'Spectral Compressor',
    category: 'effects',
    type: 'Dynamics',
    price: 149,
    description: 'AI-powered spectral compressor for transparent dynamic control.',
    image: 'gradient-teal',
    comingSoon: true,
    featured: true
  }
];

const categories = [
  { id: 'all', name: 'All', count: mockProducts.filter(p => p.category === 'instruments' || p.category === 'effects').length },
  { id: 'instruments', name: 'Instruments', count: mockProducts.filter(p => p.category === 'instruments').length },
  { id: 'effects', name: 'Effects', count: mockProducts.filter(p => p.category === 'effects').length },
  { id: 'free', name: 'Free', count: 0 }
];

const sortOptions = [
  { id: 'most-relevant', name: 'Most relevant' },
  { id: 'most-recent', name: 'Most recent' },
  { id: 'lowest-price', name: 'Lowest price' },
  { id: 'highest-price', name: 'Highest price' }
];

const gradientClasses: Record<string, string> = {
  'gradient-purple': 'from-purple-600 to-purple-800',
  'gradient-blue': 'from-blue-600 to-blue-800',
  'gradient-green': 'from-green-600 to-green-800',
  'gradient-red': 'from-red-600 to-red-800',
  'gradient-orange': 'from-orange-600 to-orange-800',
  'gradient-teal': 'from-teal-600 to-teal-800'
};

export default function SoftwareAndSounds() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('most-relevant');
  const [hideOwnedProducts, setHideOwnedProducts] = useState(false);

  const filteredProducts = useMemo(() => {
    // Only show instruments and effects (exclude sounds)
    let filtered = mockProducts.filter(product => product.category === 'instruments' || product.category === 'effects');

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(product => product.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort products
    switch (sortBy) {
      case 'lowest-price':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'highest-price':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'most-recent':
        filtered.sort((a, b) => b.id - a.id);
        break;
      case 'most-relevant':
      default:
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return filtered;
  }, [activeCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Category Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-white text-slate-900'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Header with Results Count */}
        <div className="mb-8">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="text-gray-400 text-lg">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
              </p>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Hide Owned Products Toggle */}
              <label className="flex items-center space-x-3 text-gray-300">
                <input
                  type="checkbox"
                  checked={hideOwnedProducts}
                  onChange={(e) => setHideOwnedProducts(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-slate-800 border-slate-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm">Hide owned products</span>
              </label>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-slate-600 transition-all duration-300 overflow-hidden">
                  {/* Product Image/Preview */}
                  <div className={`h-48 bg-gradient-to-br ${gradientClasses[product.image] || 'from-purple-600 to-purple-800'} relative flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative z-10 text-center">
                      <h3 className="text-white font-bold text-xl mb-2">{product.name}</h3>
                      <span className="text-gray-200 text-sm">{product.type}</span>
                    </div>
                    
                    {/* Coming Soon Badge */}
                    {product.comingSoon && (
                      <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-medium">
                        Coming Soon
                      </div>
                    )}

                    {/* Play Button */}
                    <button className="absolute bottom-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <h4 className="text-white font-semibold text-lg mb-2">{product.name}</h4>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                    
                    {/* Pricing */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">Update</span>
                        <span className="text-white font-bold">€{product.price}.00</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">Full Version</span>
                        <span className="text-white font-bold">€{Math.round(product.price * 1.5)}.00</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button 
                      className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={product.comingSoon}
                    >
                      {product.comingSoon ? 'Coming Soon' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* No Results */
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.85-6.179-2.262m0 0A7.962 7.962 0 016 9c0-5.385 4.365-9.75 9.75-9.75S25.5 3.615 25.5 9a7.962 7.962 0 01-2.071 5.738" />
              </svg>
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">No products found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}

      </div>
    </div>
  );
}
