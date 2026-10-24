import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Package, ShoppingBag, IndianRupee, TrendingUp } from 'lucide-react';

export function SellerDashboard() {
  const { user } = useAuth();
  const { getProductsBySeller, getOrdersBySeller } = useData();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = () => {
    if (!user) return;

    try {
      const sellerProducts = getProductsBySeller(user.uid);
      const sellerOrders = getOrdersBySeller(user.uid);

      let revenue = 0;
      let pending = 0;
      
      sellerOrders.forEach(order => {
        // Revenue logic matching Android: (delivered OR payment completed) AND not cancelled
        const isDelivered = order.status.toLowerCase() === 'delivered';
        const isPaid = order.paymentStatus.toLowerCase() === 'completed';
        const isNotCancelled = order.status.toLowerCase() !== 'cancelled';

        if (isNotCancelled && (isDelivered || isPaid)) {
          // Sum individual items to exclude delivery fees, matching Android
          revenue += order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }

        if (order.status.toLowerCase() === 'pending') {
          pending++;
        }
      });

      setStats({
        totalProducts: sellerProducts.length,
        totalOrders: sellerOrders.length,
        totalRevenue: Math.round(revenue),
        pendingOrders: pending,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    setLoading(false);
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Revenue',
      value: `₹${stats.totalRevenue}`,
      icon: IndianRupee,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  if (user?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="bg-yellow-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Package className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-xl mb-2">Account Pending Approval</h2>
            <p className="text-gray-600">
              Your seller account is awaiting admin approval. You'll be notified once your account is activated.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10 md:pb-20">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">Seller Dashboard</h1>
          <p className="text-green-100 text-lg opacity-90">Welcome back, {user?.name}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-6">
                <div className={`${stat.bg} p-4 rounded-2xl inline-block mb-4`}>
                  <stat.icon className={`w-6 h-6 md:w-8 md:h-8 ${stat.color}`} />
                </div>
                <p className="text-sm md:text-base font-medium text-gray-500 uppercase tracking-wider">{stat.title}</p>
                <p className="text-2xl md:text-4xl font-bold mt-2 text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardHeader className="border-b border-gray-50 p-6 md:p-8">
              <CardTitle className="text-xl md:text-2xl font-bold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="p-12 text-center">
                 <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <TrendingUp className="w-10 h-10" />
                 </div>
                 <p className="text-gray-500 font-medium">Activity graph and recent sales will appear here.</p>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardHeader className="border-b border-gray-50 p-6 md:p-8">
              <CardTitle className="text-xl md:text-2xl font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-4">
              <button onClick={() => navigate('/seller/products')} className="w-full group p-5 bg-green-50 hover:bg-green-600 rounded-2xl text-left transition-all duration-300" >
                <p className="font-bold text-green-800 group-hover:text-white transition-colors">Add New Product</p>
                <p className="text-sm text-green-600 group-hover:text-green-50 transition-colors">List a new item for sale</p>
              </button>
              <button onClick={() => navigate('/seller/orders')} className="w-full group p-5 bg-blue-50 hover:bg-blue-600 rounded-2xl text-left transition-all duration-300">
                <p className="font-bold text-blue-800 group-hover:text-white transition-colors">Manage Orders</p>
                <p className="text-sm text-blue-600 group-hover:text-blue-50 transition-colors">View and update order status</p>
              </button>
              <button onClick={() => alert('Payout History feature coming soon!')} className="w-full group p-5 bg-purple-50 hover:bg-purple-600 rounded-2xl text-left transition-all duration-300">
                <p className="font-bold text-purple-800 group-hover:text-white transition-colors">Payout History</p>
                <p className="text-sm text-purple-600 group-hover:text-purple-50 transition-colors">Check your earnings history</p>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
