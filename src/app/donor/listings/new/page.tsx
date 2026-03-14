'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Input, { Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { createListing } from '@/lib/listings';
import { generateFoodDescription } from '@/lib/gemini';
import { Sparkles, X, Save } from 'lucide-react';

const UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'plates', label: 'Plates' },
  { value: 'servings', label: 'Servings' },
  { value: 'packets', label: 'Packets' },
  { value: 'liters', label: 'Liters' },
  { value: 'pieces', label: 'Pieces' },
];

export default function NewListingPage() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [hygieneNotes, setHygieneNotes] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAIAssist = async () => {
    if (!title) {
      setError('Please enter a food title first.');
      return;
    }
    setAiLoading(true);
    setError('');
    try {
      const result = await generateFoodDescription({
        title,
        quantity: parseFloat(quantity) || 0,
        unit,
        hygieneNotes,
        tags,
      });
      setDescription(result.description);
      // Merge suggested tags
      const newTags = [...new Set([...tags, ...result.suggestedTags])];
      setTags(newTags.slice(0, 8));
    } catch {
      setError('AI assistant is unavailable. Please write a description manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!appUser) {
      setError('You must be logged in.');
      return;
    }

    const qty = parseFloat(quantity);
    const price = parseFloat(pricePerUnit);
    const expiry = new Date(expiryDate).getTime();

    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (isNaN(price) || price < 0) {
      setError('Price cannot be negative.');
      return;
    }
    if (!expiryDate || expiry <= Date.now()) {
      setError('Expiry date must be in the future.');
      return;
    }

    setLoading(true);
    try {
      await createListing({
        donorId: appUser.uid,
        donorName: appUser.name,
        title: title.trim(),
        description: description.trim(),
        tags,
        quantity: qty,
        unit,
        pricePerUnit: price,
        expiryDate: expiry,
        hygieneNotes: hygieneNotes.trim(),
        location: location.trim(),
      });
      router.push('/donor/listings');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  // Minimum date for expiry (now + 1 hour)
  const minExpiry = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-extrabold mb-1">Create New Listing</h1>
        <p className="text-sm text-muted mb-6">Post surplus food for acceptors to discover</p>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200 animate-fade-in">
                  {error}
                </div>
              )}

              <Input
                label="Food Item Title"
                placeholder="e.g., Paneer Butter Masala"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              {/* AI Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-foreground">Description</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAIAssist}
                    loading={aiLoading}
                    icon={<Sparkles size={14} />}
                    className="!text-accent"
                  >
                    AI Assist
                  </Button>
                </div>
                <Textarea
                  placeholder="Describe the food — freshness, preparation, and who it's great for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="e.g., 10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
                <Select
                  label="Unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  options={UNITS}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Price per Unit (₹)"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g., 50"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  required
                />
                <Input
                  label="Expiry Date & Time"
                  type="datetime-local"
                  value={expiryDate}
                  min={minExpiry}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Location / Pickup Address"
                placeholder="e.g., 123 MG Road, Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <Textarea
                label="Hygiene Notes"
                placeholder="Describe preparation hygiene, storage conditions..."
                value={hygieneNotes}
                onChange={(e) => setHygieneNotes(e.target.value)}
              />

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="primary">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1 cursor-pointer">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag (e.g., vegetarian)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg" icon={<Save size={16} />}>
                Publish Listing
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
