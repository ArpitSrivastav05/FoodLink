'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { subscribeToListings } from '@/lib/listings';
import { getOrdersByDonor } from '@/lib/orders';
import type { FoodListing, Order } from '@/types';
import { Package, ShoppingCart, PlusCircle, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

export default function DonorDashboard() {
  const { appUser } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToListings((data) => {
      setListings(data);
      setLoading(false);
    }, appUser.uid);

    getOrdersByDonor(appUser.uid).then(setOrders).catch(console.error);

    return () => unsub();
  }, [appUser]);

  const activeListings = listings.filter((l) => l.status === 'active');
  const expiredListings = listings.filter((l) => l.status === 'expired');
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending');
  const totalRevenue = orders
    .filter((o) => o.orderStatus === 'completed')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const stats = [
    { label: 'Active Listings', value: activeListings.length, icon: <Package size={20} />, color: 'text-primary' },
    { label: 'Pending Orders', value: pendingOrders.length, icon: <Clock size={20} />, color: 'text-info' },
    { label: 'Total Orders', value: orders.length, icon: <ShoppingCart size={20} />, color: 'text-secondary' },
    { label: 'Revenue (₹)', value: `₹${totalRevenue.toFixed(0)}`, icon: <TrendingUp size={20} />, color: 'text-success' },
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Donor Dashboard</h1>
            <p className="text-sm text-muted mt-1">Welcome back, {appUser?.name}!</p>
          </div>
          <Link href="/donor/listings/new">
            <Button icon={<PlusCircle size={16} />}>New Listing</Button>
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

        {/* Expired alert */}
        {expiredListings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in">
            <AlertTriangle size={18} className="text-amber-600" />
            <p className="text-sm text-amber-800">
              You have <strong>{expiredListings.length}</strong> expired listing(s). They are no longer visible to acceptors.
            </p>
          </div>
        )}

        {/* Recent listings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Recent Listings</h2>
            <Link href="/donor/listings" className="text-sm text-primary font-semibold hover:underline">
              View all
            </Link>
          </div>
          {listings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package size={36} className="mx-auto text-muted mb-3" />
                <p className="text-muted font-medium">No listings yet.</p>
                <Link href="/donor/listings/new">
                  <Button variant="outline" size="sm" className="mt-3">Create Your First Listing</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 stagger-children">
              {listings.slice(0, 5).map((listing) => (
                <Card key={listing.id} hover>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
                        <StatusBadge status={listing.status} />
                      </div>
                      <p className="text-sm text-muted">
                        {listing.quantity} {listing.unit} · ₹{listing.pricePerUnit}/{listing.unit}
                        {' · Expires '}
                        {new Date(listing.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">₹{listing.pricePerUnit}</p>
                      <p className="text-xs text-muted">per {listing.unit}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        {orders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Recent Orders</h2>
              <Link href="/donor/orders" className="text-sm text-primary font-semibold hover:underline">
                View all
              </Link>
            </div>
            <div className="grid gap-3 stagger-children">
              {orders.slice(0, 3).map((order) => (
                <Card key={order.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{order.listingTitle}</h3>
                      <p className="text-sm text-muted">
                        By {order.acceptorName} · {order.quantity} units · ₹{order.totalPrice}
                      </p>
                    </div>
                    <StatusBadge status={order.orderStatus} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
