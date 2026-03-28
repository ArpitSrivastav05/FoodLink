import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FoodListing, ListingStatus } from '@/types';

const COLLECTION = 'listings';

// ── Validation ───────────────────────────────────────────
export function validateListing(data: Partial<FoodListing>): string | null {
  if (!data.title || data.title.trim().length < 3) return 'Title must be at least 3 characters.';
  if (!data.quantity || data.quantity <= 0) return 'Quantity must be greater than 0.';
  if (!data.pricePerUnit || data.pricePerUnit < 0) return 'Price cannot be negative.';
  if (!data.expiryDate) return 'Expiry date is required.';
  if (data.expiryDate <= Date.now()) return 'Expiry date must be in the future.';
  if (!data.unit) return 'Unit is required.';
  return null;
}

// ── Check for duplicates ────────────────────────────────
export async function checkDuplicateListing(
  donorId: string,
  title: string,
  expiryDate: number
): Promise<boolean> {
  const q = query(
    collection(db, COLLECTION),
    where('donorId', '==', donorId),
    where('title', '==', title),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  return snap.docs.some((d) => {
    const data = d.data();
    // Same title, same donor, expiry within 1 hour → duplicate
    return Math.abs(data.expiryDate - expiryDate) < 3600000;
  });
}

// ── Create ────────────────────────────────────────────────
export async function createListing(
  data: Omit<FoodListing, 'id' | 'status' | 'createdAt' | 'originalQuantity'>
): Promise<string> {
  const error = validateListing(data);
  if (error) throw new Error(error);

  const isDuplicate = await checkDuplicateListing(data.donorId, data.title, data.expiryDate);
  if (isDuplicate) throw new Error('A similar listing already exists. Please update the existing one.');

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    originalQuantity: data.quantity,
    status: 'active' as ListingStatus,
    createdAt: Date.now(),
  });
  return docRef.id;
}

// ── Read ──────────────────────────────────────────────────
export async function getListing(id: string): Promise<FoodListing | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FoodListing;
}

export async function getListingsByDonor(donorId: string): Promise<FoodListing[]> {
  const q = query(
    collection(db, COLLECTION),
    where('donorId', '==', donorId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FoodListing));
}

export async function getActiveListings(): Promise<FoodListing[]> {
  const q = query(
    collection(db, COLLECTION),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  const now = Date.now();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as FoodListing))
    .filter((listing) => {
      // Auto-expire
      if (listing.expiryDate <= now) {
        updateDoc(doc(db, COLLECTION, listing.id), { status: 'expired' });
        return false;
      }
      return true;
    });
}

export async function getAllListings(): Promise<FoodListing[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FoodListing));
}

// ── Real-time listener ──────────────────────────────────
export function subscribeToListings(
  callback: (listings: FoodListing[]) => void,
  filterDonorId?: string,
  onError?: (error: Error) => void
): Unsubscribe {
  const constraints = filterDonorId
    ? [where('donorId', '==', filterDonorId), orderBy('createdAt', 'desc')]
    : [where('status', '==', 'active'), orderBy('createdAt', 'desc')];

  const q = query(collection(db, COLLECTION), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const now = Date.now();
      let listings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FoodListing));
      // For acceptor view (no donorId filter), auto-expire and filter out expired listings
      if (!filterDonorId) {
        listings = listings.filter((listing) => {
          if (listing.expiryDate <= now) {
            updateDoc(doc(db, COLLECTION, listing.id), { status: 'expired' });
            return false;
          }
          return true;
        });
      }
      callback(listings);
    },
    (error) => {
      console.error('Firestore listener error:', error);
      if (onError) onError(error);
    }
  );
}

// ── Update ────────────────────────────────────────────────
export async function updateListing(id: string, data: Partial<FoodListing>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function reduceListingQuantity(id: string, amount: number): Promise<void> {
  const listing = await getListing(id);
  if (!listing) throw new Error('Listing not found.');
  const newQty = listing.quantity - amount;
  if (newQty < 0) throw new Error('Insufficient quantity available.');
  await updateDoc(doc(db, COLLECTION, id), {
    quantity: newQty,
    status: newQty === 0 ? 'reserved' : 'active',
  });
}

// ── Delete ────────────────────────────────────────────────
export async function removeListing(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { status: 'removed' });
}

// ── Auto-expire check ─────────────────────────────────────
export async function autoExpireListings(): Promise<number> {
  const q = query(collection(db, COLLECTION), where('status', '==', 'active'));
  const snap = await getDocs(q);
  const now = Date.now();
  let count = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if (data.expiryDate <= now) {
      await updateDoc(doc(db, COLLECTION, d.id), { status: 'expired' });
      count++;
    }
  }
  return count;
}
