/**
 * Deterministic test data.
 *
 * The app is fully functional offline: DataContext falls back to localStorage
 * whenever Firestore is unreachable, and AuthContext falls back to
 * `a2zee_current_user`. Seeding those keys before the SPA boots gives every
 * test a known state without touching the real Firebase project.
 */
import { IDENTITIES } from '../config.js';

const now = '2025-06-01T09:00:00.000Z';

export const PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Organic Sunflower Microgreens',
    description:
      'Fresh, nutrient-rich sunflower microgreens packed with vitamins and minerals. Perfect for salads and garnishes.',
    price: 149,
    category: 'Microgreens',
    stock: 50,
    sellerId: 'e2e-seller-001',
    sellerName: 'E2E Seller',
    imageUrl: '/sunflower.png',
    nutritionalInfo: 'Rich in Vitamin E, protein, and healthy fats',
    status: 'approved',
    featured: true,
    createdAt: now,
  },
  {
    id: 'prod-002',
    name: 'Radish Microgreens',
    description: 'Spicy and crunchy radish microgreens, perfect for adding a kick to your dishes.',
    price: 129,
    category: 'Microgreens',
    stock: 40,
    sellerId: 'e2e-seller-001',
    sellerName: 'E2E Seller',
    imageUrl: '/radish.png',
    nutritionalInfo: 'High in Vitamin C and antioxidants',
    status: 'approved',
    featured: true,
    createdAt: '2025-05-28T09:00:00.000Z',
  },
  {
    id: 'prod-003',
    name: 'Broccoli Microgreens',
    description: 'Mild and nutritious broccoli microgreens. A superfood for your daily diet.',
    price: 159,
    category: 'Microgreens',
    stock: 35,
    sellerId: 'e2e-seller-001',
    sellerName: 'E2E Seller',
    imageUrl: '/pea_shoots.png',
    nutritionalInfo: 'Packed with sulforaphane and fiber',
    status: 'approved',
    featured: false,
    createdAt: '2025-05-20T09:00:00.000Z',
  },
  {
    id: 'prod-004',
    name: 'Organic Seed Mix - 50g',
    description: 'Premium organic seed mix for growing your own microgreens at home.',
    price: 199,
    category: 'Seeds',
    stock: 100,
    sellerId: 'e2e-seller-001',
    sellerName: 'E2E Seller',
    imageUrl: '/chia.png',
    status: 'approved',
    featured: false,
    createdAt: '2025-05-18T09:00:00.000Z',
  },
  {
    id: 'prod-005',
    name: 'Complete Grow Kit',
    description: 'Everything you need to start growing microgreens. Includes seeds, tray, and soil.',
    price: 499,
    category: 'Grow Kits',
    stock: 25,
    sellerId: 'e2e-admin-001',
    sellerName: 'A2ZEE Farms',
    imageUrl: '/microgreens_box.png',
    status: 'approved',
    featured: true,
    createdAt: '2025-05-15T09:00:00.000Z',
  },
  {
    id: 'prod-006',
    name: 'Spray Bottle - 500ml',
    description: 'Fine mist spray bottle perfect for watering microgreens.',
    price: 99,
    category: 'Accessories',
    stock: 8,
    sellerId: 'e2e-admin-001',
    sellerName: 'A2ZEE Farms',
    imageUrl: '/microgreens_tray.png',
    status: 'approved',
    featured: false,
    createdAt: '2025-05-10T09:00:00.000Z',
  },
  {
    id: 'prod-007',
    name: 'Pending Kale Microgreens',
    description: 'Awaiting admin approval before it becomes visible to buyers.',
    price: 139,
    category: 'Microgreens',
    stock: 20,
    sellerId: 'e2e-seller-001',
    sellerName: 'E2E Seller',
    imageUrl: '/lettuce.png',
    status: 'pending',
    featured: false,
    createdAt: '2025-06-02T09:00:00.000Z',
  },
  {
    id: 'prod-009',
    name: 'Pending Lettuce Microgreens',
    description: 'Second pending product used by the admin rejection flow.',
    price: 109,
    category: 'Microgreens',
    stock: 30,
    sellerId: 'e2e-seller-001',
    sellerName: 'E2E Seller',
    imageUrl: '/lettuce.png',
    status: 'pending',
    featured: false,
    createdAt: '2025-06-04T09:00:00.000Z',
  },
  {
    id: 'prod-008',
    name: 'Rejected Beetroot Microgreens',
    description: 'Rejected in moderation, kept for the admin product control screen.',
    price: 119,
    category: 'Microgreens',
    stock: 12,
    sellerId: 'e2e-seller-001',
    sellerName: 'E2E Seller',
    imageUrl: '/Beetroot.png',
    status: 'rejected',
    featured: false,
    createdAt: '2025-06-03T09:00:00.000Z',
  },
];

