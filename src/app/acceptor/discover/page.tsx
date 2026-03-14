'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent, CardFooter } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { getActiveListings } from '@/lib/listings';
import { createOrder } from '@/lib/orders';
import type { FoodListing } from '@/types';
import { Search, Clock, MapPin, ShoppingCart, Filter, Utensils } from 'lucide-react';

export default function DiscoverPage() {
  const { appUser } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [filtered, setFiltered] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [tagFilter, setTagFilter] = useState('');

  // Order modal
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);
  const [orderQty, setOrderQty] = useState('');
  const [orderPayment, setOrderPayment] = useState<'cash' | 'upi'>('cash');
  const [orderError, setOrderError] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    getActiveListings()
      .then((data) => {
        setListings(data);
        setFiltered(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filter + sort
  useEffect(() => {
    let result = [...listings];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(term) ||
          l.description.toLowerCase().includes(term) ||
          l.tags.some((t) => t.includes(term))
      );
    }

    // Tag filter
    if (tagFilter) {
      result = result.filter((l) => l.tags.some((t) => t.includes(tagFilter.toLowerCase())));
    }

    // Sort
    switch (sortBy) {
      case 'expiry':
        result.sort((a, b) => a.expiryDate - b.expiryDate);
        break;
      case 'price-low':
        result.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
        break;
      case 'price-high':
        result.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
        break;
      default:
        result.sort((a, b) => b.createdAt - a.createdAt);
    }

    setFiltered(result);
  }, [listings, searchTerm, sortBy, tagFilter]);

  const handleOrder = async () => {
    if (!appUser || !selectedListing) return;
    setOrderError('');

    const qty = parseFloat(orderQty);
    if (!qty || qty <= 0) {
      setOrderError('Quantity must be greater than 0.');
      return;
    }
    if (qty > selectedListing.quantity) {
      setOrderError(`Only ${selectedListing.quantity} ${selectedListing.unit} available.`);
      return;
    }

    setOrdering(true);
    try {
      await createOrder({
        listingId: selectedListing.id,
        acceptorId: appUser.uid,
        acceptorName: appUser.name,
        quantity: qty,
        paymentMethod: orderPayment,
      });
      setOrderSuccess(true);
      // Refresh listings
      const updated = await getActiveListings();
      setListings(updated);
    } catch (err: unknown) {
      setOrderError(err instanceof Error ? err.message : 'Failed to place order.');
    } finally {
      setOrdering(false);
    }
  };

  const closeModal = () => {
    setSelectedListing(null);
    setOrderQty('');
    setOrderError('');
    setOrderSuccess(false);
  };

  // Collect all unique tags
  const allTags = [...new Set(listings.flatMap((l) => l.tags))];

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
          <h1 className="text-2xl font-extrabold">Discover Food</h1>
          <p className="text-sm text-muted mt-1">Browse surplus food from nearby donors</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, tag, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'expiry', label: 'Expiring Soon' },
              { value: 'price-low', label: 'Price: Low → High' },
              { value: 'price-high', label: 'Price: High → Low' },
            ]}
          />
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter size={14} className="text-muted flex-shrink-0" />
            <button
              onClick={() => setTagFilter('')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                !tagFilter ? 'bg-primary text-white' : 'bg-gray-100 text-muted hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {allTags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag === tagFilter ? '' : tag)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                  tagFilter === tag ? 'bg-primary text-white' : 'bg-gray-100 text-muted hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Utensils size={40} className="mx-auto text-muted mb-3" />
              <p className="text-muted font-medium">No food available right now.</p>
              <p className="text-xs text-muted mt-1">Check back soon — new listings are posted daily!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {filtered.map((listing) => {
              const hoursLeft = Math.max(0, Math.floor((listing.expiryDate - Date.now()) / 3600000));
              const isUrgent = hoursLeft < 6;

              return (
                <Card key={listing.id} hover onClick={() => setSelectedListing(listing)} className="flex flex-col">
                  <CardContent className="flex-1">
                    {/* Urgency banner */}
                    {isUrgent && (
                      <div className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-lg mb-3 inline-flex items-center gap-1">
                        <Clock size={12} />
                        {hoursLeft}h left — Order now!
                      </div>
                    )}
                    <h3 className="font-bold text-lg mb-1">{listing.title}</h3>
                    <p className="text-sm text-muted line-clamp-2 mb-3">{listing.description}</p>

                    <div className="flex items-center gap-3 text-sm mb-3">
                      <span className="font-semibold">{listing.quantity} {listing.unit}</span>
                      <span className="text-muted">·</span>
                      <span className="text-primary font-bold text-lg">₹{listing.pricePerUnit}</span>
                      <span className="text-muted text-xs">/{listing.unit}</span>
                    </div>

                    {listing.location && (
                      <div className="flex items-center gap-1 text-xs text-muted mb-2">
                        <MapPin size={12} />
                        {listing.location}
                      </div>
                    )}

                    {listing.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {listing.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="default">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <p className="text-xs text-muted">
                      By {listing.donorName} · Expires {new Date(listing.expiryDate).toLocaleDateString()}
                    </p>
                    <Button size="sm" className="ml-auto" icon={<ShoppingCart size={14} />}>
                      Order
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Modal */}
      <Modal
        open={!!selectedListing}
        onClose={closeModal}
        title={orderSuccess ? 'Order Placed!' : `Order: ${selectedListing?.title}`}
      >
        {orderSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={28} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1">Order Placed Successfully!</h3>
            <p className="text-sm text-muted mb-4">The donor will confirm your order shortly.</p>
            <Button onClick={closeModal}>Close</Button>
          </div>
        ) : selectedListing ? (
          <div className="space-y-4">
            {orderError && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
                {orderError}
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-bold mb-1">{selectedListing.title}</h4>
              <p className="text-sm text-muted">
                Available: {selectedListing.quantity} {selectedListing.unit} · ₹{selectedListing.pricePerUnit}/{selectedListing.unit}
              </p>
            </div>

            <Input
              label={`Quantity (${selectedListing.unit})`}
              type="number"
              min="0.1"
              max={selectedListing.quantity.toString()}
              step="0.1"
              placeholder={`Max ${selectedListing.quantity}`}
              value={orderQty}
              onChange={(e) => setOrderQty(e.target.value)}
            />

            <Select
              label="Payment Method"
              value={orderPayment}
              onChange={(e) => setOrderPayment(e.target.value as 'cash' | 'upi')}
              options={[
                { value: 'cash', label: 'Cash on Pickup' },
                { value: 'upi', label: 'UPI' },
              ]}
            />

            {orderQty && parseFloat(orderQty) > 0 && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{(parseFloat(orderQty) * selectedListing.pricePerUnit).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted">
                  <span>Platform Fee (10%)</span>
                  <span>₹{(parseFloat(orderQty) * selectedListing.pricePerUnit * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-emerald-200">
                  <span>Total</span>
                  <span>₹{(parseFloat(orderQty) * selectedListing.pricePerUnit * 1.1).toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button onClick={handleOrder} loading={ordering} className="w-full" size="lg">
              Place Order
            </Button>
          </div>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}
