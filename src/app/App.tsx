import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContext';
import { initializeStorage } from '../utils/localStorage';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { LearnMorePage } from './components/LearnMorePage';
import { HomePage } from './components/buyer/HomePage';
import { ProductsPage } from './components/buyer/ProductsPage';
import { ProductDetailPage } from './components/buyer/ProductDetailPage';
import { CartPage } from './components/buyer/CartPage';
import { CheckoutPage } from './components/buyer/CheckoutPage';
import { OrdersPage } from './components/buyer/OrdersPage';
import { OrderTrackingPage } from './components/buyer/OrderTrackingPage';
import { ProfilePage } from './components/buyer/ProfilePage';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { ProductManagement } from './components/seller/ProductManagement';
import { SellerOrders } from './components/seller/SellerOrders';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserManagement } from './components/admin/UserManagement';
import { ProductControl } from './components/admin/ProductControl';
import { BottomNav } from './components/BottomNav';
import { Navbar } from './components/Navbar';
import { Toaster } from './components/ui/sonner';
import { ReviewsPage } from './components/buyer/ReviewsPage';
import { AdminReviewsPage } from './components/admin/AdminReviewsPage';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';

import { PublicInvoicePage } from './components/buyer/PublicInvoicePage';
import { PaymentRedirectPage } from './components/buyer/PaymentRedirectPage';
import { AIAssistantWidget } from './components/ai/AIAssistantWidget';

// Initialize localStorage with demo data
initializeStorage();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-800">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={
      user.role === 'seller' ? '/seller/dashboard' : 
      user.role === 'admin' ? '/admin/dashboard' : 
      user.role === 'superadmin' ? '/superadmin' :
      '/home'
    } replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={
          loading ? (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                <p className="text-green-800">Loading...</p>
              </div>
            </div>
          ) : user ? (
            <Navigate to={
              user.role === 'seller' ? '/seller/dashboard' :
              user.role === 'admin' ? '/admin/dashboard' :
              user.role === 'superadmin' ? '/superadmin' :
              '/home'
            } replace />
          ) : (
            <LandingPage />
          )
        } />

        <Route path="/auth" element={
          loading ? (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                <p className="text-green-800">Loading...</p>
              </div>
            </div>
          ) : user ? (
            <Navigate to={
              user.role === 'seller' ? '/seller/dashboard' :
              user.role === 'admin' ? '/admin/dashboard' :
              user.role === 'superadmin' ? '/superadmin' :
              '/home'
            } replace />
          ) : (
            <AuthPage />
          )
        } />

        <Route path="/invoice/:orderId" element={<PublicInvoicePage />} />
        <Route path="/pay/:id" element={<PaymentRedirectPage />} />
        <Route path="/learn-more" element={<LearnMorePage />} />

        <Route path="/home" element={<ProtectedRoute allowedRoles={['buyer']}><HomePage /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute allowedRoles={['buyer']}><ProductsPage /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProtectedRoute allowedRoles={['buyer']}><ProductDetailPage /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute allowedRoles={['buyer']}><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute allowedRoles={['buyer']}><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute allowedRoles={['buyer']}><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={['buyer']}><OrderTrackingPage /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute allowedRoles={['buyer']}><ReviewsPage /></ProtectedRoute>} />

        <Route path="/seller/dashboard" element={<ProtectedRoute allowedRoles={['seller']}><SellerDashboard /></ProtectedRoute>} />
        <Route path="/seller/products" element={<ProtectedRoute allowedRoles={['seller']}><ProductManagement /></ProtectedRoute>} />
        <Route path="/seller/orders" element={<ProtectedRoute allowedRoles={['seller']}><SellerOrders /></ProtectedRoute>} />

        <Route path="/admin" element={
          loading ? (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                <p className="text-green-800">Loading...</p>
              </div>
            </div>
          ) : user ? (
            <Navigate to={
              user.role === 'superadmin' ? '/superadmin' :
              user.role === 'admin' ? '/admin/dashboard' :
              user.role === 'seller' ? '/seller/dashboard' :
              '/home'
            } replace />
          ) : (
            <AuthPage />
          )
        } />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><ProductControl /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminReviewsPage /></ProtectedRoute>} />

        <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminDashboard /></ProtectedRoute>} />

        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {user && <BottomNav />}
      <AIAssistantWidget />
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </HashRouter>
  );
}