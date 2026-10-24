import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { Order, OrderStatus, CatalogueProduct, CuratedBox } from '../../../types';
import { wellnessRanges } from '../catalogueData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { generateInvoiceHTML, parseOrderDate } from '../../../utils/emailService';
import { sendAutomatedWhatsAppMessage } from '../../../utils/whatsappService';
import { LOGO_DATA_URI } from '../../../utils/logoDataUri';
import { SEAL_SIGNATURE_ORIGINAL_DATA_URI } from '../../../utils/sealDataUri';
import { 
  ShoppingBag, 
  IndianRupee, 
  CreditCard,
  MessageSquare, 
  MessageCircle,
  Globe, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Search, 
  TrendingUp, 
  CheckCircle,
  Truck,
  Package,
  XCircle,
  Clock,
  FileSpreadsheet,
  Edit,
  Trash2,
  Plus,
  RotateCcw,
  Leaf,
  Layers,
  Sparkles,
  Save,
  X,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { MonthlyReportModal } from './MonthlyReportModal';
import { BuyOfflineModal } from './BuyOfflineModal';

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { 
    orders, 
    updateOrderStatus,
    updateOrderProcessingDate,
    updateOrderPaymentMethod,
    updateOrderPaymentStatus,
    catalogueProducts,
    curatedBoxes,
    updateCatalogueProduct,
    addCatalogueProduct,
    deleteCatalogueProduct,
    updateCuratedBox,
    addCuratedBox,
    deleteCuratedBox,
    resetCatalogueToDefaults
  } = useData();

  // Top Nav Tab State
  const [activeTab, setActiveTab] = useState<'orders' | 'catalogue'>('orders');

  // Orders Filters
  const [filterSource, setFilterSource] = useState<'all' | 'whatsapp' | 'offline' | 'app'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterDate, setSelectedFilterDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<Order | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isBuyOfflineModalOpen, setIsBuyOfflineModalOpen] = useState(false);

  // Catalogue Control States
  const [catalogueSubTab, setCatalogueSubTab] = useState<'varieties' | 'boxes'>('varieties');
  const [varietySearch, setVarietySearch] = useState('');
  const [selectedRangeId, setSelectedRangeId] = useState('all');
  const [editingVariety, setEditingVariety] = useState<CatalogueProduct | null>(null);
  const [isAddingVariety, setIsAddingVariety] = useState(false);
  const [varietyFormData, setVarietyFormData] = useState<{
    id: string;
    name: string;
    tamilName: string;
    subtitle: string;
    description: string;
    keyNutrientsStr: string;
    price50g: string;
    price100g: string;
    price500g: string;
    price1kg: string;
    rangeId: string;
    image: string;
  }>({
    id: '',
    name: '',
    tamilName: '',
    subtitle: '',
    description: '',
    keyNutrientsStr: '',
    price50g: '',
    price100g: '',
    price500g: '',
    price1kg: '',
    rangeId: 'range-01',
    image: '',
  });

  const [editingBox, setEditingBox] = useState<CuratedBox | null>(null);
  const [isAddingBox, setIsAddingBox] = useState(false);
  const [boxFormData, setBoxFormData] = useState<{
    id: string;
    name: string;
    subtitle: string;
    description: string;
    itemsStr: string;
    price: string;
    color: string;
    includesLabel: string;
  }>({
    id: '',
    name: '',
    subtitle: '',
    description: '',
    itemsStr: '',
    price: '',
    color: 'amber',
    includesLabel: '',
  });

  // Deduplicate orders by ID
  const uniqueOrdersMap = new Map<string, Order>();
  orders.forEach(o => {
    if (o && o.id) uniqueOrdersMap.set(o.id, o);
  });
  const uniqueOrders = Array.from(uniqueOrdersMap.values());

  // Stats calculation
  const visibleOrders = uniqueOrders;
  const totalOrders = visibleOrders.length;
  const whatsappOrders = uniqueOrders.filter(o => (o.orderSource || 'whatsapp') === 'whatsapp').length;
  const offlineOrders = uniqueOrders.filter(o => o.orderSource === 'offline').length;
  const appOrders = uniqueOrders.filter(o => o.orderSource === 'app').length;
  const totalRevenue = visibleOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  
  // Filtered orders
  const filteredOrders = uniqueOrders.filter(order => {
    const src = order.orderSource || 'whatsapp';
    if (filterSource !== 'all' && src !== filterSource) return false;
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (filterPaymentStatus === 'paid' && order.paymentStatus !== 'completed') return false;
    if (filterPaymentStatus === 'unpaid' && order.paymentStatus === 'completed') return false;
    if (selectedFilterDate) {
      const createdDateStr = parseOrderDate(order.createdAt).toISOString().split('T')[0];
      const processingDateStr = order.processingDate ? order.processingDate : null;
      if (createdDateStr !== selectedFilterDate && processingDateStr !== selectedFilterDate) {
        return false;
      }
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(query);
      const matchName = order.userName.toLowerCase().includes(query);
      const matchPhone = order.userPhone.includes(query);
      const matchEmail = order.userEmail?.toLowerCase().includes(query) || false;
      const matchCity = order.address.city.toLowerCase().includes(query);
      return matchId || matchName || matchPhone || matchEmail || matchCity;
    }
    return true;
  });

  const handleProcessingDateChange = async (orderId: string, newDate: string) => {
    try {
      await updateOrderProcessingDate(orderId, newDate);
      toast.success(`Processing date scheduled for ${newDate}`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, processingDate: newDate } : null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to set processing date');
    }
  };

  const handlePaymentMethodChange = async (orderId: string, newMethod: 'cod' | 'razorpay') => {
    try {
      await updateOrderPaymentMethod(orderId, newMethod);
      toast.success(`Payment method set to ${newMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment'}`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, paymentMethod: newMethod } : null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update payment method');
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: 'pending' | 'completed' | 'failed') => {
    try {
      await updateOrderPaymentStatus(orderId, newPaymentStatus);
      const label = newPaymentStatus === 'completed' ? 'Paid / Received' : newPaymentStatus === 'failed' ? 'Failed' : 'Pending / Unpaid';
      toast.success(`Payment status updated to ${label}`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, paymentStatus: newPaymentStatus } : null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update payment status');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update order status');
    }
  };

  const handleConfirmWhatsAppOrder = async (order: Order) => {
    try {
      if (order.status === 'pending') {
        await updateOrderStatus(order.id, 'accepted');
        if (selectedOrder?.id === order.id) {
          setSelectedOrder(prev => prev ? { ...prev, status: 'accepted' } : null);
        }
      }

      // Strip non-digits and any leading zeros (e.g. 06374258264 -> 6374258264)
      let phone = order.userPhone.replace(/\D/g, '').replace(/^0+/, '');
      if (phone.length === 10) {
        phone = '91' + phone;
      }

      const itemsList = order.items
        .map((item, i) => `${i + 1}. *${item.productName}* x ${item.quantity} - ₹${item.price * item.quantity}`)
        .join('\n');

      const baseUrl = (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))
        ? 'https://a2zee-8c9b1.web.app'
        : window.location.origin;
      const invoiceUrl = `${baseUrl}/#/invoice/${order.id}`;
      const paymentLink = `${baseUrl}/#/pay/${order.id}`;
      const upiDirectUri = `upi://pay?pa=judy.je.gopal@okhdfcbank&pn=A2Zee%20Microgreenz&am=${order.totalAmount}&cu=INR&tn=${encodeURIComponent(`Order ${order.id}`)}`;

      const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment';
      const addressStr = `${order.address.line1}${order.address.line2 ? ', ' + order.address.line2 : ''}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`;
      const emailNote = order.userEmail
        ? `Your invoice has been sent to ${order.userEmail}.`
        : 'Your invoice is available at the link above.';

      const processingDateStr = order.processingDate
        ? `\n📅 *Target Processing Date:* We will process your order on *${new Date(order.processingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}*.`
        : '';

      const message = `Hi ${order.userName},

Thank you for ordering from *A2Zee Microgreenz*! 🌿
Your order has been confirmed.
${processingDateStr}

*Order ID:* ${order.id}

*Items Ordered:*
${itemsList}

*Total Amount:* ₹${order.totalAmount}
*Payment Method:* ${paymentLabel}

💳 *Direct UPI App Link (GPay / PhonePe / Paytm):*
👉 ${upiDirectUri}

*Delivery Address:*
${addressStr}

*A2Zee Invoice:* ${invoiceUrl}

${emailNote}

Please reply to this message after completing payment (Screenshot of payment). If you have any queries, feel free to ask or reply to this message! 😊`.trim();

      const result = await sendAutomatedWhatsAppMessage(order.userPhone, message);
      if (result.method === 'cloud_api') {
        toast.success('Order confirmed & WhatsApp message automatically sent to customer!');
      } else {
        toast.success('Order confirmed & WhatsApp opened!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to confirm order on WhatsApp');
    }
  };

  // Catalogue Handlers
  const handleOpenEditVariety = (v: CatalogueProduct) => {
    setEditingVariety(v);
    setVarietyFormData({
      id: v.id,
      name: v.name || '',
      tamilName: v.tamilName || '',
      subtitle: v.subtitle || '',
      description: v.description || '',
      keyNutrientsStr: (v.keyNutrients || []).join(', '),
      price50g: v.prices['50g'] !== undefined ? String(v.prices['50g']) : '',
      price100g: v.prices['100g'] !== undefined ? String(v.prices['100g']) : '',
      price500g: v.prices['500g'] !== undefined ? String(v.prices['500g']) : '',
      price1kg: v.prices['1kg'] !== undefined ? String(v.prices['1kg']) : '',
      rangeId: v.rangeId || 'range-01',
      image: v.image || '',
    });
    setIsAddingVariety(false);
  };

  const handleOpenAddVariety = () => {
    const nextId = `mc-${String(catalogueProducts.length + 1).padStart(2, '0')}`;
    setEditingVariety(null);
    setVarietyFormData({
      id: nextId,
      name: '',
      tamilName: '',
      subtitle: '',
      description: '',
      keyNutrientsStr: '',
      price50g: '100',
      price100g: '200',
      price500g: '',
      price1kg: '',
      rangeId: 'range-01',
      image: '/green_gram.png',
    });
    setIsAddingVariety(true);
  };

  const handleSaveVariety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varietyFormData.name || !varietyFormData.id) {
      toast.error('Product Name and ID are required');
      return;
    }

    const pricesObj: CatalogueProduct['prices'] = {};
    if (varietyFormData.price50g) pricesObj['50g'] = Number(varietyFormData.price50g);
    if (varietyFormData.price100g) pricesObj['100g'] = Number(varietyFormData.price100g);
    if (varietyFormData.price500g) pricesObj['500g'] = Number(varietyFormData.price500g);
    if (varietyFormData.price1kg) pricesObj['1kg'] = Number(varietyFormData.price1kg);

    const keyNutrients = varietyFormData.keyNutrientsStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload: CatalogueProduct = {
      id: varietyFormData.id,
      name: varietyFormData.name,
      tamilName: varietyFormData.tamilName,
      subtitle: varietyFormData.subtitle,
      description: varietyFormData.description,
      keyNutrients,
      prices: pricesObj,
      rangeId: varietyFormData.rangeId,
      image: varietyFormData.image || '/green_gram.png',
    };

    try {
      if (isAddingVariety) {
        await addCatalogueProduct(payload);
        toast.success(`Variety "${payload.name}" added to Firestore`);
      } else {
        await updateCatalogueProduct(payload.id, payload);
        toast.success(`Variety "${payload.name}" updated in Firestore`);
      }
      setIsAddingVariety(false);
      setEditingVariety(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save variety in Firestore');
    }
  };

  const handleDeleteVariety = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete variety "${name}"?`)) return;
    try {
      await deleteCatalogueProduct(id);
      toast.success(`Variety "${name}" deleted from Firestore`);
    } catch (err) {
      toast.error('Failed to delete variety');
    }
  };

  const handleOpenEditBox = (b: CuratedBox) => {
    setEditingBox(b);
    setBoxFormData({
      id: b.id,
      name: b.name || '',
      subtitle: b.subtitle || '',
      description: b.description || '',
      itemsStr: (b.items || []).join(', '),
      price: String(b.price || 0),
      color: b.color || 'amber',
      includesLabel: b.includesLabel || '',
    });
    setIsAddingBox(false);
  };

  const handleOpenAddBox = () => {
    const nextId = `box-${String(curatedBoxes.length + 1).padStart(2, '0')}`;
    setEditingBox(null);
    setBoxFormData({
      id: nextId,
      name: '',
      subtitle: '',
      description: '',
      itemsStr: '',
      price: '300',
      color: 'amber',
      includesLabel: '',
    });
    setIsAddingBox(true);
  };

  const handleSaveBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boxFormData.name || !boxFormData.id) {
      toast.error('Box Name and ID are required');
      return;
    }

    const items = boxFormData.itemsStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload: CuratedBox = {
      id: boxFormData.id,
      name: boxFormData.name,
      subtitle: boxFormData.subtitle,
      description: boxFormData.description,
      items,
      price: Number(boxFormData.price) || 0,
      color: boxFormData.color,
      includesLabel: boxFormData.includesLabel || undefined,
    };

    try {
      if (isAddingBox) {
        await addCuratedBox(payload);
        toast.success(`Curated Box "${payload.name}" added to Firestore`);
      } else {
        await updateCuratedBox(payload.id, payload);
        toast.success(`Curated Box "${payload.name}" updated in Firestore`);
      }
      setIsAddingBox(false);
      setEditingBox(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save curated box in Firestore');
    }
  };

  const handleDeleteBox = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete box "${name}"?`)) return;
    try {
      await deleteCuratedBox(id);
      toast.success(`Curated box "${name}" deleted from Firestore`);
    } catch (err) {
      toast.error('Failed to delete curated box');
    }
  };

  const handleResetCatalogue = async () => {
    if (!window.confirm('Reset all Catalogue Varieties & Wellness Boxes to original defaults in Firestore?')) return;
    try {
      await resetCatalogueToDefaults();
      toast.success('Catalogue reset to factory defaults in Firestore!');
    } catch (err) {
      toast.error('Failed to reset catalogue');
    }
  };

  // Filtered Varieties
  const filteredVarieties = catalogueProducts.filter(v => {
    if (selectedRangeId !== 'all' && v.rangeId !== selectedRangeId) return false;
    if (varietySearch) {
      const q = varietySearch.toLowerCase();
      const matchName = v.name?.toLowerCase().includes(q);
      const matchTamil = v.tamilName?.toLowerCase().includes(q);
      const matchSubtitle = v.subtitle?.toLowerCase().includes(q);
      return matchName || matchTamil || matchSubtitle;
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Accepted</Badge>;
      case 'packed':
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Packed</Badge>;
      case 'out_for_delivery':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Out for Delivery</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Delivered</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSourceBadge = (source?: 'app' | 'whatsapp' | 'offline') => {
    if (source === 'offline') {
      return (
        <Badge className="bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1 w-fit font-bold">
          <Building2 className="w-3 h-3 text-amber-900" />
          Buy Offline
        </Badge>
      );
    }
    if (source === 'whatsapp') {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1 w-fit">
          <MessageSquare className="w-3 h-3 fill-emerald-800 text-emerald-800" />
          WhatsApp Form
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 w-fit">
        <Globe className="w-3 h-3 text-blue-800" />
        Web Store App
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-green-800 via-emerald-800 to-green-950 text-white py-6 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Seller Dashboard</h1>
            <p className="text-green-100/80 text-xs mt-0.5 font-medium">Order Management & Website Landing Page Control</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setIsBuyOfflineModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs py-2.5 px-4 rounded-2xl shadow-lg border border-amber-300 transition-all hover:scale-105 flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-amber-950" />
              🛒 Buy Offline / Create Invoice
            </Button>
            <Button
              onClick={() => navigate('/admin/reviews')}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 px-4 rounded-2xl border border-white/20 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-200" />
              User Reviews
            </Button>
            <Button
              onClick={() => setIsReportModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-2xl shadow-lg border border-emerald-400/30 transition-all hover:scale-105 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              Monthly Sales Report
            </Button>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-sm font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
              Firestore Real-Time Sync
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-8 flex items-center gap-3 border-t border-white/10 pt-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'orders' 
                ? 'bg-white text-green-900 shadow-md scale-105' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Orders & Metrics
          </button>
          <button
            onClick={() => setActiveTab('catalogue')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'catalogue' 
                ? 'bg-white text-green-900 shadow-md scale-105' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Leaf className="w-4 h-4" />
            Landing Page Catalogue & Pricing ({catalogueProducts.length} Varieties)
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-6 space-y-6">
        {activeTab === 'orders' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3.5 bg-green-50 rounded-2xl text-green-700">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Active Orders</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{totalOrders}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-700">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">WhatsApp Orders</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{whatsappOrders}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3.5 bg-amber-50 rounded-2xl text-amber-700">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-0.5">₹{totalRevenue.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Bar */}
            <Card className="border-none shadow-sm rounded-2xl bg-white p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by Order ID, Customer Name, Phone, Email, City…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 rounded-xl bg-gray-50 border-gray-200 text-sm focus-visible:ring-green-600"
                  />
                </div>

                {/* Source Filter Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit gap-1">
                  <button
                    onClick={() => setFilterSource('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      filterSource === 'all' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    All ({visibleOrders.length})
                  </button>
                  <button
                    onClick={() => setFilterSource('whatsapp')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      filterSource === 'whatsapp' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp ({whatsappOrders})
                  </button>
                  <button
                    onClick={() => setFilterSource('offline')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      filterSource === 'offline' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Buy Offline ({offlineOrders})
                  </button>
                  <button
                    onClick={() => setFilterSource('app')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      filterSource === 'app' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Web Store ({appOrders})
                  </button>
                </div>

                {/* Status Dropdown Filter */}
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 cursor-pointer"
                >
                  <option value="all">All Delivery Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="packed">Packed</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* Payment Status Filter Dropdown */}
                <select
                  value={filterPaymentStatus}
                  onChange={e => setFilterPaymentStatus(e.target.value as 'all' | 'paid' | 'unpaid')}
                  className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="paid">✅ Paid Only</option>
                  <option value="unpaid">⏳ Unpaid / Pending Only</option>
                </select>

                {/* Single Date Picker Filter */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedFilterDate}
                    onChange={e => setSelectedFilterDate(e.target.value)}
                    className="h-10 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 cursor-pointer"
                  />
                  {selectedFilterDate && (
                    <button
                      onClick={() => setSelectedFilterDate('')}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all shrink-0"
                    >
                      Clear Date
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* Orders Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Order List Table */}
              <div className="lg:col-span-7 space-y-3 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                {filteredOrders.length === 0 ? (
                  <Card className="p-12 text-center border-none shadow-sm rounded-2xl bg-white">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold">No orders found matching filters</p>
                  </Card>
                ) : (
                  filteredOrders.map(order => {
                    const isSelected = selectedOrder?.id === order.id;
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`p-5 rounded-2xl transition-all cursor-pointer border bg-white ${
                          isSelected
                            ? 'border-green-600 ring-2 ring-green-600/20 shadow-md bg-green-50/20'
                            : 'border-gray-150 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-gray-900 text-sm">{order.id}</span>
                              {getSourceBadge(order.orderSource)}
                            </div>
                            <h4 className="font-bold text-gray-800 mt-1.5 text-base">{order.userName}</h4>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                              <span>{order.userPhone}</span>
                              {order.address?.city && <span>• {order.address.city}</span>}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            {getStatusBadge(order.status)}
                            <p className="text-lg font-black text-gray-950 mt-1">₹{order.totalAmount}</p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
                          <span>{parseOrderDate(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Order Detail View */}
              <div className="lg:col-span-5 lg:sticky lg:top-20">
                {selectedOrder ? (
                  <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white flex flex-col max-h-[calc(100vh-7rem)]">
                    <CardHeader className="bg-gray-50/80 border-b border-gray-100 pb-4 shrink-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-extrabold text-gray-900">Order Details</CardTitle>
                          <p className="text-xs text-gray-400 mt-0.5">{selectedOrder.id}</p>
                        </div>
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                      {/* Customer Info */}
                      <div>
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Info</h5>
                        <div className="bg-gray-50 p-4 rounded-xl space-y-1.5 text-sm">
                          <p className="font-bold text-gray-900">{selectedOrder.userName}</p>
                          <p className="text-gray-600 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedOrder.userPhone}</p>
                          {selectedOrder.userEmail && (
                            <p className="text-gray-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> {selectedOrder.userEmail}</p>
                          )}
                          <p className="text-gray-600 flex items-start gap-2 pt-1 border-t border-gray-200/60 mt-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span>
                              {selectedOrder.address.line1}
                              {selectedOrder.address.line2 ? `, ${selectedOrder.address.line2}` : ''},{' '}
                              {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Delivery Status Selector */}
                      <div>
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Update Delivery Status</h5>
                        <select
                          value={selectedOrder.status}
                          onChange={e => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                          className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-green-600 focus:outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="packed">Packed</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      {/* Payment Method & Payment Paid/Unpaid Reference Card */}
                      <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-emerald-50/60 p-4 rounded-2xl border border-blue-100/90 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-blue-700" />
                            Payment Method & Status Reference
                          </h5>
                          <Badge className={
                            selectedOrder.paymentStatus === 'completed' 
                              ? 'bg-emerald-600 text-white font-black text-[11px] px-2.5 py-0.5'
                              : 'bg-amber-500 text-white font-black text-[11px] px-2.5 py-0.5'
                          }>
                            {selectedOrder.paymentStatus === 'completed' ? 'PAID ✓' : 'UNPAID / PENDING'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Payment Method Selector */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Payment Method</label>
                            <select
                              value={selectedOrder.paymentMethod}
                              onChange={e => handlePaymentMethodChange(selectedOrder.id, e.target.value as 'cod' | 'razorpay')}
                              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-extrabold text-gray-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                            >
                              <option value="cod">Cash on Delivery (COD)</option>
                              <option value="razorpay">Online Payment (GPay / PhonePe / UPI)</option>
                            </select>
                          </div>

                          {/* Payment Paid / Unpaid Status Selector */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Payment Status</label>
                            <select
                              value={selectedOrder.paymentStatus || 'pending'}
                              onChange={e => handlePaymentStatusChange(selectedOrder.id, e.target.value as 'pending' | 'completed' | 'failed')}
                              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-extrabold text-gray-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                            >
                              <option value="pending">⏳ Unpaid / Pending</option>
                              <option value="completed">✅ Paid / Received</option>
                              <option value="failed">❌ Failed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Scheduled Processing Date Calendar */}
                      <div>
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                          Target Processing Date
                        </h5>
                        <input
                          type="date"
                          min={(() => {
                            if (!selectedOrder.createdAt) return new Date().toISOString().split('T')[0];
                            const d = new Date(selectedOrder.createdAt);
                            d.setDate(d.getDate() + 1);
                            return d.toISOString().split('T')[0];
                          })()}
                          value={selectedOrder.processingDate || ''}
                          onChange={e => handleProcessingDateChange(selectedOrder.id, e.target.value)}
                          className="w-full h-11 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-green-600 focus:outline-none cursor-pointer"
                        />
                        {selectedOrder.processingDate ? (
                          <div className="mt-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>
                              We will process your order on{' '}
                              <strong className="font-extrabold underline text-emerald-950">
                                {new Date(selectedOrder.processingDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </strong>
                            </span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 mt-1 font-medium">
                            Select a calendar date to inform the customer when their order will be processed.
                          </p>
                        )}
                      </div>

                      {/* Order Items */}
                      <div>
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ordered Items</h5>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {selectedOrder.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                              <div className="flex items-center gap-3">
                                {item.imageUrl && (
                                  <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 rounded-lg object-cover" />
                                )}
                                <div>
                                  <p className="font-bold text-gray-900">{item.productName}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity} x ₹{item.price}</p>
                                </div>
                              </div>
                              <span className="font-black text-gray-950">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="border-t border-gray-150 pt-3 flex justify-between items-center text-base">
                        <span className="font-extrabold text-gray-900">Total Order Amount</span>
                        <span className="font-black text-green-700 text-xl">₹{selectedOrder.totalAmount}</span>
                      </div>

                      {/* Invoice & WhatsApp Action Buttons */}
                      <div className="border-t border-gray-150 pt-4 space-y-2">
                        <Button
                          onClick={() => setViewingInvoiceOrder(selectedOrder)}
                          className="w-full bg-green-800 hover:bg-green-700 text-white rounded-xl py-3 font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
                        >
                          View Invoice Details
                        </Button>
                        <Button
                          onClick={() => handleConfirmWhatsAppOrder(selectedOrder)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-sm shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Confirm Order on WhatsApp
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white p-8 text-center border-dashed border-2 border-gray-200">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold">Select an order</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">Click any order in the list to view full details and update delivery status.</p>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}

        {/* CATALOGUE & PRICING CONTROL TAB */}
        {activeTab === 'catalogue' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <Card className="border-none shadow-sm rounded-2xl bg-white p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setCatalogueSubTab('varieties')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        catalogueSubTab === 'varieties'
                          ? 'bg-green-800 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Leaf className="w-4 h-4" />
                      22 Varieties & Weight Prices ({catalogueProducts.length})
                    </button>
                    <button
                      onClick={() => setCatalogueSubTab('boxes')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        catalogueSubTab === 'boxes'
                          ? 'bg-green-800 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      Curated Wellness Boxes ({curatedBoxes.length})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setIsResetModalOpen(true)}
                    variant="outline"
                    className="border-gray-200 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl h-10 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to Defaults
                  </Button>
                  {catalogueSubTab === 'varieties' ? (
                    <Button
                      onClick={handleOpenAddVariety}
                      className="bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl h-10 shadow-md flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Add Variety
                    </Button>
                  ) : (
                    <Button
                      onClick={handleOpenAddBox}
                      className="bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl h-10 shadow-md flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Add Curated Box
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* VARIETIES SECTION */}
            {catalogueSubTab === 'varieties' && (
              <div className="space-y-4">
                {/* Search & Range Filters */}
                <Card className="border-none shadow-sm rounded-2xl bg-white p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search varieties by English name, Tamil name, or subtitle…"
                        value={varietySearch}
                        onChange={e => setVarietySearch(e.target.value)}
                        className="pl-10 h-10 rounded-xl bg-gray-50 border-gray-200 text-sm focus-visible:ring-green-600"
                      />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                      <button
                        onClick={() => setSelectedRangeId('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          selectedRangeId === 'all'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        All Ranges
                      </button>
                      {wellnessRanges.map(r => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRangeId(r.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            selectedRangeId === r.id
                              ? 'bg-emerald-800 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {r.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Varieties Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVarieties.map(variety => {
                    const rangeObj = wellnessRanges.find(r => r.id === variety.rangeId);
                    return (
                      <Card key={variety.id} className="border border-gray-150 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white overflow-hidden flex flex-col justify-between">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                              <img src={variety.image} alt={variety.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                                  {variety.id}
                                </span>
                                {rangeObj && (
                                  <span className="text-[10px] font-bold text-gray-500 truncate max-w-[110px]">
                                    {rangeObj.title}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-extrabold text-gray-900 text-base mt-1 truncate">
                                {variety.name} <span className="font-medium text-emerald-800 text-xs">({variety.tamilName})</span>
                              </h3>
                              <p className="text-xs text-gray-500 font-medium truncate">{variety.subtitle}</p>
                            </div>
                          </div>

                          <p className="text-xs text-gray-600 line-clamp-2">{variety.description}</p>

                          {/* Prices List */}
                          <div className="bg-gray-50 p-3 rounded-xl space-y-1 border border-gray-150">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Configured Prices (Firestore)</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {variety.prices['50g'] !== undefined && (
                                <span className="bg-white px-2.5 py-1 rounded-lg border text-xs font-bold text-gray-800">
                                  50g: <span className="text-green-700 font-black">₹{variety.prices['50g']}</span>
                                </span>
                              )}
                              {variety.prices['100g'] !== undefined && (
                                <span className="bg-white px-2.5 py-1 rounded-lg border text-xs font-bold text-gray-800">
                                  100g: <span className="text-green-700 font-black">₹{variety.prices['100g']}</span>
                                </span>
                              )}
                              {variety.prices['500g'] !== undefined && (
                                <span className="bg-white px-2.5 py-1 rounded-lg border text-xs font-bold text-gray-800">
                                  500g: <span className="text-green-700 font-black">₹{variety.prices['500g']}</span>
                                </span>
                              )}
                              {variety.prices['1kg'] !== undefined && (
                                <span className="bg-white px-2.5 py-1 rounded-lg border text-xs font-bold text-gray-800">
                                  1kg: <span className="text-green-700 font-black">₹{variety.prices['1kg']}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Key Nutrients */}
                          {variety.keyNutrients && variety.keyNutrients.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {variety.keyNutrients.map((n, idx) => (
                                <span key={idx} className="bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                                  {n}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>

                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-150 flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleDeleteVariety(variety.id, variety.name)}
                            variant="outline"
                            className="h-8 px-3 text-red-600 hover:bg-red-50 border-gray-200 text-xs font-bold rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                          </Button>
                          <Button
                            onClick={() => handleOpenEditVariety(variety)}
                            className="h-8 px-3 bg-green-800 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" /> Edit Variety & Price
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CURATED BOXES SECTION */}
            {catalogueSubTab === 'boxes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {curatedBoxes.map(box => (
                  <Card key={box.id} className="border border-gray-150 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white overflow-hidden flex flex-col justify-between">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                            {box.id}
                          </span>
                          <h3 className="font-extrabold text-gray-900 text-lg mt-1">{box.name}</h3>
                          <p className="text-xs text-gray-500 font-medium">{box.subtitle}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-green-800">₹{box.price}</span>
                          <p className="text-[10px] text-gray-400 font-semibold">Fixed Box Price</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600">{box.description}</p>

                      <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-150">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {box.includesLabel || 'Included Items:'}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {box.items.map((item, idx) => (
                            <span key={idx} className="bg-white border border-gray-200 text-gray-800 font-bold text-xs px-2.5 py-1 rounded-lg shadow-2xs">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>

                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-150 flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleDeleteBox(box.id, box.name)}
                        variant="outline"
                        className="h-8 px-3 text-red-600 hover:bg-red-50 border-gray-200 text-xs font-bold rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                      <Button
                        onClick={() => handleOpenEditBox(box)}
                        className="h-8 px-3 bg-green-800 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit Box & Price
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT / ADD VARIETY MODAL */}
      {(editingVariety || isAddingVariety) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full my-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-150 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-700" />
                {isAddingVariety ? 'Add New Variety' : `Edit Variety (${varietyFormData.name})`}
              </h3>
              <button
                onClick={() => { setEditingVariety(null); setIsAddingVariety(false); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVariety} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Variety ID *</label>
                  <Input
                    value={varietyFormData.id}
                    onChange={e => setVarietyFormData({ ...varietyFormData, id: e.target.value })}
                    placeholder="e.g. mc-23"
                    disabled={!isAddingVariety}
                    className="h-10 rounded-xl bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">English Name *</label>
                  <Input
                    value={varietyFormData.name}
                    onChange={e => setVarietyFormData({ ...varietyFormData, name: e.target.value })}
                    placeholder="e.g. Green Gram"
                    className="h-10 rounded-xl bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Tamil Name</label>
                  <Input
                    value={varietyFormData.tamilName}
                    onChange={e => setVarietyFormData({ ...varietyFormData, tamilName: e.target.value })}
                    placeholder="e.g. பாசிப்பயறு"
                    className="h-10 rounded-xl bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Wellness Range</label>
                  <select
                    value={varietyFormData.rangeId}
                    onChange={e => setVarietyFormData({ ...varietyFormData, rangeId: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-600"
                  >
                    {wellnessRanges.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Subtitle / Flavour Profile</label>
                <Input
                  value={varietyFormData.subtitle}
                  onChange={e => setVarietyFormData({ ...varietyFormData, subtitle: e.target.value })}
                  placeholder="e.g. Sweet, crisp, juicy"
                  className="h-10 rounded-xl bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  value={varietyFormData.description}
                  onChange={e => setVarietyFormData({ ...varietyFormData, description: e.target.value })}
                  rows={3}
                  placeholder="Full description of health benefits and taste…"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                />
              </div>

              {/* Weight Pricing Box */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <h4 className="font-extrabold text-emerald-950 text-xs uppercase tracking-wider">Weight-Wise Price Configuration (₹)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">50g Pack (₹)</label>
                    <Input
                      type="number"
                      value={varietyFormData.price50g}
                      onChange={e => setVarietyFormData({ ...varietyFormData, price50g: e.target.value })}
                      placeholder="e.g. 50"
                      className="h-10 rounded-xl bg-white font-bold text-green-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">100g Pack (₹)</label>
                    <Input
                      type="number"
                      value={varietyFormData.price100g}
                      onChange={e => setVarietyFormData({ ...varietyFormData, price100g: e.target.value })}
                      placeholder="e.g. 100"
                      className="h-10 rounded-xl bg-white font-bold text-green-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">500g Sprouts (₹)</label>
                    <Input
                      type="number"
                      value={varietyFormData.price500g}
                      onChange={e => setVarietyFormData({ ...varietyFormData, price500g: e.target.value })}
                      placeholder="e.g. 200"
                      className="h-10 rounded-xl bg-white font-bold text-green-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">1kg Sprouts (₹)</label>
                    <Input
                      type="number"
                      value={varietyFormData.price1kg}
                      onChange={e => setVarietyFormData({ ...varietyFormData, price1kg: e.target.value })}
                      placeholder="e.g. 350"
                      className="h-10 rounded-xl bg-white font-bold text-green-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Image URL or Local Path</label>
                <Input
                  value={varietyFormData.image}
                  onChange={e => setVarietyFormData({ ...varietyFormData, image: e.target.value })}
                  placeholder="e.g. /Green Gram.png or https://…"
                  className="h-10 rounded-xl bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Key Nutrients (Comma Separated)</label>
                <Input
                  value={varietyFormData.keyNutrientsStr}
                  onChange={e => setVarietyFormData({ ...varietyFormData, keyNutrientsStr: e.target.value })}
                  placeholder="e.g. Protein, Fibre, Vit C, Folate, Iron"
                  className="h-10 rounded-xl bg-gray-50"
                />
              </div>

              <div className="pt-4 border-t border-gray-150 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setEditingVariety(null); setIsAddingVariety(false); }}
                  className="h-10 rounded-xl font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 bg-green-800 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save to Firestore
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / ADD CURATED BOX MODAL */}
      {(editingBox || isAddingBox) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full my-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-150 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-green-700" />
                {isAddingBox ? 'Add New Curated Wellness Box' : `Edit Box (${boxFormData.name})`}
              </h3>
              <button
                onClick={() => { setEditingBox(null); setIsAddingBox(false); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBox} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Box ID *</label>
                  <Input
                    value={boxFormData.id}
                    onChange={e => setBoxFormData({ ...boxFormData, id: e.target.value })}
                    placeholder="e.g. box-06"
                    disabled={!isAddingBox}
                    className="h-10 rounded-xl bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Box Price (₹) *</label>
                  <Input
                    type="number"
                    value={boxFormData.price}
                    onChange={e => setBoxFormData({ ...boxFormData, price: e.target.value })}
                    placeholder="e.g. 350"
                    className="h-10 rounded-xl bg-white font-bold text-green-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Box Name *</label>
                <Input
                  value={boxFormData.name}
                  onChange={e => setBoxFormData({ ...boxFormData, name: e.target.value })}
                  placeholder="e.g. Everyday Family Box"
                  className="h-10 rounded-xl bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Subtitle</label>
                <Input
                  value={boxFormData.subtitle}
                  onChange={e => setBoxFormData({ ...boxFormData, subtitle: e.target.value })}
                  placeholder="e.g. The daily basics, mild enough for children."
                  className="h-10 rounded-xl bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  value={boxFormData.description}
                  onChange={e => setBoxFormData({ ...boxFormData, description: e.target.value })}
                  rows={2}
                  placeholder="Box contents summary..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Included Varieties (Comma Separated)</label>
                <Input
                  value={boxFormData.itemsStr}
                  onChange={e => setBoxFormData({ ...boxFormData, itemsStr: e.target.value })}
                  placeholder="e.g. Green Gram, Black Gram, Ragi, Pearl Millet"
                  className="h-10 rounded-xl bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Color Theme Tag</label>
                  <select
                    value={boxFormData.color}
                    onChange={e => setBoxFormData({ ...boxFormData, color: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-600"
                  >
                    <option value="amber">Amber</option>
                    <option value="red">Red</option>
                    <option value="teal">Teal</option>
                    <option value="pink">Pink</option>
                    <option value="green">Green</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Includes Label (Optional)</label>
                  <Input
                    value={boxFormData.includesLabel}
                    onChange={e => setBoxFormData({ ...boxFormData, includesLabel: e.target.value })}
                    placeholder="e.g. Includes 3 x 50g + 500g sprouts:"
                    className="h-10 rounded-xl bg-gray-50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setEditingBox(null); setIsAddingBox(false); }}
                  className="h-10 rounded-xl font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 bg-green-800 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save to Firestore
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal Overlay */}
      {viewingInvoiceOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-150 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-950 text-base">Invoice Preview</h3>
                <p className="text-xs text-gray-400 mt-0.5">Order ID: {viewingInvoiceOrder.id}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow && viewingInvoiceOrder) {
                      const htmlStr = '<!DOCTYPE html><html><head><title>Invoice - ' + viewingInvoiceOrder.id + '</title><style>body { margin: 20px; background-color: #1a1a1a; font-family: sans-serif; }</style></head><body>' + generateInvoiceHTML(viewingInvoiceOrder, LOGO_DATA_URI, SEAL_SIGNATURE_ORIGINAL_DATA_URI) + '<script>window.onload = function() { window.print(); };</script></body></html>';
                      printWindow.document.write(htmlStr);
                      printWindow.document.close();
                    }
                  }}
                  variant="outline" 
                  className="rounded-xl font-bold text-xs h-9 border-gray-300"
                >
                  Print / Save as PDF
                </Button>
                <Button 
                  onClick={() => setViewingInvoiceOrder(null)}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs h-9"
                >
                  Close
                </Button>
              </div>
            </div>
            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6 bg-[#121212] flex justify-center items-start">
              <div className="w-full max-w-[600px] overflow-x-auto rounded-2xl" dangerouslySetInnerHTML={{ __html: generateInvoiceHTML(viewingInvoiceOrder, LOGO_DATA_URI, SEAL_SIGNATURE_ORIGINAL_DATA_URI) }} />
            </div>
          </div>
        </div>
      )}

      {/* Monthly Sales Report Modal */}
      <MonthlyReportModal 
        orders={orders} 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
      />

      {/* RESET CATALOGUE CONFIRMATION MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-2xl text-red-700">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Reset Catalogue Data?</h3>
                <p className="text-xs text-gray-500">Restore factory default varieties & pricing</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-200 leading-relaxed">
              Are you sure you want to reset all <strong>22 Varieties</strong> and <strong>Curated Wellness Boxes</strong> to their original default values in <strong>Firestore</strong>?
              <br /><br />
              <span className="text-red-600 font-bold">Warning:</span> Any custom prices, variety names, or custom boxes you added will be overwritten with initial factory defaults.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsResetModalOpen(false)}
                className="h-10 rounded-xl font-bold text-xs border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    toast.loading('Resetting catalogue in Firestore…', { id: 'reset-cat' });
                    await resetCatalogueToDefaults();
                    toast.success('Catalogue reset to factory defaults in Firestore!', { id: 'reset-cat' });
                    setIsResetModalOpen(false);
                  } catch (err) {
                    toast.error('Failed to reset catalogue data', { id: 'reset-cat' });
                  }
                }}
                className="h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Yes, Reset All Data
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Buy Offline Modal */}
      <BuyOfflineModal
        isOpen={isBuyOfflineModalOpen}
        onClose={() => setIsBuyOfflineModalOpen(false)}
      />
    </div>
  );
}
