'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { getOrdersByAcceptor } from '@/lib/orders';
import type { Order } from '@/types';
import { ShoppingCart, Search, TrendingUp, Package } from 'lucide-react';

export default function AcceptorDashboard() {
  const { appUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) {
      setLoading(false);
      return;
    }
    getOrdersByAcceptor(appUser.uid)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [appUser]);

  const pending = orders.filter((o) => o.orderStatus === 'pending').length;
  const completed = orders.filter((o) => o.orderStatus === 'completed').length;
  const totalSpent = orders.filter((o) => o.orderStatus === 'completed').reduce((s, o) => s + o.totalPrice, 0);

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: <ShoppingCart size={20} />, color: 'text-primary' },
    { label: 'Pending', value: pending, icon: <Package size={20} />, color: 'text-info' },
    { label: 'Completed', value: completed, icon: <TrendingUp size={20} />, color: 'text-success' },
    { label: 'Total Spent', value: `₹${totalSpent.toFixed(0)}`, icon: <TrendingUp size={20} />, color: 'text-secondary' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Acceptor Dashboard</h1>
            <p className="text-sm text-muted mt-1">Welcome back, {appUser?.name}!</p>
          </div>
          <Link href="/acceptor/discover">
            <Button icon={<Search size={16} />}>Discover Food</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-gray-50 ${s.color}`}>{s.icon}</div>
                  <div>
                    <p className="text-2xl font-extrabold">{s.value}</p>
                    <p className="text-xs text-muted font-medium">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Recent Orders</h2>
            <Link href="/acceptor/orders" className="text-sm text-primary font-semibold hover:underline">
              View all
            </Link>
          </div>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <ShoppingCart size={36} className="mx-auto text-muted mb-3" />
                <p className="text-muted font-medium">No orders yet.</p>
                <Link href="/acceptor/discover">
                  <Button variant="outline" size="sm" className="mt-3">Browse Available Food</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 stagger-children">
              {orders.slice(0, 5).map((order) => (
                <Card key={order.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{order.listingTitle}</h3>
                        <StatusBadge status={order.orderStatus} />
                      </div>
                      <p className="text-sm text-muted">
                        {order.quantity} units from {order.donorName} · ₹{order.totalPrice}
                      </p>
                    </div>
                    <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
