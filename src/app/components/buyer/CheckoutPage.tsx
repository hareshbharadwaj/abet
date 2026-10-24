import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ArrowLeft, MapPin, CreditCard, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Address, Order, OrderItem } from '../../../types';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, getCartTotal, clearCart, createOrder } = useData();
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [address, setAddress] = useState<Address>({
    id: '',
    userId: user?.uid || '',
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: true,
  });

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to continue');
      return;
    }

    if (!address.name || !address.phone || !address.line1 || !address.city || !address.pincode) {
      toast.error('Please fill all address fields');
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'razorpay') {
        const totalAmount = getCartTotal() + (getCartTotal() > 299 ? 0 : 40);
        const options = {
          key: 'YOUR_RAZORPAY_KEY',
          amount: totalAmount * 100,
          currency: 'INR',
          name: 'A2ZEE MICROGREENZ',
          description: 'Fresh Microgreens Order',
          handler: async function (response: any) {
            const order = await createOrder(cart, address, paymentMethod);
            setOrderPlaced(true);
            clearCart();
            toast.success('Order placed successfully!');
            navigate(`/orders/${order.id}`);
          },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        const order = await createOrder(cart, address, paymentMethod);
        setOrderPlaced(true);
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/orders/${order.id}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    }

    setLoading(false);
  };

  if (cart.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10 md:pb-20">
      {/* Mobile Sticky Header */}
      <div className="md:hidden sticky top-0 bg-white border-b z-50 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold">Checkout</h1>
      </div>

      <div className="max-w-7xl mx-auto md:pt-8 px-4 md:px-8">
        <h1 className="hidden md:block text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Checkout Steps (Address & Payment) */}
          <div className="flex-[2] space-y-6">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-green-100 p-2.5 rounded-xl text-green-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700 font-semibold ml-1">Full Name</Label>
                      <Input
                        id="name"
                        value={address.name}
                        onChange={(e) => setAddress({ ...address, name: e.target.value })}
                        placeholder="John Doe"
                        className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white focus:border-green-300 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-700 font-semibold ml-1">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        placeholder="+91 1234567890"
                        className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white focus:border-green-300 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="line1" className="text-gray-700 font-semibold ml-1">Address Line 1</Label>
                    <Input
                      id="line1"
                      value={address.line1}
                      onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                      placeholder="House/Flat no, Building name"
                      className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white focus:border-green-300 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="line2" className="text-gray-700 font-semibold ml-1">Address Line 2 (Optional)</Label>
                    <Input
                      id="line2"
                      value={address.line2}
                      onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                      placeholder="Street, Area"
                      className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white focus:border-green-300 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-gray-700 font-semibold ml-1">City</Label>
                      <Input
                        id="city"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        placeholder="Mumbai"
                        className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white focus:border-green-300 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-gray-700 font-semibold ml-1">State</Label>
                      <Input
                        id="state"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        placeholder="Maharashtra"
                        className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white focus:border-green-300 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-gray-700 font-semibold ml-1">Pincode</Label>
                      <Input
                        id="pincode"
                        value={address.pincode}
                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                        placeholder="400001"
                        className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white focus:border-green-300 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                </div>

                <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Label 
                    htmlFor="razorpay" 
                    className={`flex items-center space-x-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                      paymentMethod === 'razorpay' ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                    }`}
                  >
                    <RadioGroupItem value="razorpay" id="razorpay" className="sr-only" />
                    <div className={`p-3 rounded-xl ${paymentMethod === 'razorpay' ? 'bg-blue-500 text-white' : 'bg-white text-blue-600 shadow-sm'}`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Online Payment</p>
                      <p className="text-xs text-gray-500 mt-0.5">UPI, Cards, Wallets</p>
                    </div>
                  </Label>

                  <Label 
                    htmlFor="cod" 
                    className={`flex items-center space-x-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                      paymentMethod === 'cod' ? 'border-green-500 bg-green-50/50 shadow-md' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                    }`}
                  >
                    <RadioGroupItem value="cod" id="cod" className="sr-only" />
                    <div className={`p-3 rounded-xl ${paymentMethod === 'cod' ? 'bg-green-500 text-white' : 'bg-white text-green-600 shadow-sm'}`}>
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Cash on Delivery</p>
                      <p className="text-xs text-gray-500 mt-0.5">Pay when you receive</p>
                    </div>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="flex-1">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white sticky top-24">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Items ({cart.length})</span>
                    <span>₹{getCartTotal()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Delivery Fee</span>
                    <span className={getCartTotal() > 299 ? "text-green-600" : ""}>
                      {getCartTotal() > 299 ? 'FREE' : '₹40'}
                    </span>
                  </div>
                  
                  <div className="h-px bg-gray-100 my-4" />
                  
                  <div className="flex justify-between text-2xl font-bold text-gray-900">
                    <span>Total Payable</span>
                    <span className="text-green-600">
                      ₹{getCartTotal() + (getCartTotal() > 299 ? 0 : 40)}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8">
                  <div className="flex items-center gap-3 text-blue-800">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600">
                       <CreditCard className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold leading-tight">
                      Selected Payment: {paymentMethod === 'razorpay' ? 'Online' : 'Cash'}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 font-bold text-lg"
                >
                  {loading ? 'Processing...' : `Place Order • ₹${getCartTotal() + (getCartTotal() > 299 ? 0 : 40)}`}
                </Button>
                
                <p className="mt-6 text-center text-gray-400 text-xs font-medium uppercase tracking-widest leading-relaxed">
                  By placing order, you agree to our<br/>Terms and Privacy Policy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
