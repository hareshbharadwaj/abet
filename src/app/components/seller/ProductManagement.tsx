import { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Product } from '../../../types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export function ProductManagement() {
  const { user } = useAuth();
  const { getProductsBySeller, addProduct, updateProduct, deleteProduct } = useData();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Microgreens',
    stock: 0,
    nutritionalInfo: '',
  });

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = () => {
    if (!user) return;

    try {
      const sellerProducts = getProductsBySeller(user.uid);
      setProducts(sellerProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      let imageUrl = editingProduct?.imageUrl || '';

      if (imageFile) {
        // Convert image to base64 for local storage or use placeholder
        const reader = new FileReader();
        reader.onloadend = async () => {
          imageUrl = reader.result as string;
          await saveProduct(imageUrl);
        };
        reader.readAsDataURL(imageFile);
      } else {
        await saveProduct(imageUrl);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
      setLoading(false);
    }
  };

  const saveProduct = async (imageUrl: string) => {
    if (!user) return;

    try {
      const productData = {
        ...formData,
        sellerId: user.uid,
        sellerName: user.name,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400',
        status: 'pending' as const,
        featured: false,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast.success('Product updated successfully');
      } else {
        await addProduct(productData);
        toast.success('Product added successfully');
      }

      setDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
    setLoading(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      nutritionalInfo: product.nutritionalInfo || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        toast.success('Product deleted');
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'Microgreens',
      stock: 0,
      nutritionalInfo: '',
    });
    setEditingProduct(null);
    setImageFile(null);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6">
        <h1 className="text-2xl">Product Management</h1>
        <p className="text-green-100">{products.length} products listed</p>
      </div>

      <div className="p-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mb-4" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Microgreens">Microgreens</SelectItem>
                    <SelectItem value="Seeds">Seeds</SelectItem>
                    <SelectItem value="Grow Kits">Grow Kits</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nutritionalInfo">Nutritional Info (Optional)</Label>
                <Textarea
                  id="nutritionalInfo"
                  value={formData.nutritionalInfo}
                  onChange={(e) => setFormData({ ...formData, nutritionalInfo: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="image">Product Image</Label>
                <div className="mt-2">
                  <label htmlFor="image" className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="w-5 h-5 mr-2" />
                    <span>{imageFile ? imageFile.name : 'Choose image'}</span>
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Saving...' : editingProduct ? 'Update' : 'Add Product'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id}>
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
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-green-600">₹{product.price}</span>
                      <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.status === 'approved' ? 'bg-green-100 text-green-700' :
                        product.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
