# A2ZEE MICROGREENZ

A complete mobile-optimized Progressive Web App for fast-commerce marketplace specializing in fresh microgreens, seeds, grow kits, and accessories.

## ⚠️ Quick Start

**Before running the app**, you need to configure Firebase:

1. **5-Minute Setup**: See [`SETUP_HELP.md`](./SETUP_HELP.md) for the fastest way to get started
2. **Detailed Guide**: See [`QUICKSTART.md`](./QUICKSTART.md) for comprehensive instructions

The app **will not work** without Firebase configuration.

## Features

### User Roles
- **Buyer**: Browse products, add to cart, checkout, track orders
- **Seller**: Manage products, handle orders, track inventory
- **Admin**: Manage users, approve products/sellers, analytics

### Core Functionality
- 🔐 Firebase Authentication (Email, Phone OTP, Google Sign-In)
- 🛒 Shopping cart with real-time updates
- 💳 Razorpay payment integration (UPI, Cards, Wallet, COD)
- 📦 Real-time order tracking with Firebase Realtime Database
- 📱 Mobile-first responsive design
- 🎨 Glassmorphism UI with organic green theme
- 🔔 Push notifications ready
- 📊 Analytics dashboard for admin

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Routing**: React Router v7
- **Backend**: Firebase (Auth, Firestore, Storage, Realtime DB)
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React

## Setup Instructions

### 1. Firebase Configuration

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable the following services:
   - **Authentication**: Email/Password, Phone, Google
   - **Firestore Database**: Create database in production mode
   - **Firebase Storage**: For product images
   - **Realtime Database**: For order tracking
   - **Cloud Messaging** (optional): For push notifications

3. Get your Firebase config and update `/src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "YOUR_DATABASE_URL"
};
```

### 2. Firestore Database Structure

Create these collections in Firestore:

```
users/
  {userId}
    - name: string
    - email: string
    - role: 'buyer' | 'seller' | 'admin'
    - status: 'active' | 'pending' | 'blocked'
    - createdAt: timestamp

products/
  {productId}
    - name: string
    - description: string
    - price: number
    - category: string
    - stock: number
    - sellerId: string
    - sellerName: string
    - imageUrl: string
    - status: 'pending' | 'approved' | 'rejected'
    - featured: boolean
    - createdAt: timestamp

orders/
  {orderId}
    - userId: string
    - userName: string
    - items: array
    - totalAmount: number
    - address: object
    - status: 'pending' | 'accepted' | 'packed' | 'out_for_delivery' | 'delivered'
    - paymentMethod: 'razorpay' | 'cod'
    - paymentStatus: string
    - createdAt: timestamp
```

### 3. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.sellerId;
      allow update: if request.auth != null && (request.auth.uid == resource.data.sellerId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if request.auth != null && (request.auth.uid == resource.data.sellerId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    match /orders/{orderId} {
      allow read: if request.auth != null && (request.auth.uid == resource.data.userId || request.auth.uid == resource.data.sellerId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow update: if request.auth != null && (request.auth.uid == resource.data.sellerId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

### 4. Razorpay Integration

1. Sign up at [razorpay.com](https://razorpay.com)
2. Get your API keys from the dashboard
3. Update the Razorpay key in `/src/app/components/buyer/CheckoutPage.tsx`:

```typescript
const options = {
  key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your key
  amount: orderData.totalAmount * 100,
  currency: 'INR',
  // ...
};
```

4. Add Razorpay script to your HTML head (if not already present):
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 5. Create Admin User

After setting up Firebase, manually create an admin user in Firestore:

1. Go to Firestore Database
2. Create a document in `users` collection:
```json
{
  "email": "admin@a2zee.com",
  "name": "Admin",
  "role": "admin",
  "status": "active",
  "createdAt": "2026-04-24T00:00:00.000Z"
}
```

3. Use the document ID to create an auth user with the same UID

### 6. Install Dependencies

```bash
pnpm install
```

### 7. Run Development Server

```bash
pnpm dev
```

The app will be available at the preview URL provided by the environment.

## User Roles & Access

### Buyer
- Browse products by category
- Search and filter products
- Add items to cart
- Checkout with multiple payment options
- Track orders in real-time
- View order history
- Manage profile and addresses

### Seller (Requires Admin Approval)
- Dashboard with sales overview
- Add/Edit/Delete products
- Upload product images
- Manage incoming orders
- Update order status
- Track inventory
- View earnings

### Admin
- Approve/reject seller accounts
- Approve/reject products
- Feature products on homepage
- Block/unblock users
- View platform analytics
- Manage all orders
- Create discount coupons

## Payment Methods

- **Razorpay**: UPI, Credit/Debit Cards, Wallets
- **Cash on Delivery**: Pay when you receive

## Real-time Features

- Live order status updates
- Real-time inventory tracking
- Instant notifications for order updates
- Live delivery tracking (when order is out for delivery)

## PWA Features

The app is installable as a Progressive Web App:
- Works offline (with cached data)
- Add to home screen on mobile devices
- Fast load times with service worker
- Push notifications support

## Environment Variables

Create a `.env` file (if needed for additional configuration):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_RAZORPAY_KEY=your_razorpay_key
```

## Production Deployment

1. Build the app:
```bash
pnpm build
```

2. Deploy to your preferred hosting:
   - Firebase Hosting
   - Vercel
   - Netlify
   - Custom server

3. Configure environment variables in your hosting platform

4. Set up custom domain and SSL certificate

## Security Notes

⚠️ **Important**: This is a prototype/demo application. For production use:

1. Move all API keys to environment variables
2. Implement proper rate limiting
3. Add data validation and sanitization
4. Set up monitoring and error tracking
5. Implement proper backup strategies
6. Use Firebase App Check to prevent abuse
7. Enable advanced security rules
8. Comply with data protection regulations (GDPR, etc.)

## Support

For issues or questions:
- Check Firebase console for errors
- Review browser console for client-side issues
- Verify Firestore security rules
- Check Razorpay dashboard for payment issues

## License

Proprietary - A2ZEE MICROGREENZ

## Version

1.0.0 - April 2026