export const USERS = [
  IDENTITIES.buyer.user,
  IDENTITIES.seller.user,
  IDENTITIES.admin.user,
  IDENTITIES.superadmin.user,
  {
    uid: 'e2e-other-buyer-001',
    name: 'Other Buyer',
    email: 'other.buyer@a2zee.test',
    role: 'buyer',
    status: 'active',
    createdAt: '2025-03-01T10:00:00.000Z',
  },
  {
    uid: 'e2e-pending-seller-001',
    name: 'Pending Seller',
    email: 'pending.seller@a2zee.test',
    role: 'seller',
    status: 'pending',
    createdAt: '2025-03-02T10:00:00.000Z',
  },
  {
    uid: 'e2e-blocked-buyer-001',
    name: 'Blocked Buyer',
    email: 'blocked.buyer@a2zee.test',
    role: 'buyer',
    status: 'blocked',
    createdAt: '2025-03-03T10:00:00.000Z',
  },
];

const address = (name, city = 'Chennai') => ({
  id: 'addr-001',
  userId: 'e2e-buyer-001',
  name,
  phone: '9876543210',
  line1: '12, Green Garden Street',
  line2: 'Anna Nagar',
  city,
  state: 'Tamil Nadu',
  pincode: '600040',
  isDefault: true,
});

const orderItem = (product, quantity = 1) => ({
  productId: product.id,
  productName: product.name,
  price: product.price,
  quantity,
  imageUrl: product.imageUrl,
});

export const ORDERS = [
  {
    id: 'ORD-E2E-001',
    userId: 'e2e-buyer-001',
    userName: 'E2E Buyer',
    userEmail: 'e2e.buyer@a2zee.test',
    userPhone: '9876543210',
    items: [orderItem(PRODUCTS[0], 2)],
    totalAmount: 298,
    address: address('E2E Buyer'),
    status: 'delivered',
    paymentMethod: 'cod',
    paymentStatus: 'completed',
    sellerId: 'e2e-seller-001',
    orderSource: 'app',
    createdAt: '2025-05-25T11:30:00.000Z',
    updatedAt: '2025-05-27T16:00:00.000Z',
  },
  {
    id: 'ORD-E2E-002',
    userId: 'e2e-buyer-001',
    userName: 'E2E Buyer',
    userEmail: 'e2e.buyer@a2zee.test',
    userPhone: '9876543210',
    items: [orderItem(PRODUCTS[2], 2), orderItem(PRODUCTS[3], 1)],
    totalAmount: 517,
    address: address('E2E Buyer'),
    status: 'packed',
    paymentMethod: 'razorpay',
    paymentStatus: 'completed',
    sellerId: 'e2e-seller-001',
    orderSource: 'app',
    createdAt: '2025-05-29T10:15:00.000Z',
    updatedAt: '2025-05-30T09:20:00.000Z',
  },
  {
    id: 'ORD-E2E-003',
    userId: 'e2e-buyer-001',
    userName: 'E2E Buyer',
    userEmail: 'e2e.buyer@a2zee.test',
    userPhone: '9876543210',
    items: [orderItem(PRODUCTS[5], 1)],
    totalAmount: 139,
    address: address('E2E Buyer'),
    status: 'pending',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    sellerId: 'e2e-seller-001',
    orderSource: 'whatsapp',
    createdAt: '2025-06-01T08:05:00.000Z',
    updatedAt: '2025-06-01T08:05:00.000Z',
  },
  {
    id: 'ORD-E2E-004',
    userId: 'e2e-other-buyer-001',
    userName: 'Other Buyer',
    userEmail: 'other.buyer@a2zee.test',
    userPhone: '9876500099',
    items: [orderItem(PRODUCTS[4], 1)],
    totalAmount: 499,
    address: address('Other Buyer', 'Coimbatore'),
    status: 'out_for_delivery',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    sellerId: 'e2e-seller-001',
    orderSource: 'app',
    createdAt: '2025-06-02T12:45:00.000Z',
    updatedAt: '2025-06-03T07:10:00.000Z',
  },
  {
    id: 'ORD-E2E-005',
    userId: 'e2e-buyer-001',
    userName: 'E2E Buyer',
    userEmail: 'e2e.buyer@a2zee.test',
    userPhone: '9876543210',
    items: [orderItem(PRODUCTS[1], 1)],
    totalAmount: 129,
    address: address('E2E Buyer'),
    status: 'cancelled',
    paymentMethod: 'razorpay',
    paymentStatus: 'failed',
    sellerId: 'e2e-seller-001',
    orderSource: 'app',
    createdAt: '2025-05-10T15:00:00.000Z',
    updatedAt: '2025-05-11T09:00:00.000Z',
  },
];

