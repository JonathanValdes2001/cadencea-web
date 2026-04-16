'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  product: Database['public']['Tables']['products']['Row'];
};

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export default function OrderHistory() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authLoading) {
      fetchOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('orders')
        .select(
          `*,
           order_items (*, product:products (*))`
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) {
        setError('Failed to load order history.');
        return;
      }
      setOrders(data || []);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(n);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-canvas text-sm text-ink-muted">
        Loading order history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-canvas text-sm text-ink">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-24">
        <header className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Account
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Order history.
          </h1>
          <p className="mt-4 max-w-xl text-base text-ink-muted">
            View your past purchases and downloads.
          </p>
        </header>

        {orders.length > 0 ? (
          <section className="rounded-md border border-line bg-canvas">
            <ul className="divide-y divide-line">
              {orders.map((order) => (
                <li key={order.id} className="px-6 py-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-widest text-ink-subtle">
                        {formatDate(order.created_at)} ·{' '}
                        {order.order_items.length} item
                        {order.order_items.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-ink">
                        {formatPrice(order.total_amount)}
                      </p>
                      <span className="mt-1 inline-flex items-center rounded-sm bg-elevated px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink">
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1 text-sm">
                    {order.order_items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-ink">
                          {item.product.name}
                          {item.quantity > 1 && (
                            <span className="text-ink-muted">
                              {' '}
                              × {item.quantity}
                            </span>
                          )}
                        </span>
                        <span className="text-ink-muted">
                          {formatPrice(item.total_price)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {order.status === 'completed' && (
                      <button
                        type="button"
                        className="inline-flex h-9 items-center rounded-sm bg-accent px-4 text-xs font-semibold tracking-wide text-white hover:bg-accent-hover"
                      >
                        Download
                      </button>
                    )}
                    <button
                      type="button"
                      className="inline-flex h-9 items-center rounded-sm border border-line px-4 text-xs font-semibold tracking-wide text-ink hover:bg-elevated"
                    >
                      View details
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="rounded-md border border-line bg-canvas p-12 text-center">
            <h2 className="text-xl font-semibold text-ink">No orders yet</h2>
            <p className="mt-2 text-sm text-ink-muted">
              You haven’t made any purchases yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
