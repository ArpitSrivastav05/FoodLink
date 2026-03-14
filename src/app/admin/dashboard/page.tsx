'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import { getAllListings } from '@/lib/listings';
import { getAllOrders } from '@/lib/orders';
import type { FoodListing, Order } from '@/types';
import { Package, ShoppingCart, Users, TrendingUp, Leaf, Globe } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminDashboard() {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllListings(),
      getAllOrders(),
      getDocs(collection(db, 'users')),
    ])
      .then(([l, o, uSnap]) => {
        setListings(l);
        setOrders(o);
        setUserCount(uSnap.size);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completedOrders = orders.filter((o) => o.orderStatus === 'completed');
  const totalRevenue = completedOrders.reduce((s, o) => s + o.platformFee, 0);
  const totalFoodSaved = completedOrders.reduce((s, o) => s + o.quantity, 0);
  const mealsDelivered = completedOrders.length;
  const co2Saved = (totalFoodSaved * 2.5).toFixed(1); // ~2.5kg CO2 per kg food

  const stats = [
    { label: 'Total Users', value: userCount, icon: <Users size={22} />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Listings', value: listings.length, icon: <Package size={22} />, color: 'text-primary', bg: 'bg-emerald-50' },
    { label: 'Total Orders', value: orders.length, icon: <ShoppingCart size={22} />, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Platform Revenue', value: `₹${totalRevenue.toFixed(0)}`, icon: <TrendingUp size={22} />, color: 'text-violet-500', bg: 'bg-violet-50' },
    { label: 'Food Saved (kg)', value: totalFoodSaved, icon: <Leaf size={22} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'CO₂ Reduced (kg)', value: co2Saved, icon: <Globe size={22} />, color: 'text-cyan-500', bg: 'bg-cyan-50' },
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
        <div>
          <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
          <p className="text-sm text-muted mt-1">System overview and analytics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>{s.icon}</div>
                  <div>
                    <p className="text-2xl font-extrabold">{s.value}</p>
                    <p className="text-xs text-muted font-medium">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-bold mb-3">Recent Listings</h2>
            <div className="space-y-2">
              {listings.slice(0, 5).map((l) => (
                <Card key={l.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{l.title}</h4>
                      <p className="text-xs text-muted">By {l.donorName} · {l.quantity} {l.unit}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      l.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      l.status === 'expired' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>{l.status}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-3">Recent Orders</h2>
            <div className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <Card key={o.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{o.listingTitle}</h4>
                      <p className="text-xs text-muted">{o.acceptorName} → {o.donorName} · ₹{o.totalPrice}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      o.orderStatus === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                      o.orderStatus === 'pending' ? 'bg-blue-50 text-blue-700' :
                      o.orderStatus === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>{o.orderStatus}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
