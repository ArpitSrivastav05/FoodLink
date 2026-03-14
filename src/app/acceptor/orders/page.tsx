'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { getOrdersByAcceptor, updateOrderStatus } from '@/lib/orders';
import Button from '@/components/ui/Button';
import type { Order } from '@/types';
import { ShoppingCart, XCircle } from 'lucide-react';

export default function AcceptorOrdersPage() {
  const { appUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) return;
    getOrdersByAcceptor(appUser.uid)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [appUser]);

  const handleCancel = async (orderId: string) => {
    setCancelling(orderId);
    try {
      await updateOrderStatus(orderId, 'cancelled', 'Cancelled by acceptor');
      if (appUser) {
        const updated = await getOrdersByAcceptor(appUser.uid);
        setOrders(updated);
      }
    } catch (err) {
      console.error(err);
    }
    setCancelling(null);
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
          <h1 className="text-2xl font-extrabold">My Orders</h1>
          <p className="text-sm text-muted mt-1">Track your food orders</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart size={40} className="mx-auto text-muted mb-3" />
              <p className="text-muted font-medium">No orders yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 stagger-children">
            {orders.map((order) => (
              <Card key={order.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold">{order.listingTitle}</h3>
                      <StatusBadge status={order.orderStatus} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted text-xs">Donor</p>
                        <p className="font-medium">{order.donorName}</p>
                      </div>
                      <div>
                        <p className="text-muted text-xs">Quantity</p>
                        <p className="font-medium">{order.quantity} units</p>
                      </div>
                      <div>
                        <p className="text-muted text-xs">Total</p>
                        <p className="font-bold text-primary">₹{order.totalPrice}</p>
                      </div>
                      <div>
                        <p className="text-muted text-xs">Date</p>
                        <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="mt-4 pt-3 border-t border-border">
                      <p className="text-xs text-muted font-semibold mb-2">Timeline</p>
                      <div className="flex gap-4 overflow-x-auto pb-1">
                        {order.timeline.map((entry, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs whitespace-nowrap">
                            <span className={`w-2 h-2 rounded-full ${
                              entry.status === 'completed' ? 'bg-success' :
                              entry.status === 'cancelled' ? 'bg-danger' :
                              'bg-info'
                            }`} />
                            <span className="font-medium capitalize">{entry.status}</span>
                            <span className="text-muted">{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {order.orderStatus === 'pending' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancel(order.id)}
                      loading={cancelling === order.id}
                      icon={<XCircle size={14} />}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
