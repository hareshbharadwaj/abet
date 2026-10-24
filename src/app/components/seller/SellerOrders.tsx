import { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Order, OrderStatus } from '../../../types';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type FilterStatus = 'all' | 'pending' | 'accepted' | 'packed' | 'ofd' | 'delivered' | 'cancelled';

export function SellerOrders() {
  const { user } = useAuth();
  const { getOrdersBySeller, updateOrderStatus: updateStatus } = useData();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => {
        const orderStatus = order.status.toLowerCase();
        if (filter === 'ofd') return orderStatus === 'out_for_delivery';
        return orderStatus === filter;
      }));
    }
  }, [filter, orders]);

  const loadOrders = () => {
    if (!user) return;

    try {
      const sellerOrders = getOrdersBySeller(user.uid);
      setOrders(sellerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading orders:', error);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateStatus(orderId, status);
      toast.success('Order status updated');
      loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'accepted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'packed': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Function to get the display ID (matches Android implementation: last 8 chars, uppercase)
  const getDisplayId = (id: string) => {
    return id.toUpperCase().slice(-8);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Packed', value: 'packed' },
    { label: 'OFD', value: 'ofd' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="bg-[#2D6A2E] text-white p-6 pb-8">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <p className="text-green-100 opacity-90">{filteredOrders.length} filtered orders</p>
      </div>

      <div className="px-4 -mt-4 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-6 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
                filter === f.value
                  ? 'bg-green-100 border-green-600 text-green-700'
                  : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No {filter !== 'all' ? filter : ''} orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="border-none shadow-sm overflow-hidden rounded-2xl">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[#2D6A2E] font-bold text-lg">Order #{getDisplayId(order.id)}</h3>
                    <p className="text-xs text-gray-400 font-medium">
                      {new Date(order.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                        hour12: true
                      }).replace(/\//g, '/')}
                    </p>
                  </div>
                  <Badge variant="outline" className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex gap-1 items-center ${getStatusColor(order.status)}`}>
                    {order.status === 'accepted' && <CheckCircle2 className="w-3 h-3" />}
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="space-y-4 mb-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col">
                      <p className="text-[#2D6A2E] font-bold text-base mb-1">{item.productName}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} × ₹{item.price}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-[#2D6A2E] font-bold text-sm mb-1">{order.userName || order.address.name}</p>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {order.address.line1}, {order.address.city}, {order.address.pincode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <p className="text-gray-400 text-sm">{order.address.phone}</p>
                  </div>

                  <div className="flex justify-between items-end pt-2">
                    <p className="text-[#2D6A2E] font-bold text-xl">Total: ₹{order.totalAmount}</p>
                    <p className="text-xs font-bold text-gray-300 tracking-widest">{order.paymentMethod.toUpperCase()}</p>
                  </div>
                </div>

                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <div className="mt-6">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-tight">Update Status</p>
                    <Select
                      value={order.status}
                      onValueChange={(value: OrderStatus) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50 border-gray-100 text-green-700 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="packed">Packed</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
