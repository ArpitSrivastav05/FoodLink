'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';
import { subscribeToListings, removeListing } from '@/lib/listings';
import type { FoodListing } from '@/types';
import { PlusCircle, Trash2, Clock, Package } from 'lucide-react';

export default function DonorListingsPage() {
  const { appUser } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'reserved'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!appUser) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToListings((data) => {
      setListings(data);
      setLoading(false);
    }, appUser.uid);
    return () => unsub();
  }, [appUser]);

  const filtered = filter === 'all' ? listings : listings.filter((l) => l.status === filter);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removeListing(deleteId);
    } catch (err) {
      console.error(err);
    }
    setDeleteId(null);
    setDeleting(false);
  };

  const tabs = [
    { key: 'all', label: 'All', count: listings.length },
    { key: 'active', label: 'Active', count: listings.filter((l) => l.status === 'active').length },
    { key: 'reserved', label: 'Reserved', count: listings.filter((l) => l.status === 'reserved').length },
    { key: 'expired', label: 'Expired', count: listings.filter((l) => l.status === 'expired').length },
  ] as const;

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
            <h1 className="text-2xl font-extrabold">My Listings</h1>
            <p className="text-sm text-muted mt-1">Manage your surplus food listings</p>
          </div>
          <Link href="/donor/listings/new">
            <Button icon={<PlusCircle size={16} />}>New Listing</Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer
                ${filter === tab.key ? 'bg-white shadow-sm text-foreground' : 'text-muted hover:text-foreground'}
              `}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package size={40} className="mx-auto text-muted mb-3" />
              <p className="text-muted font-medium">
                {filter === 'all' ? 'No listings yet.' : `No ${filter} listings.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 stagger-children">
            {filtered.map((listing) => {
              const isExpired = listing.expiryDate <= Date.now();
              const timeLeft = listing.expiryDate - Date.now();
              const hoursLeft = Math.max(0, Math.floor(timeLeft / 3600000));

              return (
                <Card key={listing.id} className="group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-foreground text-base">{listing.title}</h3>
                        <StatusBadge status={listing.status} />
                      </div>
                      <p className="text-sm text-muted line-clamp-2 mb-3">{listing.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-foreground font-semibold">
                          {listing.quantity} {listing.unit}
                        </span>
                        <span className="text-primary font-bold">₹{listing.pricePerUnit}/{listing.unit}</span>
                        <span className="flex items-center gap-1 text-muted">
                          <Clock size={14} />
                          {isExpired
                            ? 'Expired'
                            : hoursLeft < 24
                            ? `${hoursLeft}h left`
                            : `${Math.floor(hoursLeft / 24)}d left`}
                        </span>
                      </div>
                      {listing.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          {listing.tags.map((tag) => (
                            <Badge key={tag} variant="default">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {listing.status === 'active' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteId(listing.id)}
                          icon={<Trash2 size={14} />}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Listing">
        <p className="text-sm text-muted mb-4">
          Are you sure you want to remove this listing? It will no longer be visible to acceptors.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
