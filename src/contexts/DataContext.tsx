import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartStorage, productStorage, orderStorage, reviewStorage } from '../utils/localStorage';
import { Product, CartItem, Order, OrderItem, Address, OrderStatus, Review, CatalogueProduct, CuratedBox } from '../types';
import { products as defaultCatalogueProducts, curatedBoxes as defaultCuratedBoxes } from '../app/components/catalogueData';
import { useAuth } from './AuthContext';
import { firestore } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  orderBy,
  Timestamp,
  runTransaction,
  where,
  getDoc
} from 'firebase/firestore';
import { sendOrderEmail, sendOrderStatusEmail } from '../utils/emailService';

interface DataContextType {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getProductsBySeller: (sellerId: string) => Product[];

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;

  // Orders
  orders: Order[];
  createOrder: (items: CartItem[], address: Address, paymentMethod: 'razorpay' | 'cod') => Promise<Order>;
  createGuestOrder: (
    items: OrderItem[],
    address: Omit<Address, 'id' | 'userId' | 'isDefault'>,
    guestDetails: { name: string; email: string; phone: string },
    paymentMethod: 'cod' | 'razorpay',
    orderSource?: 'whatsapp' | 'app' | 'offline',
    paymentStatus?: 'pending' | 'completed' | 'failed',
    orderStatus?: OrderStatus,
    processingDate?: string
  ) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrderProcessingDate: (orderId: string, processingDate: string) => Promise<void>;
  updateOrderPaymentMethod: (orderId: string, paymentMethod: 'cod' | 'razorpay') => Promise<void>;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: 'pending' | 'completed' | 'failed') => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByUser: (userId: string) => Order[];
  getOrdersBySeller: (sellerId: string) => Order[];
  getAllOrders: () => Order[];

  // Reviews
  reviews: Review[];
  addReview: (rating: number, comment: string, customUserName?: string) => Promise<Review>;
  replyToReview: (reviewId: string, replyText: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;

  // Landing Page Catalogue & Wellness Boxes (Firestore Native)
  catalogueProducts: CatalogueProduct[];
  curatedBoxes: CuratedBox[];
  updateCatalogueProduct: (id: string, updates: Partial<CatalogueProduct>) => Promise<void>;
  addCatalogueProduct: (product: CatalogueProduct) => Promise<void>;
  deleteCatalogueProduct: (id: string) => Promise<void>;
  updateCuratedBox: (id: string, updates: Partial<CuratedBox>) => Promise<void>;
  addCuratedBox: (box: CuratedBox) => Promise<void>;
  deleteCuratedBox: (id: string) => Promise<void>;
  resetCatalogueToDefaults: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

const dedupeOrders = (orderList: Order[]): Order[] => {
  const map = new Map<string, Order>();
  orderList.forEach(o => {
    if (o && o.id) {
      map.set(o.id, o);
    }
  });
  return Array.from(map.values());
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [catalogueProducts, setCatalogueProducts] = useState<CatalogueProduct[]>(defaultCatalogueProducts);
  const [curatedBoxes, setCuratedBoxes] = useState<CuratedBox[]>(defaultCuratedBoxes);

  // Sync Catalogue Products from Firestore
  useEffect(() => {
    const q = query(collection(firestore, 'catalogue_products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed default catalogue products to Firestore
        defaultCatalogueProducts.forEach((p) => {
          setDoc(doc(firestore, 'catalogue_products', p.id), p).catch(err => console.error("Auto-seed error:", err));
        });
        setCatalogueProducts(defaultCatalogueProducts);
      } else {
        const prods: CatalogueProduct[] = [];
        snapshot.forEach((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() } as CatalogueProduct;
          if (data.id === 'mc-01' && (data.image.includes(' ') || data.image === '/green_gram.png' || data.image === '/Green Gram.png')) {
            data.image = '/greengram.png';
            setDoc(doc(firestore, 'catalogue_products', 'mc-01'), { image: '/greengram.png' }, { merge: true }).catch(err => console.error(err));
          }
          if (data.id === 'mc-02' && (data.image.includes(' ') || data.image === '/Black Gram.png')) {
            data.image = '/blackgram.png';
            setDoc(doc(firestore, 'catalogue_products', 'mc-02'), { image: '/blackgram.png' }, { merge: true }).catch(err => console.error(err));
          }
          prods.push(data);
        });
        prods.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        setCatalogueProducts(prods);
      }
    }, (error) => {
      console.error("Error listening to catalogue_products:", error);
    });

    return () => unsubscribe();
  }, []);

  // Sync Curated Boxes from Firestore
  useEffect(() => {
    const q = query(collection(firestore, 'curated_boxes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed default curated boxes to Firestore
        defaultCuratedBoxes.forEach((b) => {
          setDoc(doc(firestore, 'curated_boxes', b.id), b).catch(err => console.error("Auto-seed error:", err));
        });
        setCuratedBoxes(defaultCuratedBoxes);
      } else {
        const boxes: CuratedBox[] = [];
        snapshot.forEach((doc) => {
          boxes.push({ id: doc.id, ...doc.data() } as CuratedBox);
        });
        boxes.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        setCuratedBoxes(boxes);
      }
    }, (error) => {
      console.error("Error listening to curated_boxes:", error);
    });

    return () => unsubscribe();
  }, []);

  // Load products, orders, and reviews from localStorage on mount as initial state
  useEffect(() => {
    const localProds = productStorage.getProducts();
    if (localProds.length > 0) {
      setProducts(localProds);
    }
    const localOrders = dedupeOrders(orderStorage.getOrders());
    if (localOrders.length > 0) {
      setOrders(localOrders);
      orderStorage.setOrders(localOrders);
    }
    const localReviews = reviewStorage.getReviews().filter((r: Review) => !['rev-001', 'rev-002', 'rev-003'].includes(r.id));
    if (localReviews.length > 0) {
      setReviews(localReviews);
    }
  }, []);

  // Sync Products from Firestore
  useEffect(() => {
    const q = query(collection(firestore, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        prods.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt 
        } as Product);
      });
      setProducts(prods);
      productStorage.setProducts(prods);
    }, (error) => {
      console.error("Error fetching products:", error);
      const fallbackProducts = productStorage.getProducts();
      setProducts(fallbackProducts);
    });

    return () => unsubscribe();
  }, []);

  // Sync Orders from Firestore
  useEffect(() => {
    const q = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordsMap = new Map<string, Order>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        ordsMap.set(doc.id, { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt 
        } as Order);
      });
      const ords = Array.from(ordsMap.values());
      const localOrders = dedupeOrders(orderStorage.getOrders());
      const mergedOrders = dedupeOrders([...ords, ...localOrders]);
      setOrders(mergedOrders);
      orderStorage.setOrders(mergedOrders);
    }, (error) => {
      console.error("Error fetching orders:", error);
      const fallbackOrders = dedupeOrders(orderStorage.getOrders());
      setOrders(fallbackOrders);
    });

    return () => unsubscribe();
  }, []);

  // Sync Reviews from Firestore
  useEffect(() => {
    const q = query(collection(firestore, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreRevs: Review[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        firestoreRevs.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          adminReply: data.adminReply ? {
            replyText: data.adminReply.replyText,
            repliedAt: data.adminReply.repliedAt instanceof Timestamp ? data.adminReply.repliedAt.toDate().toISOString() : data.adminReply.repliedAt
          } : undefined
        } as Review);
      });

      // Merge Firestore reviews with local reviews from localStorage
      const localRevs = reviewStorage.getReviews().filter((r: Review) => !['rev-001', 'rev-002', 'rev-003'].includes(r.id));
      const combinedMap = new Map<string, Review>();
      
      localRevs.forEach((r: Review) => combinedMap.set(r.id, r));
      firestoreRevs.filter((r: Review) => !['rev-001', 'rev-002', 'rev-003'].includes(r.id)).forEach((r: Review) => combinedMap.set(r.id, r));

      const mergedList = Array.from(combinedMap.values()).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setReviews(mergedList);
      reviewStorage.setReviews(mergedList);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      const fallbackReviews = reviewStorage.getReviews().filter((r: Review) => !['rev-001', 'rev-002', 'rev-003'].includes(r.id));
      setReviews(fallbackReviews);
    });

    return () => unsubscribe();
  }, []);

  // Product functions
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    const newProductId = `prod-${Date.now()}`;
    const newProduct = {
      ...productData,
      id: newProductId,
      createdAt: Timestamp.now(),
    };

    try {
      await setDoc(doc(firestore, 'products', newProductId), newProduct);
    } catch (error) {
      console.error("Firebase addProduct failed, writing to localStorage:", error);
    }

    const productToSave = { 
      ...productData, 
      id: newProductId, 
      createdAt: new Date().toISOString() 
    } as Product;
    
    const localProds = productStorage.getProducts();
    productStorage.setProducts([productToSave, ...localProds]);
    setProducts(prev => [productToSave, ...prev]);

    return productToSave;
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
    try {
      const productRef = doc(firestore, 'products', id);
      await updateDoc(productRef, updates as any);
    } catch (error) {
      console.error("Firebase updateProduct failed, writing to localStorage:", error);
    }

    const localProds = productStorage.getProducts();
    const updatedLocal = localProds.map((p: any) => p.id === id ? { ...p, ...updates } : p);
    productStorage.setProducts(updatedLocal);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(firestore, 'products', id));
    } catch (error) {
      console.error("Firebase deleteProduct failed, writing to localStorage:", error);
    }

    const localProds = productStorage.getProducts();
    const updatedLocal = localProds.filter((p: any) => p.id !== id);
    productStorage.setProducts(updatedLocal);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find(p => p.id === id);
  };

  const getProductsBySeller = (sellerId: string): Product[] => {
    return products.filter(p => p.sellerId === sellerId);
  };

  // Cart functions
  const addToCart = (product: Product, quantity: number): void => {
    const existingItem = cart.find(item => item.productId === product.id);

    let updatedCart: CartItem[];
    if (existingItem) {
      updatedCart = cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      updatedCart = [...cart, { productId: product.id, product, quantity }];
    }

    setCart(updatedCart);
    cartStorage.setCart(updatedCart);
  };

  const removeFromCart = (productId: string): void => {
    const updatedCart = cart.filter(item => item.productId !== productId);
    setCart(updatedCart);
    cartStorage.setCart(updatedCart);
  };

  const updateCartQuantity = (productId: string, quantity: number): void => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setCart(updatedCart);
    cartStorage.setCart(updatedCart);
  };

  const clearCart = (): void => {
    setCart([]);
    cartStorage.clearCart();
  };

  const getCartTotal = (): number => {
    return cart.reduce(
      (total, item) => total + Number(item.product.price) * Math.max(1, Number(item.quantity)),
      0
    );
  };

  // Order functions
  const createOrder = async (items: CartItem[], address: Address, paymentMethod: 'razorpay' | 'cod'): Promise<Order> => {
    if (!user) {
      throw new Error('User must be logged in to create order');
    }

    // Normalise the delivery address once: trim every field and clamp lengths
    // so persisted orders never carry padded or oversized user input.
    const safeAddress: Address = {
      name: String(address.name || '').trim().slice(0, 80),
      phone: String(address.phone || '').replace(/[^0-9+]/g, '').slice(0, 15),
      line1: String(address.line1 || '').trim().slice(0, 120),
      line2: String(address.line2 || '').trim().slice(0, 120),
      city: String(address.city || '').trim().slice(0, 60),
      state: String(address.state || '').trim().slice(0, 60),
      pincode: String(address.pincode || '').replace(/[^0-9]/g, '').slice(0, 6),
    };
    if (!safeAddress.name || !safeAddress.line1 || !safeAddress.city || !safeAddress.pincode) {
      throw new Error('A complete delivery address is required');
    }

    // Group items by sellerId to match "Unique Seller" requirement
    const itemsBySeller: Record<string, CartItem[]> = {};
    items.forEach(item => {
      const sellerId = item.product.sellerId;
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      itemsBySeller[sellerId].push(item);
    });

    const sellerIds = Object.keys(itemsBySeller);
    let firstOrder: Order | null = null;
    const now = Timestamp.now();
    const updatedAtStr = now.toDate().toString();

    for (const sellerId of sellerIds) {
      const sellerItems = itemsBySeller[sellerId];
      const orderItems: OrderItem[] = sellerItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        price: Number(item.product.price),
        quantity: Number(item.quantity),
        imageUrl: item.product.imageUrl,
      }));

      const subtotal = sellerItems.reduce(
        (sum, item) => sum + Number(item.product.price) * Number(item.quantity),
        0
      );
      // Android threshold is 199
      const deliveryFee = 0;
      const totalAmount = subtotal;

      const orderId = `order-${Date.now()}-${sellerId.slice(0, 4)}`;
      
      const orderData = {
        id: orderId,
        userId: user.uid,
        userName: user.name,
        userPhone: user.phone || safeAddress.phone,
        userEmail: user.email,
        orderSource: 'app' as const,
        items: orderItems,
        totalAmount,
        address: safeAddress,
        status: 'pending',
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
        sellerId: sellerId,
        createdAt: now,
        updatedAt: updatedAtStr,
      };

      try {
        // Use transaction for stock update to match Android behavior
        await runTransaction(firestore, async (transaction) => {
          // 1. Create order
          transaction.set(doc(firestore, 'orders', orderId), orderData);

          // 2. Update stock for each item
          for (const item of sellerItems) {
            const productRef = doc(firestore, 'products', item.productId);
            const productSnap = await transaction.get(productRef);
            if (productSnap.exists()) {
              const currentStock = productSnap.data().stock || 0;
              transaction.update(productRef, { stock: Math.max(0, currentStock - item.quantity) });
            }
          }

          // 3. Send notification to seller
          const notifRef = doc(collection(firestore, 'notifications'));
          transaction.set(notifRef, {
            id: notifRef.id,
            userId: sellerId,
            title: "New Order Received",
            message: `You have received a new order for ₹${Math.round(totalAmount)}.`,
            type: "order",
            isRead: false,
            createdAt: now
          });
        });
      } catch (error) {
        console.error("Firebase createOrder transaction failed, falling back to localStorage:", error);
      }

      const orderToSave = {
        ...orderData,
        createdAt: new Date().toISOString(),
      } as any;

      const localOrders = dedupeOrders(orderStorage.getOrders());
      const updatedLocalOrders = dedupeOrders([orderToSave, ...localOrders]);
      orderStorage.setOrders(updatedLocalOrders);
      setOrders(prev => dedupeOrders([orderToSave, ...prev]));

      // Update product stocks locally as well
      const localProds = productStorage.getProducts();
      const updatedLocalProds = localProds.map((p: any) => {
        const item = sellerItems.find(si => si.productId === p.id);
        if (item) {
          return { ...p, stock: Math.max(0, (p.stock || 0) - item.quantity) };
        }
        return p;
      });
      productStorage.setProducts(updatedLocalProds);
      setProducts(updatedLocalProds);

      // Send confirmation email
      try {
        await sendOrderEmail(orderToSave);
      } catch (e) {
        console.error("Failed to send order email:", e);
      }

      if (!firstOrder) {
        firstOrder = orderToSave as Order;
      }
    }

    return firstOrder!;
  };

  const createGuestOrder = async (
    items: OrderItem[],
    addressData: Omit<Address, 'id' | 'userId' | 'isDefault'>,
    guestDetails: { name: string; email: string; phone: string },
    paymentMethod: 'cod' | 'razorpay',
    orderSource: 'whatsapp' | 'app' | 'offline' = 'whatsapp',
    paymentStatus?: 'pending' | 'completed' | 'failed',
    orderStatus: OrderStatus = 'pending',
    processingDate?: string
  ): Promise<Order> => {
    const now = Timestamp.now();
    const prefix = orderSource === 'offline' ? 'order-off-' : 'order-wa-';
    const orderId = `${prefix}${Date.now()}`;
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 0;
    const totalAmount = subtotal;
    const finalPaymentStatus = paymentStatus || (paymentMethod === 'cod' ? 'pending' : 'completed');

    const orderData: any = {
      id: orderId,
      userId: 'guest-' + Date.now(),
      userName: guestDetails.name || 'Customer',
      userPhone: guestDetails.phone || '',
      userEmail: guestDetails.email || '',
      orderSource: orderSource || 'whatsapp',
      items: items,
      totalAmount,
      address: {
        id: `address-${Date.now()}`,
        userId: 'guest-' + Date.now(),
        name: addressData.name || guestDetails.name || 'Customer',
        phone: addressData.phone || guestDetails.phone || '',
        line1: addressData.line1 || '',
        line2: addressData.line2 || "",
        city: addressData.city || 'Chennai',
        state: addressData.state || 'Tamil Nadu',
        pincode: addressData.pincode || '600041',
        isDefault: false,
      },
      status: orderStatus,
      paymentMethod,
      paymentStatus: finalPaymentStatus,
      sellerId: 'admin-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (processingDate) {
      orderData.processingDate = processingDate;
    }

    try {
      await setDoc(doc(firestore, 'orders', orderId), orderData);
      
      for (const item of items) {
        const productRef = doc(firestore, 'products', item.productId);
        try {
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const currentStock = productSnap.data().stock || 0;
            await updateDoc(productRef, { stock: Math.max(0, currentStock - item.quantity) });
          }
        } catch (e) {
          console.warn("Could not update product stock in firestore:", e);
        }
      }
    } catch (error) {
      console.error("Firebase createGuestOrder failed, using localStorage fallback:", error);
    }

    const orderToSave = {
      ...orderData,
      createdAt: new Date().toISOString(),
    } as any;

    const localOrders = dedupeOrders(orderStorage.getOrders());
    const updatedLocalOrders = dedupeOrders([orderToSave, ...localOrders]);
    orderStorage.setOrders(updatedLocalOrders);
    setOrders(prev => dedupeOrders([orderToSave, ...prev]));

    // Send confirmation email
    try {
      await sendOrderEmail(orderToSave);
    } catch (e) {
      console.error("Failed to send order email:", e);
    }

    return orderToSave;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    const updatedAt = new Date().toISOString();
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { 
        status, 
        updatedAt 
      });
    } catch (error) {
      console.error("Firebase updateOrderStatus failed, falling back to localStorage:", error);
    }

    const localOrders = orderStorage.getOrders();
    const updatedLocal = localOrders.map((o: any) => o.id === orderId ? { ...o, status, updatedAt } : o);
    orderStorage.setOrders(updatedLocal);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, updatedAt } : o));

    // Automated Email Dispatch to Customer on Order Status Update
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      const updatedOrder = { ...targetOrder, status, updatedAt };
      try {
        await sendOrderStatusEmail(updatedOrder, status);
      } catch (e) {
        console.error("Failed to send status update email to customer:", e);
      }
    }
  };

  const updateOrderProcessingDate = async (orderId: string, processingDate: string): Promise<void> => {
    const updatedAt = new Date().toISOString();
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { 
        processingDate, 
        updatedAt 
      });
    } catch (error) {
      console.error("Firebase updateOrderProcessingDate failed, falling back to localStorage:", error);
    }

    const localOrders = orderStorage.getOrders();
    const updatedLocal = localOrders.map((o: any) => o.id === orderId ? { ...o, processingDate, updatedAt } : o);
    orderStorage.setOrders(updatedLocal);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, processingDate, updatedAt } : o));
  };

  const updateOrderPaymentMethod = async (orderId: string, paymentMethod: 'cod' | 'razorpay'): Promise<void> => {
    const updatedAt = new Date().toISOString();
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { 
        paymentMethod, 
        updatedAt 
      });
    } catch (error) {
      console.error("Firebase updateOrderPaymentMethod failed, falling back to localStorage:", error);
    }

    const localOrders = orderStorage.getOrders();
    const updatedLocal = localOrders.map((o: any) => o.id === orderId ? { ...o, paymentMethod, updatedAt } : o);
    orderStorage.setOrders(updatedLocal);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentMethod, updatedAt } : o));
  };

  const updateOrderPaymentStatus = async (orderId: string, paymentStatus: 'pending' | 'completed' | 'failed'): Promise<void> => {
    const updatedAt = new Date().toISOString();
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { 
        paymentStatus, 
        updatedAt 
      });
    } catch (error) {
      console.error("Firebase updateOrderPaymentStatus failed, falling back to localStorage:", error);
    }

    const localOrders = orderStorage.getOrders();
    const updatedLocal = localOrders.map((o: any) => o.id === orderId ? { ...o, paymentStatus, updatedAt } : o);
    orderStorage.setOrders(updatedLocal);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus, updatedAt } : o));
  };

  const getOrderById = (id: string): Order | undefined => {
    return orders.find(o => o.id === id);
  };

  const getOrdersByUser = (userId: string): Order[] => {
    return dedupeOrders(orders.filter(o => o.userId === userId));
  };

  const getOrdersBySeller = (sellerId: string): Order[] => {
    return dedupeOrders(orders.filter(o => o.sellerId === sellerId));
  };

  const getAllOrders = (): Order[] => {
    return dedupeOrders(orders);
  };

  const addReview = async (rating: number, comment: string, customUserName?: string): Promise<Review> => {
    const reviewId = `rev-${Date.now()}`;
    const authorName = customUserName?.trim() || user?.name || 'Customer';
    const authorUid = user?.uid || 'guest';

    const newReview = {
      id: reviewId,
      userId: authorUid,
      userName: authorName,
      rating,
      comment,
      createdAt: Timestamp.now(),
    };

    try {
      await setDoc(doc(firestore, 'reviews', reviewId), newReview);
    } catch (error) {
      console.warn("Firebase addReview failed, writing to localStorage:", error);
    }

    const reviewToSave: Review = {
      id: reviewId,
      userId: authorUid,
      userName: authorName,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    const localReviews = reviewStorage.getReviews();
    const updatedReviews = [reviewToSave, ...localReviews.filter((r: Review) => r.id !== reviewId)];
    reviewStorage.setReviews(updatedReviews);
    setReviews(updatedReviews);

    return reviewToSave;
  };

  const replyToReview = async (reviewId: string, replyText: string): Promise<void> => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      throw new Error('Only admin can reply to reviews');
    }

    const adminReply = {
      replyText,
      repliedAt: new Date().toISOString(),
    };

    try {
      const reviewRef = doc(firestore, 'reviews', reviewId);
      await updateDoc(reviewRef, { adminReply });
    } catch (error) {
      console.error("Firebase replyToReview failed, updating localStorage:", error);
    }

    const localReviews = reviewStorage.getReviews();
    const updatedReviews = localReviews.map((r: any) => 
      r.id === reviewId ? { ...r, adminReply } : r
    );
    reviewStorage.setReviews(updatedReviews);
    setReviews(updatedReviews);
  };

  const deleteReview = async (reviewId: string): Promise<void> => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      throw new Error('Only admin can delete reviews');
    }

    try {
      await deleteDoc(doc(firestore, 'reviews', reviewId));
    } catch (error) {
      console.error("Firebase deleteReview failed, updating localStorage:", error);
    }

    const localReviews = reviewStorage.getReviews();
    const updatedReviews = localReviews.filter((r: Review) => r.id !== reviewId);
    reviewStorage.setReviews(updatedReviews);
    setReviews(updatedReviews);
  };

  // Catalogue & Curated Box Firestore mutations
  const updateCatalogueProduct = async (id: string, updates: Partial<CatalogueProduct>): Promise<void> => {
    try {
      const docRef = doc(firestore, 'catalogue_products', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating catalogue product in Firestore:", error);
      throw error;
    }
  };

  const addCatalogueProduct = async (product: CatalogueProduct): Promise<void> => {
    try {
      const docRef = doc(firestore, 'catalogue_products', product.id);
      await setDoc(docRef, product);
    } catch (error) {
      console.error("Error adding catalogue product in Firestore:", error);
      throw error;
    }
  };

  const deleteCatalogueProduct = async (id: string): Promise<void> => {
    try {
      const docRef = doc(firestore, 'catalogue_products', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting catalogue product in Firestore:", error);
      throw error;
    }
  };

  const updateCuratedBox = async (id: string, updates: Partial<CuratedBox>): Promise<void> => {
    try {
      const docRef = doc(firestore, 'curated_boxes', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating curated box in Firestore:", error);
      throw error;
    }
  };

  const addCuratedBox = async (box: CuratedBox): Promise<void> => {
    try {
      const docRef = doc(firestore, 'curated_boxes', box.id);
      await setDoc(docRef, box);
    } catch (error) {
      console.error("Error adding curated box in Firestore:", error);
      throw error;
    }
  };

  const deleteCuratedBox = async (id: string): Promise<void> => {
    try {
      const docRef = doc(firestore, 'curated_boxes', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting curated box in Firestore:", error);
      throw error;
    }
  };

  const resetCatalogueToDefaults = async (): Promise<void> => {
    try {
      for (const p of defaultCatalogueProducts) {
        await setDoc(doc(firestore, 'catalogue_products', p.id), p);
      }
      for (const b of defaultCuratedBoxes) {
        await setDoc(doc(firestore, 'curated_boxes', b.id), b);
      }
    } catch (error) {
      console.error("Error resetting catalogue to defaults in Firestore:", error);
      throw error;
    }
  };

  const value: DataContextType = {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductsBySeller,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    orders,
    createOrder,
    createGuestOrder,
    updateOrderStatus,
    updateOrderProcessingDate,
    updateOrderPaymentMethod,
    updateOrderPaymentStatus,
    getOrderById,
    getOrdersByUser,
    getOrdersBySeller,
    getAllOrders,
    reviews,
    addReview,
    replyToReview,
    deleteReview,
    catalogueProducts,
    curatedBoxes,
    updateCatalogueProduct,
    addCatalogueProduct,
    deleteCatalogueProduct,
    updateCuratedBox,
    addCuratedBox,
    deleteCuratedBox,
    resetCatalogueToDefaults,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
