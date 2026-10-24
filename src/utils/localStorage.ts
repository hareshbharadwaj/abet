import { User, Product, CartItem, Order, Review } from '../types';

const STORAGE_KEYS = {
  USERS: 'a2zee_users',
  PRODUCTS: 'a2zee_products',
  CART: 'a2zee_cart',
  ORDERS: 'a2zee_orders',
  CURRENT_USER: 'a2zee_current_user',
  REVIEWS: 'a2zee_reviews',
} as const;

// Generic localStorage functions
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Specific storage functions
export const userStorage = {
  getUsers: (): User[] => storage.get<User[]>(STORAGE_KEYS.USERS, []),
  setUsers: (users: User[]) => storage.set(STORAGE_KEYS.USERS, users),
  getCurrentUser: (): User | null => storage.get<User | null>(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user: User) => storage.set(STORAGE_KEYS.CURRENT_USER, user),
  clearCurrentUser: () => storage.remove(STORAGE_KEYS.CURRENT_USER),
};

export const productStorage = {
  getProducts: (): Product[] => storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, []),
  setProducts: (products: Product[]) => storage.set(STORAGE_KEYS.PRODUCTS, products),
};

export const cartStorage = {
  getCart: (): CartItem[] => storage.get<CartItem[]>(STORAGE_KEYS.CART, []),
  setCart: (cart: CartItem[]) => storage.set(STORAGE_KEYS.CART, cart),
  clearCart: () => storage.set(STORAGE_KEYS.CART, []),
};

export const orderStorage = {
  getOrders: (): Order[] => storage.get<Order[]>(STORAGE_KEYS.ORDERS, []),
  setOrders: (orders: Order[]) => storage.set(STORAGE_KEYS.ORDERS, orders),
};

export const reviewStorage = {
  getReviews: (): Review[] => storage.get<Review[]>(STORAGE_KEYS.REVIEWS, []),
  setReviews: (reviews: Review[]) => storage.set(STORAGE_KEYS.REVIEWS, reviews),
};

// Initialize with demo data if empty
export const initializeStorage = () => {
  const users = userStorage.getUsers();
  if (users.length === 0) {
    // Create default admin user
    const defaultUsers: User[] = [
      {
        uid: 'admin-001',
        name: 'Admin User',
        email: 'admin@a2zee.com',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ];
    userStorage.setUsers(defaultUsers);
  }

  const products = productStorage.getProducts();
  if (products.length === 0) {
    // Add demo products
    const demoProducts: Product[] = [
      {
        id: 'prod-001',
        name: 'Organic Sunflower Microgreens',
        description: 'Fresh, nutrient-rich sunflower microgreens packed with vitamins and minerals. Perfect for salads and garnishes.',
        price: 149,
        category: 'Microgreens',
        stock: 50,
        sellerId: 'admin-001',
        sellerName: 'A2ZEE Farms',
        imageUrl: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800',
        nutritionalInfo: 'Rich in Vitamin E, protein, and healthy fats',
        status: 'approved',
        featured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-002',
        name: 'Radish Microgreens',
        description: 'Spicy and crunchy radish microgreens, perfect for adding a kick to your dishes.',
        price: 129,
        category: 'Microgreens',
        stock: 40,
        sellerId: 'admin-001',
        sellerName: 'A2ZEE Farms',
        imageUrl: 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=800',
        nutritionalInfo: 'High in Vitamin C and antioxidants',
        status: 'approved',
        featured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-003',
        name: 'Broccoli Microgreens',
        description: 'Mild and nutritious broccoli microgreens. Superfood for your daily diet.',
        price: 159,
        category: 'Microgreens',
        stock: 35,
        sellerId: 'admin-001',
        sellerName: 'A2ZEE Farms',
        imageUrl: 'https://images.unsplash.com/photo-1628773822990-202a85eba372?w=800',
        nutritionalInfo: 'Packed with sulforaphane and fiber',
        status: 'approved',
        featured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-004',
        name: 'Organic Seed Mix - 50g',
        description: 'Premium organic seed mix for growing your own microgreens at home.',
        price: 199,
        category: 'Seeds',
        stock: 100,
        sellerId: 'admin-001',
        sellerName: 'A2ZEE Farms',
        imageUrl: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=800',
        status: 'approved',
        featured: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-005',
        name: 'Complete Grow Kit',
        description: 'Everything you need to start growing microgreens. Includes seeds, tray, and soil.',
        price: 499,
        category: 'Grow Kits',
        stock: 25,
        sellerId: 'admin-001',
        sellerName: 'A2ZEE Farms',
        imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
        status: 'approved',
        featured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-006',
        name: 'Spray Bottle - 500ml',
        description: 'Fine mist spray bottle perfect for watering microgreens.',
        price: 99,
        category: 'Accessories',
        stock: 60,
        sellerId: 'admin-001',
        sellerName: 'A2ZEE Farms',
        imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800',
        status: 'approved',
        featured: false,
        createdAt: new Date().toISOString(),
      },
    ];
    productStorage.setProducts(demoProducts);
  }

  const reviews = reviewStorage.getReviews();
  const filteredReviews = reviews.filter((r) => !['rev-001', 'rev-002', 'rev-003'].includes(r.id));
  if (reviews.length !== filteredReviews.length) {
    reviewStorage.setReviews(filteredReviews);
  }
};
