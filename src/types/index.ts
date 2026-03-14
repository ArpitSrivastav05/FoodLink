// ========================
// FoodLink — TypeScript Types
// ========================

export type UserRole = 'donor' | 'acceptor' | 'admin';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  rating: number;
  totalOrders: number;
  blocked: boolean;
  createdAt: number;
}

export type ListingStatus = 'active' | 'reserved' | 'expired' | 'removed';

export interface FoodListing {
  id: string;
  donorId: string;
  donorName: string;
  title: string;
  description: string;
  tags: string[];
  quantity: number;
  unit: string;
  originalQuantity: number;
  pricePerUnit: number;
  expiryDate: number; // timestamp
  hygieneNotes: string;
  imageUrl?: string;
  status: ListingStatus;
  location: string;
  createdAt: number;
}

export type OrderStatus = 'pending' | 'reserved' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'online';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Order {
  id: string;
  listingId: string;
  listingTitle: string;
  donorId: string;
  donorName: string;
  acceptorId: string;
  acceptorName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  platformFee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  timeline: OrderTimelineEntry[];
  createdAt: number;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  timestamp: number;
  note?: string;
}

export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalOrders: number;
  completedOrders: number;
  foodSavedKg: number;
  mealsDelivered: number;
  revenue: number;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'order' | 'listing' | 'system';
  read: boolean;
  createdAt: number;
}
