import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { User } from '../../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, Package, ShoppingBag, IndianRupee, TrendingUp, AlertCircle, Building2 } from 'lucide-react';
import { firestore } from '../../../config/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { BuyOfflineModal } from './BuyOfflineModal';

export function AdminDashboard() {
  const { products, getAllOrders } = useData();
  const navigate = useNavigate();
  const [isBuyOfflineModalOpen, setIsBuyOfflineModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    pendingSellers: 0,
    totalProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList: User[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ uid: doc.id, ...doc.data() } as User);
      });
      setUsers(usersList);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadStats();
  }, [products, users]);

  const loadStats = () => {
    try {
      const sellers = users.filter(u => u.role === 'seller');
      const pendingSellers = sellers.filter(u => u.status === 'pending');

      const pendingProducts = products.filter(p => p.status === 'pending');

      const allOrders = getAllOrders();
      let revenue = 0;
      allOrders.forEach(order => {
        revenue += order.totalAmount;
      });

      setStats({
        totalUsers: users.length,
        totalSellers: sellers.length,
        pendingSellers: pendingSellers.length,
        totalProducts: products.length,
        pendingProducts: pendingProducts.length,
        totalOrders: allOrders.length,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    setLoading(false);
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Total Sellers',
      value: stats.totalSellers,
      subtitle: `${stats.pendingSellers} pending`,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      subtitle: `${stats.pendingProducts} pending`,
      icon: Package,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Growth',
      value: '+24%',
      subtitle: 'vs last month',
      icon: TrendingUp,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6">
        <h1 className="text-2xl">Admin Dashboard</h1>
        <p className="text-green-100">Platform Overview</p>
      </div>

      <div className="p-4 space-y-4">
        {(stats.pendingSellers > 0 || stats.pendingProducts > 0) && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Pending Approvals</p>
                <p className="text-sm text-orange-700">
                  {stats.pendingSellers} seller{stats.pendingSellers !== 1 ? 's' : ''} and {stats.pendingProducts} product{stats.pendingProducts !== 1 ? 's' : ''} awaiting review
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className={`${stat.bg} p-3 rounded-lg inline-block mb-2`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl mt-1">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button onClick={() => setIsBuyOfflineModalOpen(true)} className="w-full p-4 bg-amber-50 hover:bg-amber-100 rounded-lg text-left transition-colors border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-amber-900">Buy Offline / Generate Invoice</p>
                  <p className="text-sm text-amber-700">Select product, generate invoice & share to customer</p>
                </div>
                <Building2 className="w-6 h-6 text-amber-600" />
              </div>
            </button>
            <button onClick={() => navigate('/admin/users')} className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
              <p className="font-medium text-purple-800">Manage Users</p>
              <p className="text-sm text-purple-600">View and approve sellers</p>
            </button>
            <button onClick={() => navigate('/admin/products')} className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
              <p className="font-medium text-green-800">Product Control</p>
              <p className="text-sm text-green-600">Approve or reject products</p>
            </button>
            <button onClick={() => alert('Create Coupon feature coming soon!')} className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
              <p className="font-medium text-blue-800">Create Coupon</p>
              <p className="text-sm text-blue-600">Add new discount codes</p>
            </button>
          </CardContent>
        </Card>
      </div>

      <BuyOfflineModal
        isOpen={isBuyOfflineModalOpen}
        onClose={() => setIsBuyOfflineModalOpen(false)}
      />
    </div>
  );
}
