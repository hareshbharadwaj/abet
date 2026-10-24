import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid3x3, ShoppingCart, Package, User, LayoutDashboard, MessageSquare } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from './ui/badge';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = useData();
  const { user } = useAuth();

  if (!user) return null;

  interface NavItem {
    path: string;
    label: string;
    icon: any;
    badge?: number;
  }

  const buyerNav: NavItem[] = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/products', label: 'Products', icon: Grid3x3 },
    { path: '/cart', label: 'Cart', icon: ShoppingCart, badge: cart.length },
    { path: '/orders', label: 'Orders', icon: Package },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const sellerNav: NavItem[] = [
    { path: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/seller/products', label: 'Products', icon: Package },
    { path: '/seller/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const adminNav: NavItem[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: User },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const superadminNav: NavItem[] = [
    { path: '/superadmin', label: 'Orders', icon: LayoutDashboard },
    { path: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const getNavItems = (): NavItem[] => {
    if (user.role === 'seller') return sellerNav;
    if (user.role === 'admin') return adminNav;
    if (user.role === 'superadmin') return superadminNav;
    return buyerNav;
  };

  const navItems = getNavItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 md:hidden">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <item.icon className={`w-6 h-6 ${isActive ? 'fill-green-100' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
