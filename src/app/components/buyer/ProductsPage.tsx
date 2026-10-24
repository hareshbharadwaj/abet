import { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { Product } from '../../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { SlidersHorizontal, X } from 'lucide-react';
import { Package } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';

export function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { products: allProducts } = useData();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');

  const categories = ['all', 'Microgreens', 'Seeds', 'Grow Kits', 'Accessories'];

  useEffect(() => {
    loadProducts();
  }, [sortBy, selectedCategory, allProducts, priceRange]);

  const loadProducts = () => {
    setLoading(true);
    try {
      let filtered = allProducts.filter(p => p.status === 'approved');

      if (selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category === selectedCategory);
      }

      filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

      if (sortBy === 'price_low') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price_high') {
        filtered.sort((a, b) => b.price - a.price);
      } else {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      setProducts(filtered.slice(0, 20));
    } catch (error) {
      console.error('Error loading products:', error);
    }
    setLoading(false);
  };

  return (
    <div className="pb-10 md:pb-20">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">Our Products</h1>
          <p className="text-green-100 text-lg opacity-90">Fresh organic microgreens delivered fast</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden md:block w-64 shrink-0 space-y-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-900">Categories</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl transition-all ${
                      selectedCategory === cat 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-900">Price Range</h3>
              <Slider
                min={0}
                max={1000}
                step={50}
                value={priceRange}
                onValueChange={setPriceRange}
                className="my-6"
              />
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <span className="bg-gray-100 px-3 py-1 rounded-lg">₹{priceRange[0]}</span>
                <span className="bg-gray-100 px-3 py-1 rounded-lg">₹{priceRange[1]}</span>
              </div>
            </div>

            <Button onClick={loadProducts} className="w-full bg-green-600 hover:bg-green-700 h-12 rounded-xl font-bold">
              Apply Filters
            </Button>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filters & Sort */}
            <div className="flex gap-3 mb-6 md:mb-8">
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-xl border-gray-200">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full sm:max-w-xs">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-8 space-y-8">
                      <div>
                        <h3 className="font-bold mb-4">Category</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {categories.map(cat => (
                            <Button
                              key={cat}
                              variant={selectedCategory === cat ? 'default' : 'outline'}
                              className="justify-start rounded-xl"
                              onClick={() => setSelectedCategory(cat)}
                            >
                              {cat}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold mb-4">Price Range</h3>
                        <Slider
                          min={0}
                          max={1000}
                          step={50}
                          value={priceRange}
                          onValueChange={setPriceRange}
                        />
                        <div className="flex justify-between mt-4 text-sm font-medium">
                          <span>₹{priceRange[0]}</span>
                          <span>₹{priceRange[1]}</span>
                        </div>
                      </div>

                      <Button onClick={loadProducts} className="w-full bg-green-600 h-12 rounded-xl">
                        Apply Filters
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 w-full md:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popular">Popularity</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedCategory !== 'all' && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary" className="pl-3 pr-1 py-1 gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-none rounded-full">
                  Category: {selectedCategory}
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="p-1 hover:bg-green-200 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="animate-pulse border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-gray-200 h-48 md:h-64"></div>
                      <div className="p-4 space-y-3">
                        <div className="bg-gray-200 h-5 rounded w-3/4"></div>
                        <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
                <Button variant="outline" onClick={() => {setSelectedCategory('all'); setPriceRange([0, 1000]);}} className="mt-6 rounded-xl">
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer group hover:shadow-2xl transition-all duration-300 border-none shadow-sm overflow-hidden rounded-2xl bg-white"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <CardContent className="p-0 relative flex flex-col h-full">
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <img
                          src={product.imageUrl || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400'}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors"></div>
                        {product.featured && (
                          <Badge className="absolute top-3 left-3 bg-yellow-500 shadow-md">
                            Featured
                          </Badge>
                        )}
                        {product.stock < 10 && (
                          <Badge className="absolute top-3 right-3 bg-red-500 shadow-md">
                            Low Stock
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 md:text-lg line-clamp-2 leading-tight group-hover:text-green-700 transition-colors">{product.name}</h3>
                          <p className="text-xs md:text-sm text-gray-400 mt-1 uppercase tracking-wider font-medium">{product.category}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-green-600 font-bold text-lg md:text-xl">₹{product.price}</p>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all">
                            +
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
