import { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { Order, OrderStatus } from '../../../types';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Calendar } from 'lucide-react';

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById } = useData();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<{ latitude: number; longitude: number; status: OrderStatus } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrder(id);
      setupRealtimeTracking(id);
    }
  }, [id]);

  const loadOrder = (orderId: string) => {
    try {
      const foundOrder = getOrderById(orderId);
      setOrder(foundOrder || null);
    } catch (error) {
      console.error('Error loading order:', error);
    }
    setLoading(false);
  };

  const setupRealtimeTracking = (orderId: string) => {
    // Mock real-time tracking with localStorage polling
    const checkTracking = () => {
      try {
        const trackingData = localStorage.getItem(`tracking_${orderId}`);
        if (trackingData) {
          setTracking(JSON.parse(trackingData));
        }
      } catch (error) {
        console.error('Error loading tracking:', error);
      }
    };

    checkTracking();
    const interval = setInterval(checkTracking, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  };

  const getStatusSteps = (): { status: OrderStatus; label: string; icon: any }[] => [
    { status: 'pending', label: 'Order Placed', icon: Clock },
    { status: 'accepted', label: 'Accepted', icon: CheckCircle },
    { status: 'packed', label: 'Packed', icon: Package },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const getCurrentStepIndex = () => {
    const steps = getStatusSteps();
    const currentStatus = tracking?.status || order?.status || 'pending';
    return steps.findIndex(step => step.status === currentStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Order not found</p>
        <Button onClick={() => navigate('/orders')}>View Orders</Button>
      </div>
    );
  }

  const steps = getStatusSteps();
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 bg-white border-b z-10 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg">Track Order</h1>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">#{order.id.slice(0, 12)}</p>
              </div>
              <Badge className="bg-green-600">
                {(tracking?.status || order.status).replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>

            {order.processingDate && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  We will process your order on{' '}
                  <strong className="font-extrabold text-emerald-950">
                    {new Date(order.processingDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </strong>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Order Status</h3>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-0.5 h-12 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="flex-1 pt-2">
                      <p className={`font-medium ${isCurrent ? 'text-green-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-sm text-green-600">In progress</p>
                      )}
                      {isCompleted && !isCurrent && (
                        <p className="text-sm text-gray-500">Completed</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {tracking && tracking.latitude && tracking.longitude && order.status === 'out_for_delivery' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <h3 className="font-medium">Live Tracking</h3>
              </div>
              <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
                <p className="text-sm text-gray-500">Map view with live location</p>
                <p className="text-xs text-gray-400 mt-1">
                  Lat: {tracking.latitude}, Lng: {tracking.longitude}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Delivery Address</h3>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{order.address.name}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
              <p className="mt-2">Phone: {order.address.phone}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=100'}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    <p className="text-green-600 text-sm">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-3">
              <div className="flex justify-between text-lg">
                <span className="font-medium">Total</span>
                <span className="text-green-600 font-medium">₹{order.totalAmount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