export const REVIEWS = [
  {
    id: 'rev-e2e-001',
    userId: 'e2e-buyer-001',
    userName: 'E2E Buyer',
    rating: 5,
    comment: 'The sunflower microgreens were incredibly fresh and crunchy. Delivery was quick!',
    createdAt: '2025-05-26T09:00:00.000Z',
  },
  {
    id: 'rev-e2e-002',
    userId: 'e2e-other-buyer-001',
    userName: 'Other Buyer',
    rating: 4,
    comment: 'Great packaging and the radish greens had a lovely peppery kick.',
    createdAt: '2025-05-27T12:30:00.000Z',
  },
  {
    id: 'rev-e2e-003',
    userId: 'e2e-other-buyer-001',
    userName: 'Other Buyer',
    rating: 5,
    comment: 'Grow kit was simple to use and my kids loved watching the greens sprout.',
    adminReply: {
      replyText: 'Thank you for the kind words! Happy growing from the A2ZEE team.',
      repliedAt: '2025-05-28T10:00:00.000Z',
    },
    createdAt: '2025-05-28T08:00:00.000Z',
  },
];

export const CART_ITEMS = [
  { productId: PRODUCTS[0].id, product: PRODUCTS[0], quantity: 2 },
  { productId: PRODUCTS[3].id, product: PRODUCTS[3], quantity: 1 },
];

/**
 * Builds the JavaScript executed inside the browser before the SPA boots.
 */
export function buildSeedScript({
  identity = 'guest',
  products = PRODUCTS,
  users = USERS,
  orders = ORDERS,
  reviews = REVIEWS,
  cart = [],
} = {}) {
  const user = IDENTITIES[identity]?.user || null;
  const payload = {
    products,
    users,
    orders,
    reviews,
    cart,
    user,
    superadmin: identity === 'superadmin',
  };

  return `
    (function () {
      try {
        var p = ${JSON.stringify(payload)};
        localStorage.setItem('a2zee_products', JSON.stringify(p.products));
        localStorage.setItem('a2zee_users', JSON.stringify(p.users));
        localStorage.setItem('a2zee_orders', JSON.stringify(p.orders));
        localStorage.setItem('a2zee_reviews', JSON.stringify(p.reviews));
        localStorage.setItem('a2zee_cart', JSON.stringify(p.cart));
        if (p.user) {
          localStorage.setItem('a2zee_current_user', JSON.stringify(p.user));
        } else {
          localStorage.removeItem('a2zee_current_user');
        }
        if (p.superadmin) {
          localStorage.setItem('mockSuperAdmin', 'true');
          sessionStorage.setItem('mockSuperAdmin', 'true');
        } else {
          localStorage.removeItem('mockSuperAdmin');
          sessionStorage.removeItem('mockSuperAdmin');
        }
        return true;
      } catch (error) {
        return 'seed-error: ' + error.message;
      }
    })();
  `;
}
