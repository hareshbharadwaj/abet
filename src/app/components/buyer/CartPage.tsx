import { useData } from '../../../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

export function CartPage() {
  const navigate = useNavigate();
  const { cart, updateCartQuantity, removeFromCart, getCartTotal } = useData();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-20 h-20 text-gray-300 mb-4" />
        <h2 className="text-xl mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6 text-center">
          Add some fresh microgreens to get started
        </p>
        <Button onClick={() => navigate('/products')}>
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10 md:pb-20">
      {/* Mobile Sticky Header */}
      <div className="md:hidden sticky top-0 bg-white border-b z-50 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold">Shopping Cart ({cart.length})</h1>
      </div>

      <div className="max-w-7xl mx-auto md:pt-8 px-4 md:px-8">
        <h1 className="hidden md:block text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items List */}
          <div className="flex-[2] space-y-4">
            {cart.map((item) => (
              <Card key={item.productId} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-4 md:p-6">
                  <div className="flex gap-4 md:gap-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-2xl overflow-hidden border border-gray-100">
                      <img
                        src={item.product.imageUrl || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=200'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-900 md:text-xl line-clamp-1">{item.product.name}</h3>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-xs md:text-sm text-gray-400 mt-1 uppercase tracking-wider font-medium">{item.product.category}</p>
                        <p className="text-green-600 font-bold mt-2 md:text-lg">₹{item.product.price}</p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                            className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 text-sm font-bold min-w-[40px] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                            className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600"
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <p className="font-bold text-gray-900 md:text-lg">₹{item.product.price * item.quantity}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center gap-4 text-emerald-800">
              <div className="bg-white p-3 rounded-xl shadow-sm text-emerald-600">
                 <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm md:text-base">Free Delivery Advantage</p>
                <p className="text-xs md:text-sm text-emerald-600">
                  {getCartTotal() > 299 
                    ? "Congratulations! You've unlocked free delivery for this order." 
                    : `Add ₹${299 - getCartTotal()} more to your cart to unlock free delivery.`}
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="flex-1">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white sticky top-24">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Subtotal</span>
                    <span>₹{getCartTotal()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Delivery Fee</span>
                    <span className={getCartTotal() > 299 ? "text-green-600" : ""}>
                      {getCartTotal() > 299 ? 'FREE' : '₹40'}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>GST (Included)</span>
                    <span>₹0</span>
                  </div>
                  
                  <div className="h-px bg-gray-100 my-4" />
                  
                  <div className="flex justify-between text-2xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-green-600">
                      ₹{getCartTotal() + (getCartTotal() > 299 ? 0 : 40)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 font-bold text-lg"
                >
                  Proceed to Checkout
                </Button>
                
                <div className="mt-6 space-y-4">
                  <p className="text-center text-gray-400 text-xs font-medium uppercase tracking-widest">
                    Guaranteed Safe Checkout
                  </p>
                  <div className="flex justify-center gap-4 opacity-50 grayscale">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                     <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                     <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
