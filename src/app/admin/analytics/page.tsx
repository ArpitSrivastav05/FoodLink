'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import { getAllListings } from '@/lib/listings';
import { getAllOrders } from '@/lib/orders';
import type { FoodListing, Order } from '@/types';
import { Leaf, Utensils, TrendingUp, Globe, Package } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllListings(), getAllOrders()])
      .then(([l, o]) => {
        setListings(l);
        setOrders(o);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completed = orders.filter((o) => o.orderStatus === 'completed');
  const totalFoodKg = completed.reduce((s, o) => s + o.quantity, 0);
  const totalMeals = completed.length;
  const co2Saved = (totalFoodKg * 2.5).toFixed(1);
  const revenue = completed.reduce((s, o) => s + o.platformFee, 0);
  const avgOrderValue = completed.length > 0 ? (completed.reduce((s, o) => s + o.totalPrice, 0) / completed.length).toFixed(0) : '0';

  // Status breakdown
  const statusCounts = {
    active: listings.filter((l) => l.status === 'active').length,
    reserved: listings.filter((l) => l.status === 'reserved').length,
    expired: listings.filter((l) => l.status === 'expired').length,
    removed: listings.filter((l) => l.status === 'removed').length,
  };

  const orderStatusCounts = {
    pending: orders.filter((o) => o.orderStatus === 'pending').length,
    reserved: orders.filter((o) => o.orderStatus === 'reserved').length,
    completed: orders.filter((o) => o.orderStatus === 'completed').length,
    cancelled: orders.filter((o) => o.orderStatus === 'cancelled').length,
  };

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
        <div>
          <h1 className="text-2xl font-extrabold">Analytics</h1>
          <p className="text-sm text-muted mt-1">Impact metrics and platform performance</p>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 !border-0 text-white">
            <CardContent>
              <Leaf size={28} className="mb-2 opacity-80" />
              <p className="text-3xl font-extrabold">{totalFoodKg}</p>
              <p className="text-sm opacity-80">Kg Food Saved</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 !border-0 text-white">
            <CardContent>
              <Utensils size={28} className="mb-2 opacity-80" />
              <p className="text-3xl font-extrabold">{totalMeals}</p>
              <p className="text-sm opacity-80">Meals Delivered</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 !border-0 text-white">
            <CardContent>
              <Globe size={28} className="mb-2 opacity-80" />
              <p className="text-3xl font-extrabold">{co2Saved}</p>
              <p className="text-sm opacity-80">Kg CO₂ Reduced</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-violet-500 to-violet-600 !border-0 text-white">
            <CardContent>
              <TrendingUp size={28} className="mb-2 opacity-80" />
              <p className="text-3xl font-extrabold">₹{revenue.toFixed(0)}</p>
              <p className="text-sm opacity-80">Platform Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Breakdowns */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Listing Status */}
          <Card>
            <CardContent>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Package size={18} className="text-primary" />
                Listing Status Breakdown
              </h3>
              {Object.entries(statusCounts).map(([status, count]) => {
                const total = listings.length || 1;
                const pct = Math.round((count / total) * 100);
                const colorMap: Record<string, string> = {
                  active: 'bg-emerald-500',
                  reserved: 'bg-amber-500',
                  expired: 'bg-red-500',
                  removed: 'bg-gray-500',
                };
                return (
                  <div key={status} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{status}</span>
                      <span className="text-muted">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${colorMap[status]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardContent>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-secondary" />
                Order Status Breakdown
              </h3>
              {Object.entries(orderStatusCounts).map(([status, count]) => {
                const total = orders.length || 1;
                const pct = Math.round((count / total) * 100);
                const colorMap: Record<string, string> = {
                  pending: 'bg-blue-500',
                  reserved: 'bg-amber-500',
                  completed: 'bg-emerald-500',
                  cancelled: 'bg-red-500',
                };
                return (
                  <div key={status} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{status}</span>
                      <span className="text-muted">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${colorMap[status]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <Card>
          <CardContent>
            <h3 className="font-bold mb-4">Key Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-2xl font-extrabold text-primary">{listings.length}</p>
                <p className="text-xs text-muted">Total Listings</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-secondary">{orders.length}</p>
                <p className="text-xs text-muted">Total Orders</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-accent">₹{avgOrderValue}</p>
                <p className="text-xs text-muted">Avg Order Value</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-info">
                  {orders.length > 0 ? Math.round((completed.length / orders.length) * 100) : 0}%
                </p>
                <p className="text-xs text-muted">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
