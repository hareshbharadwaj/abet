import { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { Product, Category } from '../../../types';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, Leaf, Sprout, Package, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();
  const { products } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const categories: Category[] = [
    { id: '1', name: 'Microgreens', icon: 'leaf', productCount: products.filter(p => p.category === 'Microgreens').length },
    { id: '2', name: 'Seeds', icon: 'sprout', productCount: products.filter(p => p.category === 'Seeds').length },
    { id: '3', name: 'Grow Kits', icon: 'package', productCount: products.filter(p => p.category === 'Grow Kits').length },
    { id: '4', name: 'Accessories', icon: 'droplets', productCount: products.filter(p => p.category === 'Accessories').length },
  ];

  useEffect(() => {
    loadFeaturedProducts();
  }, [products]);

  const loadFeaturedProducts = () => {
    try {
      const featured = products
        .filter(p => p.featured && p.status === 'approved')
        .slice(0, 6);
      setFeaturedProducts(featured);
    } catch (error) {
      console.error('Error loading products:', error);
    }
    setLoading(false);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'leaf': return <Leaf className="w-6 h-6" />;
      case 'sprout': return <Sprout className="w-6 h-6" />;
      case 'package': return <Package className="w-6 h-6" />;
      case 'droplets': return <Droplets className="w-6 h-6" />;
      default: return <Leaf className="w-6 h-6" />;
    }
  };

  return (
    <div className="pb-10 md:pb-20">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 md:p-12 rounded-b-3xl shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">A2ZEE MICROGREENZ</h1>
            <p className="text-green-100 text-lg opacity-90">Fresh organic microgreens delivered to your doorstep</p>
          </div>
          <div className="relative md:hidden w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search fresh microgreens, seeds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/products?search=${searchQuery}`)}
              className="pl-10 bg-white border-0 text-gray-900 h-12 rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 md:space-y-12">
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 bg-white border-none shadow-sm"
                onClick={() => navigate(`/products?category=${category.name}`)}
              >
                <CardContent className="p-4 md:p-6 flex items-center gap-4">
                  <div className="bg-green-100 p-3 md:p-4 rounded-2xl text-green-600">
                    {getCategoryIcon(category.icon)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 md:text-lg">{category.name}</h3>
                    <p className="text-xs md:text-sm text-gray-500">{category.productCount} items</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 rounded-2xl md:rounded-3xl p-6 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10 flex-1 text-center md:text-left">
            <Badge className="bg-white/20 text-white mb-4 hover:bg-white/30 border-none px-4 py-1">Limited Time Offer</Badge>
            <h3 className="text-3xl md:text-5xl font-bold mb-4">Flash Sale</h3>
            <p className="text-lg md:text-xl text-green-50 mb-6 max-w-md">Get up to 30% off on premium seeds and grow kits. Valid till stocks last!</p>
            <Button className="bg-white text-green-700 hover:bg-green-50 font-bold px-8 py-6 rounded-xl text-lg h-auto shadow-lg" onClick={() => navigate('/products')}>
              Shop Now
            </Button>
          </div>
          <div className="hidden md:flex flex-1 justify-end relative">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
             <Package className="w-48 h-48 text-white/20" />
          </div>
        </div>

        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500">Hand-picked premium selections for you</p>
            </div>
            <Button
              variant="link"
              onClick={() => navigate('/products')}
              className="text-green-600 font-semibold"
            >
              View All
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse border-none shadow-sm">
                  <CardContent className="p-0">
                    <div className="bg-gray-200 h-48 md:h-64 rounded-t-2xl"></div>
                    <div className="p-4 space-y-3">
                      <div className="bg-gray-200 h-5 rounded w-3/4"></div>
                      <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer group hover:shadow-2xl transition-all duration-300 border-none shadow-sm overflow-hidden rounded-2xl"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <CardContent className="p-0 relative h-full flex flex-col">
                    <div className="relative overflow-hidden aspect-[4/5]">
                      <img
                        src={product.imageUrl || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors"></div>
                      {product.stock < 10 && (
                        <Badge className="absolute top-3 right-3 bg-red-500 shadow-md">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                      <div>
                        <h3 className="font-bold text-gray-900 md:text-lg line-clamp-2 leading-tight group-hover:text-green-700 transition-colors">{product.name}</h3>
                        <p className="text-xs md:text-sm text-gray-400 mt-1 uppercase tracking-wider font-medium">{product.category}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-green-600 font-bold text-lg md:text-xl">₹{product.price}</p>
                        <p className="text-[10px] md:text-xs text-gray-400 font-medium">By {product.sellerName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
