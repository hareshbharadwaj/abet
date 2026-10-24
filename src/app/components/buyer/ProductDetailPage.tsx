import { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { Product } from '../../../types';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, User } from 'lucide-react';
import { toast } from 'sonner';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductById, addToCart, reviews } = useData();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0';

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = (productId: string) => {
    try {
      const foundProduct = getProductById(productId);
      setProduct(foundProduct || null);
    } catch (error) {
      console.error('Error loading product:', error);
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      toast.success(`Added ${quantity} item(s) to cart`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Product not found</p>
        <Button onClick={() => navigate('/products')}>Browse Products</Button>
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
        <h1 className="text-lg font-bold truncate">{product.name}</h1>
      </div>

      <div className="max-w-7xl mx-auto md:pt-8 px-4 md:px-8">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left Column: Image */}
          <div className="flex-1">
            <div className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 aspect-square md:aspect-auto md:h-[600px]">
              <img
                src={product.imageUrl || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800'}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              {product.featured && (
                <Badge className="absolute top-6 left-6 bg-yellow-500 text-white px-4 py-1.5 rounded-full shadow-lg border-none font-bold">
                  Featured Choice
                </Badge>
              )}
              {product.stock < 10 && (
                <Badge className="absolute top-6 right-6 bg-red-500 text-white px-4 py-1.5 rounded-full shadow-lg border-none font-bold">
                  Only {product.stock} Left!
                </Badge>
              )}
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 rounded-full px-3">
                  {product.category}
                </Badge>
                <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-sm font-medium border border-yellow-100">
                  <Star className="w-3.5 h-3.5 fill-yellow-500" />
                  <span>{avgRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-4">
                <p className="text-4xl font-bold text-green-600">₹{product.price}</p>
                <p className="text-gray-400 line-through text-lg">₹{Math.round(product.price * 1.3)}</p>
                <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">30% OFF</Badge>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-2xl w-fit">
                <div className="bg-white p-2 rounded-xl shadow-sm text-gray-500">
                   <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Sold By</p>
                  <p className="text-sm font-bold text-gray-900">{product.sellerName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-3 text-gray-900">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {product.nutritionalInfo && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg mb-3 text-gray-900">Nutritional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-xl text-sm leading-relaxed italic border border-gray-100">
                      {product.nutritionalInfo}
                    </p>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <p className="text-green-800 font-bold text-sm mb-1 uppercase tracking-wider">Health Tip</p>
                      <p className="text-green-700 text-xs">Rich in antioxidants and vitamins A, C, and E.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-3xl border border-green-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-green-900">Why A2ZEE Microgreens?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {[
                     { icon: "Leaf", text: "40x more nutrients than mature veg" },
                     { icon: "Droplets", text: "Fresh, organic, pesticide-free" },
                     { icon: "Zap", text: "Delivered within 2 hours" },
                     { icon: "Home", text: "Grown locally in controlled environment" }
                   ].map((item, idx) => (
                     <div key={idx} className="flex items-center gap-3 text-green-800">
                       <div className="bg-white p-2 rounded-lg shadow-sm">
                         <Star className="w-4 h-4 text-green-600" />
                       </div>
                       <span className="text-sm font-medium">{item.text}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            {/* Desktop Action Bar */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 md:sticky md:bottom-8 z-20">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-600"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="px-6 font-bold text-xl min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-600"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 flex gap-4 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 h-16 rounded-2xl border-2 font-bold text-lg hover:bg-gray-50"
                    onClick={() => navigate('/cart')}
                  >
                    Go to Cart
                  </Button>
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex-[2] h-16 rounded-2xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 font-bold text-lg"
                  >
                    <ShoppingCart className="w-5 h-5 mr-3" />
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </div>
              </div>
              <p className="text-center text-gray-400 text-xs mt-4 font-medium uppercase tracking-widest">
                Safe & Secure Checkout • Free Delivery over ₹500
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
