import { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { Product } from '../../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Check, X, Star } from 'lucide-react';
import { toast } from 'sonner';

export function ProductControl() {
  const { products: allProducts, updateProduct } = useData();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [allProducts]);

  const loadProducts = () => {
    try {
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
    setLoading(false);
  };

  const updateProductStatus = async (productId: string, status: 'approved' | 'rejected') => {
    try {
      await updateProduct(productId, { status });
      toast.success(`Product ${status}`);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const toggleFeatured = async (productId: string, featured: boolean) => {
    try {
      await updateProduct(productId, { featured: !featured });
      toast.success(featured ? 'Removed from featured' : 'Added to featured');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const filterProducts = (status?: string) => {
    if (status) return products.filter(p => p.status === status);
    return products;
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=200'}
            alt={product.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-sm text-gray-600">{product.category}</p>
            <p className="text-green-600 mt-1">₹{product.price}</p>
            <p className="text-xs text-gray-500">By {product.sellerName}</p>
            <div className="flex gap-2 mt-2">
              <Badge className={
                product.status === 'approved' ? 'bg-green-500' :
                product.status === 'rejected' ? 'bg-red-500' :
                'bg-yellow-500'
              }>
                {product.status}
              </Badge>
              {product.featured && (
                <Badge className="bg-yellow-500">
                  <Star className="w-3 h-3 mr-1 fill-white" />
                  Featured
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {product.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={() => updateProductStatus(product.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateProductStatus(product.id, 'rejected')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
            {product.status === 'approved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleFeatured(product.id, product.featured)}
              >
                <Star className={`w-4 h-4 ${product.featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6">
        <h1 className="text-2xl">Product Control</h1>
        <p className="text-green-100">{products.length} total products</p>
      </div>

      <div className="p-4">
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {products.map(product => <ProductCard key={product.id} product={product} />)}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {filterProducts('pending').map(product => <ProductCard key={product.id} product={product} />)}
          </TabsContent>

          <TabsContent value="approved" className="space-y-3 mt-4">
            {filterProducts('approved').map(product => <ProductCard key={product.id} product={product} />)}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-3 mt-4">
            {filterProducts('rejected').map(product => <ProductCard key={product.id} product={product} />)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
