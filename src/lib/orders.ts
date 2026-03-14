import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { reduceListingQuantity, getListing } from '@/lib/listings';
import type { Order, OrderStatus, OrderTimelineEntry } from '@/types';

const COLLECTION = 'orders';
const PLATFORM_FEE_RATE = 0.10; // 10% platform fee

// ── Validation ───────────────────────────────────────────
export function validateOrder(data: { quantity: number; listingId: string }): string | null {
  if (!data.listingId) return 'Listing ID is required.';
  if (!data.quantity || data.quantity <= 0) return 'Quantity must be greater than 0.';
  return null;
}

// ── Duplicate check ──────────────────────────────────────
async function checkDuplicateOrder(acceptorId: string, listingId: string): Promise<boolean> {
  const q = query(
    collection(db, COLLECTION),
    where('acceptorId', '==', acceptorId),
    where('listingId', '==', listingId),
    where('orderStatus', 'in', ['pending', 'reserved'])
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

// ── Create ────────────────────────────────────────────────
export async function createOrder(data: {
  listingId: string;
  acceptorId: string;
  acceptorName: string;
  quantity: number;
  paymentMethod: 'cash' | 'upi' | 'online';
}): Promise<string> {
  const error = validateOrder(data);
  if (error) throw new Error(error);

  // Check listing exists and is active
  const listing = await getListing(data.listingId);
  if (!listing) throw new Error('Listing not found.');
  if (listing.status !== 'active') throw new Error('This listing is no longer available.');
  if (listing.expiryDate <= Date.now()) throw new Error('This listing has expired.');
  if (listing.quantity < data.quantity) throw new Error(`Only ${listing.quantity} ${listing.unit} available.`);

  // Check duplicate
  const isDuplicate = await checkDuplicateOrder(data.acceptorId, data.listingId);
  if (isDuplicate) throw new Error('You already have a pending order for this listing.');

  // Calculate price
  const totalPrice = data.quantity * listing.pricePerUnit;
  const platformFee = Math.round(totalPrice * PLATFORM_FEE_RATE * 100) / 100;

  const timeline: OrderTimelineEntry[] = [
    { status: 'pending', timestamp: Date.now(), note: 'Order placed' },
  ];

  const order: Omit<Order, 'id'> = {
    listingId: data.listingId,
    listingTitle: listing.title,
    donorId: listing.donorId,
    donorName: listing.donorName,
    acceptorId: data.acceptorId,
    acceptorName: data.acceptorName,
    quantity: data.quantity,
    pricePerUnit: listing.pricePerUnit,
    totalPrice,
    platformFee,
    paymentMethod: data.paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'pending',
    timeline,
    createdAt: Date.now(),
  };

  // Reduce listing quantity
  await reduceListingQuantity(data.listingId, data.quantity);

  const docRef = await addDoc(collection(db, COLLECTION), order);
  return docRef.id;
}

// ── Read ──────────────────────────────────────────────────
export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Order;
}

export async function getOrdersByAcceptor(acceptorId: string): Promise<Order[]> {
  const q = query(
    collection(db, COLLECTION),
    where('acceptorId', '==', acceptorId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}

export async function getOrdersByDonor(donorId: string): Promise<Order[]> {
  const q = query(
    collection(db, COLLECTION),
    where('donorId', '==', donorId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}

export async function getAllOrders(): Promise<Order[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}

// ── Real-time ─────────────────────────────────────────────
export function subscribeToOrders(
  callback: (orders: Order[]) => void,
  userId: string,
  role: 'donor' | 'acceptor'
): Unsubscribe {
  const field = role === 'donor' ? 'donorId' : 'acceptorId';
  const q = query(
    collection(db, COLLECTION),
    where(field, '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    callback(orders);
  });
}

// ── Update status ─────────────────────────────────────────
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string
): Promise<void> {
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');

  const entry: OrderTimelineEntry = { status, timestamp: Date.now(), note };
  const timeline = [...order.timeline, entry];

  const update: Record<string, unknown> = { orderStatus: status, timeline };

  if (status === 'completed') {
    update.paymentStatus = 'completed';
  }
  if (status === 'cancelled') {
    update.paymentStatus = 'refunded';
    // Restore listing quantity
    const listing = await getListing(order.listingId);
    if (listing && listing.status !== 'expired') {
      await updateDoc(doc(db, 'listings', order.listingId), {
        quantity: listing.quantity + order.quantity,
        status: 'active',
      });
    }
  }

  await updateDoc(doc(db, COLLECTION, orderId), update);
}
