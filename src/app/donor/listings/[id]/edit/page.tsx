'use client';

import React, { useEffect, useState, useRef, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Input, { Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getListing, updateListing } from '@/lib/listings';
import { generateFoodDescription } from '@/lib/gemini';
import type { FoodListing } from '@/types';
import { Sparkles, X, Save, ImagePlus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'plates', label: 'Plates' },
  { value: 'servings', label: 'Servings' },
  { value: 'packets', label: 'Packets' },
  { value: 'liters', label: 'Liters' },
  { value: 'pieces', label: 'Pieces' },
];

function compressImage(file: File, maxSize = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EditListingPage() {
  const { appUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [original, setOriginal] = useState<FoodListing | null>(null);
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    getListing(listingId)
      .then((data) => {
        if (!data) {
          setError('Listing not found.');
          setFetching(false);
          return;
        }
        if (appUser && data.donorId !== appUser.uid) {
          setError('You do not have permission to edit this listing.');
          setFetching(false);
          return;
        }
        setOriginal(data);
        setTitle(data.title);
        setDescription(data.description);
        setQuantity(data.quantity.toString());
        setUnit(data.unit);
        setPricePerUnit(data.pricePerUnit.toString());
        // Convert timestamp to datetime-local format
        const dt = new Date(data.expiryDate);
        const pad = (n: number) => n.toString().padStart(2, '0');
        setExpiryDate(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`);
        setHygieneNotes(data.hygieneNotes || '');
        setLocation(data.location || '');
        setTags(data.tags || []);
        setImagePreview(data.imageUrl || null);
        setFetching(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load listing.');
        setFetching(false);
      });
  }, [listingId, appUser]);

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

  const handleImageSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB.');
      return;
    }
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed);
      setError('');
    } catch {
      setError('Failed to process image.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
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

    if (!appUser || !original) {
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
      await updateListing(listingId, {
        title: title.trim(),
        description: description.trim(),
        tags,
        quantity: qty,
        unit,
        pricePerUnit: price,
        expiryDate: expiry,
        hygieneNotes: hygieneNotes.trim(),
        location: location.trim(),
        imageUrl: imagePreview || undefined,
      });
      router.push('/donor/listings');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update listing.');
    } finally {
      setLoading(false);
    }
  };

  const minExpiry = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!original) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-muted font-medium mb-4">{error || 'Listing not found.'}</p>
          <Link href="/donor/listings">
            <Button variant="outline" icon={<ArrowLeft size={16} />}>Back to Listings</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/donor/listings">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold">Edit Listing</h1>
            <p className="text-sm text-muted mt-0.5">Update your food listing details</p>
          </div>
        </div>

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

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Food Photo</label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border group">
                    <img
                      src={imagePreview}
                      alt="Food preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="bg-white/90 text-danger p-2 rounded-full shadow-lg hover:bg-white transition-colors cursor-pointer"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/90 text-primary p-2 rounded-full shadow-lg hover:bg-white transition-colors ml-2 cursor-pointer"
                      >
                        <ImagePlus size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`
                      border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                      ${dragActive
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : 'border-border hover:border-primary/50 hover:bg-gray-50'
                      }
                    `}
                  >
                    <ImagePlus size={32} className="mx-auto text-muted mb-2" />
                    <p className="text-sm font-medium text-foreground">Click or drag & drop to upload</p>
                    <p className="text-xs text-muted mt-1">JPG, PNG or WebP · Max 10MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                  }}
                />
              </div>

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
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
