'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  product: Database['public']['Tables']['products']['Row']
}

interface OrderWithItems extends Order {
  order_items: OrderItem[]
}

export default function OrderHistory() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && !authLoading) {
      fetchOrders()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, authLoading])

  const fetchOrders = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        setError('Failed to load order history')
        return
      }

      setOrders(ordersData || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-900/50 text-green-300'
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-300'
      case 'cancelled':
        return 'bg-red-900/50 text-red-300'
      case 'active':
        return 'bg-blue-900/50 text-blue-300'
      default:
        return 'bg-gray-900/50 text-gray-300'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading order history...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-red-300">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Order History</h1>
          <p className="text-gray-300">View your past purchases and downloads</p>
        </div>

        {orders.length > 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">Your Orders</h2>
            
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-medium">Order #{order.id.slice(0, 8)}</h3>
                      <p className="text-gray-400 text-sm">Purchased on {formatDate(order.created_at)}</p>
                      <p className="text-gray-400 text-sm">{order.order_items.length} item(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatPrice(order.total_amount)}</p>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="text-gray-300">
                          <span className="font-medium">{item.product.name}</span>
                          {item.quantity > 1 && (
                            <span className="text-gray-400"> × {item.quantity}</span>
                          )}
                        </div>
                        <span className="text-gray-400">{formatPrice(item.total_price)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-4">
                    {order.status === 'completed' && (
                      <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
                        Download
                      </button>
                    )}
                    <button className="border border-slate-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-slate-700 text-center">
            <div className="text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
              <p className="text-gray-400">You haven't made any purchases yet. Browse our products to get started!</p>
              <button 
                onClick={() => window.location.href = '/products'}
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Browse Products
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
