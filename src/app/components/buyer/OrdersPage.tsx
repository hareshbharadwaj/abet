import { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Order } from '../../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseOrderDate } from '../../../utils/emailService';

export function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getOrdersByUser } = useData();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = () => {
    if (!user) return;

    try {
      const userOrders = getOrdersByUser(user.uid);
      const sorted = userOrders.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'out_for_delivery': return 'bg-blue-500';
      case 'packed': return 'bg-yellow-500';
      case 'accepted': return 'bg-purple-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'out_for_delivery': return <Truck className="w-4 h-4" />;
      case 'packed': return <Package className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10 md:pb-20">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">My Orders</h1>
          <p className="text-green-100 text-lg opacity-90">{orders.length} orders placed with us</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {orders.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 bg-white p-12 md:p-24 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center p-0">
              <div className="bg-gray-50 p-6 rounded-full mb-6">
                 <Package className="w-16 h-16 text-gray-300" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
              <p className="text-gray-500 mb-8 text-center max-w-sm">
                You haven't placed any orders yet. Explore our fresh microgreens and start shopping!
              </p>
              <Button onClick={() => navigate('/products')} className="bg-green-600 h-12 rounded-xl px-8 font-bold">
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer group hover:shadow-xl transition-all duration-300 border-none rounded-[2rem] bg-white overflow-hidden shadow-sm"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Order Side Info */}
                    <div className="bg-gray-50 p-6 md:w-64 border-b md:border-b-0 md:border-r border-gray-100 shrink-0">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order Number</p>
                          <p className="font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Placed On</p>
                          <p className="font-medium text-gray-700">
                            {parseOrderDate(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} border-none px-3 py-1 text-white shadow-sm font-bold rounded-full`}>
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(order.status)}
                            <span className="text-[10px] uppercase tracking-wider">{getStatusText(order.status)}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>

                    {/* Order Content */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                      <div className="flex flex-wrap gap-3 mb-6">
                        {order.items.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="relative group/img">
                            <img
                              src={item.imageUrl || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=100'}
                              alt={item.productName}
                              className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-2xl border border-gray-100 shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/5 rounded-2xl group-hover/img:bg-black/0 transition-colors"></div>
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="w-20 h-20 md:w-24 md:h-24 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center font-bold border border-green-100 shadow-sm">
                            +{order.items.length - 4} More
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''} • Total Amount
                        </p>
                        <p className="text-2xl font-bold text-green-600">₹{order.totalAmount}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
