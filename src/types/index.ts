export type UserRole = 'buyer' | 'seller' | 'admin' | 'superadmin';

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'pending' | 'blocked';
  createdAt: string;
  photoURL?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sellerId: string;
  sellerName: string;
  imageUrl: string;
  nutritionalInfo?: string;
  status: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  items: OrderItem[];
  totalAmount: number;
  address: Address;
  status: OrderStatus;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'completed' | 'failed';
  sellerId?: string;
  userEmail?: string;
  orderSource?: 'app' | 'whatsapp' | 'offline';
  processingDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  productCount: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minOrder: number;
  maxDiscount?: number;
  validUntil: string;
  isActive: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  adminReply?: {
    replyText: string;
    repliedAt: string;
  };
}

export interface CatalogueProduct {
  id: string;
  name: string;
  tamilName: string;
  subtitle: string;
  description: string;
  keyNutrients: string[];
  prices: {
    "50g"?: number;
    "100g"?: number;
    "500g"?: number;
    "1kg"?: number;
  };
  rangeId: string;
  image: string;
}

export interface CuratedBox {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  items: string[];
  price: number;
  color: string;
  includesLabel?: string;
}

