import { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { Order, OrderItem, OrderStatus, CatalogueProduct, CuratedBox } from '../../../types';
import { sendAutomatedWhatsAppMessage } from '../../../utils/whatsappService';
import { sendOrderEmail } from '../../../utils/emailService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  X, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  IndianRupee, 
  Share2, 
  MessageSquare, 
  Printer, 
  Copy, 
  Check, 
  Sparkles,
  Building2,
  Calendar,
  CheckCircle,
  FileText,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface BuyOfflineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (order: Order) => void;
}

export function BuyOfflineModal({ isOpen, onClose, onOrderCreated }: BuyOfflineModalProps) {
  const { catalogueProducts, curatedBoxes, products, createGuestOrder } = useData();

  // Mode: 'form' | 'success'
  const [modalMode, setModalMode] = useState<'form' | 'success'>('form');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // Customer Details Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Chennai');
  const [state, setState] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('600041');

  // Order Details Form
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [paymentStatus, setPaymentStatus] = useState<'completed' | 'pending'>('completed');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('accepted');
  const [processingDate, setProcessingDate] = useState('');

  // Items Selection
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [productType, setProductType] = useState<'catalogue' | 'box' | 'custom'>('catalogue');
  
  // Catalogue selection state
  const [selectedCatalogueId, setSelectedCatalogueId] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<'50g' | '100g' | '500g' | '1kg'>('100g');
  const [catalogueItemPrice, setCatalogueItemPrice] = useState<number>(0);
  const [catalogueItemQty, setCatalogueItemQty] = useState<number>(1);

  // Box selection state
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [boxItemPrice, setBoxItemPrice] = useState<number>(0);
  const [boxItemQty, setBoxItemQty] = useState<number>(1);

  // Custom item state
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState<number>(1);

  // Helper to update catalogue price based on selected variant
  const updateCataloguePrice = (prod: CatalogueProduct, variant: '50g' | '100g' | '500g' | '1kg') => {
    const price = prod.prices?.[variant] || 0;
    setCatalogueItemPrice(price);
  };

  const handleCatalogueChange = (prodId: string) => {
    setSelectedCatalogueId(prodId);
    const prod = catalogueProducts.find(p => p.id === prodId);
    if (prod) {
      updateCataloguePrice(prod, selectedVariant);
    }
  };

  const handleVariantChange = (variant: '50g' | '100g' | '500g' | '1kg') => {
    setSelectedVariant(variant);
    const prod = catalogueProducts.find(p => p.id === selectedCatalogueId);
    if (prod) {
      updateCataloguePrice(prod, variant);
    }
  };

  const handleBoxChange = (boxId: string) => {
    setSelectedBoxId(boxId);
    const box = curatedBoxes.find(b => b.id === boxId);
    if (box) {
      setBoxItemPrice(box.price || 0);
    }
  };

  // Initialize selected catalogue product when type changes
  useEffect(() => {
    if (catalogueProducts.length > 0 && !selectedCatalogueId) {
      const first = catalogueProducts[0];
      setSelectedCatalogueId(first.id);
      updateCataloguePrice(first, '100g');
    }
  }, [catalogueProducts]);

  useEffect(() => {
    if (curatedBoxes.length > 0 && !selectedBoxId) {
      const firstBox = curatedBoxes[0];
      setSelectedBoxId(firstBox.id);
      setBoxItemPrice(firstBox.price || 0);
    }
  }, [curatedBoxes]);

  // Add Item to List
  const handleAddCatalogueItem = () => {
    const prod = catalogueProducts.find(p => p.id === selectedCatalogueId);
    if (!prod) return;

    if (catalogueItemPrice <= 0 || catalogueItemQty <= 0) {
      toast.error('Please specify valid price and quantity');
      return;
    }

    const newItem: OrderItem = {
      productId: `cat-${prod.id}-${selectedVariant}`,
      productName: `${prod.name} (${selectedVariant})`,
      price: catalogueItemPrice,
      quantity: catalogueItemQty,
      imageUrl: prod.image || '/greengram.png',
    };

    setSelectedItems(prev => [...prev, newItem]);
    toast.success(`Added ${newItem.productName} to offline order`);
  };

  const handleAddBoxItem = () => {
    const box = curatedBoxes.find(b => b.id === selectedBoxId);
    if (!box) return;

    if (boxItemPrice <= 0 || boxItemQty <= 0) {
      toast.error('Please specify valid price and quantity');
      return;
    }

    const newItem: OrderItem = {
      productId: `box-${box.id}`,
      productName: box.name,
      price: boxItemPrice,
      quantity: boxItemQty,
      imageUrl: '/greengram.png',
    };

    setSelectedItems(prev => [...prev, newItem]);
    toast.success(`Added ${box.name} to offline order`);
  };

  const handleAddCustomItem = () => {
    if (!customName.trim()) {
      toast.error('Please enter product name');
      return;
    }

    const priceNum = Number(customPrice);
    if (isNaN(priceNum) || priceNum <= 0 || customQty <= 0) {
      toast.error('Please enter valid price and quantity');
      return;
    }

    const newItem: OrderItem = {
      productId: `custom-${Date.now()}`,
      productName: customName.trim(),
      price: priceNum,
      quantity: customQty,
      imageUrl: '/greengram.png',
    };

    setSelectedItems(prev => [...prev, newItem]);
    setCustomName('');
    setCustomPrice('');
    setCustomQty(1);
    toast.success(`Added ${newItem.productName} to offline order`);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Submit Form and Create Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (!customerPhone.trim()) {
      toast.error('Customer phone number is required');
      return;
    }

    if (!addressLine1.trim()) {
      toast.error('Delivery address line 1 is required');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one product to the offline order');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await createGuestOrder(
        selectedItems,
        {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          line1: addressLine1.trim(),
          line2: addressLine2.trim(),
          city: city.trim() || 'Chennai',
          state: state.trim() || 'Tamil Nadu',
          pincode: pincode.trim() || '600041',
        },
        {
          name: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim(),
        },
        paymentMethod,
        'offline',
        paymentStatus,
        orderStatus,
        processingDate || undefined
      );

      setCreatedOrder(order);
      setModalMode('success');
      toast.success(`Offline Order #${order.id} generated!`);
      if (onOrderCreated) {
        onOrderCreated(order);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create offline order invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = async () => {
    if (!createdOrder) return;
    try {
      const baseUrl = (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))
        ? 'https://a2zee-8c9b1.web.app'
        : window.location.origin;

      const invoiceUrl = `${baseUrl}/#/invoice/${createdOrder.id}`;
      const upiDirectUri = `upi://pay?pa=judy.je.gopal@okhdfcbank&pn=A2Zee%20Microgreenz&am=${createdOrder.totalAmount}&cu=INR&tn=${encodeURIComponent(`Offline Order ${createdOrder.id}`)}`;

      const itemsList = createdOrder.items
        .map((item, i) => `${i + 1}. *${item.productName}* x ${item.quantity} - ₹${item.price * item.quantity}`)
        .join('\n');

      const paymentLabel = createdOrder.paymentMethod === 'cod' ? 'Cash / COD' : 'Online / UPI';
      const statusLabel = createdOrder.paymentStatus === 'completed' ? 'Paid / Received ✅' : 'Pending / Unpaid ⏳';

      const message = `Hi ${createdOrder.userName},

Thank you for purchasing from *A2Zee Microgreenz*! 🌿
Here is your official offline sale invoice details:

*Invoice ID:* ${createdOrder.id}

*Items Purchased:*
${itemsList}

*Total Amount:* ₹${createdOrder.totalAmount}
*Payment Method:* ${paymentLabel} (${statusLabel})

💳 *Direct UPI App Link (GPay / PhonePe / Paytm):*
👉 ${upiDirectUri}

*Official A2Zee Invoice PDF & View:*
${invoiceUrl}

If you have any questions or future orders, reply to this WhatsApp chat! 😊`.trim();

      const res = await sendAutomatedWhatsAppMessage(createdOrder.userPhone, message);
      if (res.method === 'cloud_api') {
        toast.success('WhatsApp invoice automatically dispatched to customer!');
      } else {
        toast.success('WhatsApp link opened to share invoice!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to share via WhatsApp');
    }
  };

  // Email Share Handler
  const handleSendEmail = async () => {
    if (!createdOrder || !createdOrder.userEmail) {
      toast.error('No customer email address provided for this order');
      return;
    }

    setEmailSending(true);
    try {
      const res = await sendOrderEmail(createdOrder);
      if (res.success) {
        toast.success(`Invoice email sent to ${createdOrder.userEmail}!`);
      } else {
        toast.error(`Email dispatch notice: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to send invoice email');
    } finally {
      setEmailSending(false);
    }
  };

  // Copy Public Link
  const handleCopyLink = () => {
    if (!createdOrder) return;
    const baseUrl = (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))
      ? 'https://a2zee-8c9b1.web.app'
      : window.location.origin;
    const invoiceUrl = `${baseUrl}/#/invoice/${createdOrder.id}`;
    navigator.clipboard.writeText(invoiceUrl);
    setCopiedLink(true);
    toast.success('Public invoice link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Reset form for creating another order
  const handleResetForm = () => {
    setModalMode('form');
    setCreatedOrder(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setAddressLine1('');
    setAddressLine2('');
    setSelectedItems([]);
    setProcessingDate('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-br from-green-800 via-emerald-800 to-green-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <Building2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Buy Offline / Invoice Generator</h2>
              <p className="text-xs text-green-100/80 font-medium mt-0.5">
                Select products, set customer details, create instant invoice & share via WhatsApp / Email.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[calc(85vh-100px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {modalMode === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Info Section */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/80 space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-green-700" />
                  Customer & Delivery Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. John Doe / Hotel Green Leaf"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="bg-white rounded-xl h-10 border-gray-200 text-sm font-medium focus-visible:ring-green-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Customer Phone / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="bg-white rounded-xl h-10 border-gray-200 text-sm font-medium focus-visible:ring-green-600"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Customer Email <span className="text-gray-400 font-normal">(Optional, for auto invoice email)</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="e.g. customer@gmail.com"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      className="bg-white rounded-xl h-10 border-gray-200 text-sm font-medium focus-visible:ring-green-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Door No, Street Name, Landmark"
                      value={addressLine1}
                      onChange={e => setAddressLine1(e.target.value)}
                      className="bg-white rounded-xl h-10 border-gray-200 text-sm font-medium focus-visible:ring-green-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Area / Line 2</label>
                    <Input
                      placeholder="Area, Colony, etc."
                      value={addressLine2}
                      onChange={e => setAddressLine2(e.target.value)}
                      className="bg-white rounded-xl h-10 border-gray-200 text-sm font-medium focus-visible:ring-green-600"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                      <Input
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="bg-white rounded-xl h-10 border-gray-200 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                      <Input
                        value={state}
                        onChange={e => setState(e.target.value)}
                        className="bg-white rounded-xl h-10 border-gray-200 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                      <Input
                        value={pincode}
                        onChange={e => setPincode(e.target.value)}
                        className="bg-white rounded-xl h-10 border-gray-200 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Selection Section */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-green-700" />
                    Select Products & Quantities
                  </h3>

                  {/* Tabs */}
                  <div className="flex bg-gray-200/80 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setProductType('catalogue')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        productType === 'catalogue' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Microgreens
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductType('box')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        productType === 'box' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Wellness Boxes
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductType('custom')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        productType === 'custom' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Custom Item
                    </button>
                  </div>
                </div>

                {/* Sub-form based on productType */}
                {productType === 'catalogue' && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Select Variety</label>
                        <select
                          value={selectedCatalogueId}
                          onChange={e => handleCatalogueChange(e.target.value)}
                          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-green-600 focus:outline-none"
                        >
                          {catalogueProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.tamilName ? `(${p.tamilName})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Select Variant Weight</label>
                        <select
                          value={selectedVariant}
                          onChange={e => handleVariantChange(e.target.value as any)}
                          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-green-600 focus:outline-none"
                        >
                          <option value="50g">50g (₹{catalogueProducts.find(p => p.id === selectedCatalogueId)?.prices['50g'] || 0})</option>
                          <option value="100g">100g (₹{catalogueProducts.find(p => p.id === selectedCatalogueId)?.prices['100g'] || 0})</option>
                          <option value="500g">500g (₹{catalogueProducts.find(p => p.id === selectedCatalogueId)?.prices['500g'] || 0})</option>
                          <option value="1kg">1kg (₹{catalogueProducts.find(p => p.id === selectedCatalogueId)?.prices['1kg'] || 0})</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <div className="w-1/3">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Unit Price (₹)</label>
                        <Input
                          type="number"
                          value={catalogueItemPrice}
                          onChange={e => setCatalogueItemPrice(Number(e.target.value))}
                          className="h-10 text-xs font-bold bg-gray-50"
                        />
                      </div>
                      <div className="w-1/3">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Quantity</label>
                        <Input
                          type="number"
                          min="1"
                          value={catalogueItemQty}
                          onChange={e => setCatalogueItemQty(Math.max(1, Number(e.target.value)))}
                          className="h-10 text-xs font-bold bg-gray-50"
                        />
                      </div>
                      <div className="w-1/3 flex items-end">
                        <Button
                          type="button"
                          onClick={handleAddCatalogueItem}
                          className="w-full h-10 bg-green-700 hover:bg-green-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Add Item
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {productType === 'box' && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Select Curated Box</label>
                        <select
                          value={selectedBoxId}
                          onChange={e => handleBoxChange(e.target.value)}
                          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-green-600 focus:outline-none"
                        >
                          {curatedBoxes.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.name} (₹{b.price})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-1/2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹)</label>
                          <Input
                            type="number"
                            value={boxItemPrice}
                            onChange={e => setBoxItemPrice(Number(e.target.value))}
                            className="h-10 text-xs font-bold bg-gray-50"
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Quantity</label>
                          <Input
                            type="number"
                            min="1"
                            value={boxItemQty}
                            onChange={e => setBoxItemQty(Math.max(1, Number(e.target.value)))}
                            className="h-10 text-xs font-bold bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        onClick={handleAddBoxItem}
                        className="bg-green-700 hover:bg-green-600 text-white font-bold text-xs rounded-xl px-6 h-10 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add Box Item
                      </Button>
                    </div>
                  </div>
                )}

                {productType === 'custom' && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Custom Product Description</label>
                        <Input
                          placeholder="e.g. Special Bulk Microgreen Bundle"
                          value={customName}
                          onChange={e => setCustomName(e.target.value)}
                          className="h-10 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Unit Price (₹)</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={customPrice}
                          onChange={e => setCustomPrice(e.target.value)}
                          className="h-10 text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="w-32">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Quantity</label>
                        <Input
                          type="number"
                          min="1"
                          value={customQty}
                          onChange={e => setCustomQty(Math.max(1, Number(e.target.value)))}
                          className="h-10 text-xs font-bold bg-gray-50"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="bg-green-700 hover:bg-green-600 text-white font-bold text-xs rounded-xl px-6 h-10 flex items-center gap-1 mt-auto"
                      >
                        <Plus className="w-4 h-4" /> Add Custom Item
                      </Button>
                    </div>
                  </div>
                )}

                {/* Selected Items Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-3">
                  <div className="bg-gray-100/70 px-4 py-2.5 border-b border-gray-200 flex justify-between items-center text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    <span>Selected Invoice Items ({selectedItems.length})</span>
                    <span>Subtotal: ₹{totalAmount}</span>
                  </div>

                  {selectedItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 font-medium">
                      No items added yet. Select a product above and click "Add Item".
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {selectedItems.map((item, index) => (
                        <div key={index} className="p-3.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-400 w-5">{index + 1}.</span>
                            <div>
                              <p className="font-bold text-gray-900">{item.productName}</p>
                              <p className="text-gray-500">₹{item.price} x {item.quantity}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-black text-gray-950 text-sm">₹{item.price * item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment & Status Settings */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/80 space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-green-700" />
                  Payment & Delivery Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as any)}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-green-600 focus:outline-none"
                    >
                      <option value="cod">Cash on Delivery / Cash Offline</option>
                      <option value="razorpay">UPI / Online Direct Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={e => setPaymentStatus(e.target.value as any)}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-green-600 focus:outline-none"
                    >
                      <option value="completed">✅ Paid / Received</option>
                      <option value="pending">⏳ Pending / Unpaid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Status</label>
                    <select
                      value={orderStatus}
                      onChange={e => setOrderStatus(e.target.value as OrderStatus)}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-green-600 focus:outline-none"
                    >
                      <option value="accepted">Accepted</option>
                      <option value="delivered">Delivered</option>
                      <option value="pending">Pending</option>
                      <option value="packed">Packed</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Scheduled Harvest / Processing Date (Optional)</label>
                    <input
                      type="date"
                      value={processingDate}
                      onChange={e => setProcessingDate(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-green-600 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Total & Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
                <div>
                  <span className="text-xs font-bold text-gray-500 block">Total Offline Invoice Amount</span>
                  <span className="text-2xl font-black text-gray-950">₹{totalAmount}</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="w-1/2 sm:w-auto rounded-xl font-bold text-xs h-11 px-6 border-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || selectedItems.length === 0}
                    className="w-1/2 sm:w-auto bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl h-11 px-8 shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Invoice & Save Order
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            /* Success / Share Sheet View */
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-gray-900">Offline Invoice Generated!</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Order ID: <span className="font-mono font-bold text-emerald-800">{createdOrder?.id}</span> | Total: <span className="font-extrabold text-gray-900">₹{createdOrder?.totalAmount}</span>
                </p>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-2">
                <Button
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-12 rounded-2xl shadow-md flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Share Invoice via WhatsApp
                </Button>

                {createdOrder?.userEmail ? (
                  <Button
                    onClick={handleSendEmail}
                    disabled={emailSending}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-12 rounded-2xl shadow-md flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {emailSending ? 'Sending Email...' : 'Send Invoice Email'}
                  </Button>
                ) : (
                  <Button
                    disabled
                    variant="outline"
                    className="border-gray-200 text-gray-400 font-bold text-xs h-12 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Mail className="w-4 h-4" />
                    No Email Provided
                  </Button>
                )}

                <Button
                  onClick={() => {
                    const baseUrl = (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))
                      ? 'https://a2zee-8c9b1.web.app'
                      : window.location.origin;
                    window.open(`${baseUrl}/#/invoice/${createdOrder?.id}`, '_blank');
                  }}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100 text-gray-800 font-bold text-xs h-12 rounded-2xl flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-gray-600" />
                  View / Print A4 Invoice
                </Button>

                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100 text-gray-800 font-bold text-xs h-12 rounded-2xl flex items-center justify-center gap-2"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                  {copiedLink ? 'Link Copied!' : 'Copy Public Invoice Link'}
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-4">
                <Button
                  onClick={handleResetForm}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs h-10 px-6 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Another Offline Order
                </Button>

                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-800 font-bold text-xs h-10 px-6"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
