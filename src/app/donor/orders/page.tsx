'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getOrdersByDonor, updateOrderStatus } from '@/lib/orders';
import type { Order } from '@/types';
import { ShoppingCart, CheckCircle, XCircle } from 'lucide-react';

export default function DonorOrdersPage() {
  const { appUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setLoading(false);
      return;
    }
    getOrdersByDonor(appUser.uid)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [appUser]);

  const handleAction = async (orderId: string, status: 'reserved' | 'completed' | 'cancelled') => {
    setActionLoading(orderId);
    try {
      const noteMap = {
        reserved: 'Order confirmed by donor',
        completed: 'Order marked as completed',
        cancelled: 'Order cancelled by donor',
      };
      await updateOrderStatus(orderId, status, noteMap[status]);
      // Refresh
      if (appUser) {
        const updated = await getOrdersByDonor(appUser.uid);
        setOrders(updated);
      }
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
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
          <h1 className="text-2xl font-extrabold">Orders Received</h1>
          <p className="text-sm text-muted mt-1">Manage orders placed by acceptors</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart size={40} className="mx-auto text-muted mb-3" />
              <p className="text-muted font-medium">No orders received yet.</p>
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
                        <p className="text-muted text-xs">Acceptor</p>
                        <p className="font-medium">{order.acceptorName}</p>
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
                        <p className="text-muted text-xs">Payment</p>
                        <p className="font-medium capitalize">{order.paymentMethod}</p>
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

                  {/* Actions */}
                  {order.orderStatus === 'pending' && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(order.id, 'reserved')}
                        loading={actionLoading === order.id}
                        icon={<CheckCircle size={14} />}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleAction(order.id, 'cancelled')}
                        loading={actionLoading === order.id}
                        icon={<XCircle size={14} />}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  {order.orderStatus === 'reserved' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAction(order.id, 'completed')}
                      loading={actionLoading === order.id}
                      icon={<CheckCircle size={14} />}
                    >
                      Complete
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
