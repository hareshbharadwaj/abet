import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Grid3x3, ShoppingCart, Package, User, Search, LogOut, MessageSquare } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useData();
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  const buyerNav = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/products', label: 'Products', icon: Grid3x3 },
    { path: '/orders', label: 'Orders', icon: Package },
    { path: '/reviews', label: 'Reviews', icon: MessageSquare },
  ];

  const sellerNav = [
    { path: '/seller/dashboard', label: 'Dashboard', icon: Home },
    { path: '/seller/products', label: 'Products', icon: Package },
    { path: '/seller/orders', label: 'Orders', icon: ShoppingCart },
  ];

  const adminNav = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { path: '/admin/users', label: 'Users', icon: User },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  ];

  const superadminNav = [
    { path: '/superadmin', label: 'Orders', icon: Home },
    { path: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  ];

  const navItems = 
    user.role === 'seller' ? sellerNav : 
    user.role === 'admin' ? adminNav : 
    user.role === 'superadmin' ? superadminNav : 
    buyerNav;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
    }
  };

  return (
    <nav className="hidden md:block sticky top-0 bg-white border-b z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/home')}
          >
            <img src="/logo.png" alt="A2ZEE" className="h-9 w-auto object-contain" />
            <span className="text-xl tracking-wide flex items-center gap-1.5">
              <span className="font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">A2ZEE</span>
              <span className="font-semibold text-gray-600 text-xs tracking-widest uppercase">Microgreenz</span>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Pvt. Ltd.</span>
            </span>
          </div>

          {/* Search Bar */}
          {user.role === 'buyer' && (
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search microgreens..."
                className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          )}

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`flex items-center gap-2 px-4 ${isActive ? 'text-green-600 bg-green-50' : 'text-gray-600'}`}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}

            {/* Cart (Buyer only) */}
            {user.role === 'buyer' && (
              <Button
                variant="ghost"
                className={`relative px-4 ${location.pathname === '/cart' ? 'text-green-600 bg-green-50' : 'text-gray-600'}`}
                onClick={() => navigate('/cart')}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                <span className="font-medium">Cart</span>
                {cart.length > 0 && (
                  <span className="absolute top-1.5 right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Button>
            )}

            {/* Profile Dropdown or Button */}
            <div className="h-6 w-px bg-gray-200 mx-2" />
            
            <Button
              variant="ghost"
              className={`px-4 ${location.pathname === '/profile' ? 'text-green-600 bg-green-50' : 'text-gray-600'}`}
              onClick={() => navigate('/profile')}
            >
              <User className="w-4 h-4 mr-2" />
              <span className="font-medium">Profile</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-500"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
