'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { getAllListings, removeListing } from '@/lib/listings';
import type { FoodListing } from '@/types';
import { Search, Trash2, Package, AlertTriangle } from 'lucide-react';

export default function AdminListingsPage() {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [filtered, setFiltered] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FoodListing | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchListings = async () => {
    const data = await getAllListings();
    setListings(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(listings);
    } else {
      const term = search.toLowerCase();
      setFiltered(listings.filter((l) =>
        l.title.toLowerCase().includes(term) ||
        l.donorName.toLowerCase().includes(term) ||
        l.tags.some((t) => t.includes(term))
      ));
    }
  }, [search, listings]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeListing(deleteTarget.id);
      await fetchListings();
    } catch (err) {
      console.error(err);
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  // Detect potential duplicates (same donor, same title)
  const duplicates = new Set<string>();
  const seen = new Map<string, string>();
  listings.forEach((l) => {
    const key = `${l.donorId}-${l.title.toLowerCase()}`;
    if (seen.has(key)) {
      duplicates.add(l.id);
      duplicates.add(seen.get(key)!);
    }
    seen.set(key, l.id);
  });

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
          <h1 className="text-2xl font-extrabold">Listing Moderation</h1>
          <p className="text-sm text-muted mt-1">{listings.length} total listings</p>
        </div>

        <Input
          placeholder="Search listings by title, donor name, or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={16} />}
        />

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package size={40} className="mx-auto text-muted mb-3" />
              <p className="text-muted font-medium">No listings found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-semibold text-muted">Title</th>
                  <th className="pb-3 font-semibold text-muted">Donor</th>
                  <th className="pb-3 font-semibold text-muted">Qty</th>
                  <th className="pb-3 font-semibold text-muted">Price</th>
                  <th className="pb-3 font-semibold text-muted">Status</th>
                  <th className="pb-3 font-semibold text-muted">Flags</th>
                  <th className="pb-3 font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((listing) => {
                  const isExpiredNow = listing.expiryDate <= Date.now();
                  return (
                    <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <p className="font-medium">{listing.title}</p>
                        <div className="flex gap-1 mt-1">
                          {listing.tags.slice(0, 3).map((t) => (
                            <Badge key={t} variant="default">{t}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-muted">{listing.donorName}</td>
                      <td className="py-3">{listing.quantity} {listing.unit}</td>
                      <td className="py-3 font-medium">₹{listing.pricePerUnit}</td>
                      <td className="py-3"><StatusBadge status={listing.status} /></td>
                      <td className="py-3">
                        {duplicates.has(listing.id) && (
                          <Badge variant="warning" dot>Duplicate</Badge>
                        )}
                        {isExpiredNow && listing.status === 'active' && (
                          <Badge variant="danger" dot>Should Expire</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        {listing.status !== 'removed' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget(listing)}
                            icon={<Trash2 size={14} />}
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Listing">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className="text-amber-500" />
          <p className="text-sm text-muted">
            This will remove <strong>{deleteTarget?.title}</strong> by {deleteTarget?.donorName}.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
