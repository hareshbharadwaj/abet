import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Leaf, 
  Droplets, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Sun, 
  Wind, 
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Instagram,
  Facebook,
  MessageCircle,
  Award,
  Globe,
  CornerDownRight,
  Menu,
  X,
  Search,
  Info,
  Plus,
  Minus,
  Check,
  Package,
  ShoppingCart,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { reviewStorage } from '../../utils/localStorage';
import { 
  wellnessRanges, 
  products as fallbackProducts, 
  curatedBoxes as fallbackBoxes, 
  nutrientsList, 
  matrixRatings,
  flavourPalette
} from './catalogueData';
import { toast } from 'sonner';

export function LandingPage() {
  const showOrderNowButton = false;
  const { reviews, addReview, deleteReview, createGuestOrder, catalogueProducts, curatedBoxes: dynamicBoxes } = useData();

  const products = catalogueProducts && catalogueProducts.length > 0 ? catalogueProducts : fallbackProducts;
  const curatedBoxes = dynamicBoxes && dynamicBoxes.length > 0 ? dynamicBoxes : fallbackBoxes;
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const navigate = useNavigate();

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this user review? This action cannot be undone.')) {
      try {
        await deleteReview(reviewId);
        toast.success('Review deleted successfully');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete review');
      }
    }
  };
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  // Catalogue & Wellness Box States
  const [activeRangeId, setActiveRangeId] = useState('range-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [customBoxItems, setCustomBoxItems] = useState<string[]>([]);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isCatalogueInView, setIsCatalogueInView] = useState(true);

  // Listen for navigation requests from the AI Assistant
  useEffect(() => {
    const handleNavigate = (e: any) => {
      const { productId, rangeId, isBox, openModal } = e.detail || {};

      if (openModal) {
        if (isBox) {
          const box = curatedBoxes.find(b => b.id === productId);
          if (box) {
            setModalProduct({
              id: box.id,
              name: box.name,
              description: box.description,
              price: box.price,
              image: '',
              items: box.items,
              includesLabel: box.includesLabel
            });
            setModalType('box');
            setIsOrderModalOpen(true);
          }
        } else {
          const prod = products.find(p => p.id === productId);
          if (prod) {
            setModalProduct(prod);
            setModalType('single');
            const sizes = Object.keys(prod.prices);
            if (sizes.length > 0) setSelectedSize(sizes[0]);
            setOrderQuantity(1);
            setIsOrderModalOpen(true);
          }
        }
      }

      if (isBox) {
        setTimeout(() => {
          const boxEl = document.getElementById(`box-card-${productId}`);
          if (boxEl) {
            boxEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            boxEl.classList.add('ring-4', 'ring-emerald-500', 'scale-[1.03]', 'shadow-2xl', 'transition-all', 'duration-500');
            setTimeout(() => boxEl.classList.remove('ring-4', 'ring-emerald-500', 'scale-[1.03]', 'shadow-2xl'), 3000);
          } else {
            document.getElementById('boxes')?.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        return;
      }

      if (rangeId) {
        setActiveRangeId(rangeId);
        setSearchQuery('');
      }

      setTimeout(() => {
        const cardEl = document.getElementById(`product-card-${productId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cardEl.classList.add('ring-4', 'ring-emerald-500', 'scale-[1.03]', 'shadow-2xl', 'transition-all', 'duration-500');
          setTimeout(() => cardEl.classList.remove('ring-4', 'ring-emerald-500', 'scale-[1.03]', 'shadow-2xl'), 3000);
        } else {
          document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    };

    window.addEventListener('a2zee-navigate-product', handleNavigate);
    return () => {
      window.removeEventListener('a2zee-navigate-product', handleNavigate);
    };
  }, []);

  // WhatsApp Order Modal States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<any>(null);
  const [modalType, setModalType] = useState<'single' | 'box' | 'custom'>('single');
  const [selectedSize, setSelectedSize] = useState<string>('50g');
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  
  // WhatsApp Cart & Checkout States
  const [whatsappCart, setWhatsappCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);

  // Buyer Details
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddressLine1, setBuyerAddressLine1] = useState('');
  const [buyerAddressLine2, setBuyerAddressLine2] = useState('');
  const [buyerCity, setBuyerCity] = useState('');
  const [buyerState, setBuyerState] = useState('');
  const [buyerPincode, setBuyerPincode] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Review Form States
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Director Bio Modal State
  const [selectedDirectorBio, setSelectedDirectorBio] = useState<{
    name: string;
    designation: string;
    image: string;
    bio: string;
  } | null>(null);

  // Sync reviews list
  useEffect(() => {
    setReviewsList(reviews);
  }, [reviews]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      let newReview: any;
      if (user) {
        newReview = await addReview(reviewRating, reviewComment);
      } else {
        const guestName = reviewName.trim() || 'Guest Customer';
        newReview = await addReview(reviewRating, reviewComment, guestName);
      }
      
      // Update local state instantly
      setReviewsList(prev => [newReview, ...prev]);
      setReviewComment('');
      setReviewName('');
      setReviewRating(5);
      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (err) {
      console.error(err);
      setSubmitStatus('error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const catalogueEl = document.getElementById('catalogue');
    if (!catalogueEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCatalogueInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(catalogueEl);
    return () => observer.disconnect();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8 }
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.2
      }
    },
    viewport: { once: true }
  };

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Catalogue', href: '#catalogue' },
    { name: 'Wellness Boxes', href: '#boxes' },
    { name: 'About Us', href: '#about' },
    { name: 'Flavour Palette', href: '#flavour-palette' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'Contact Us', href: '#contact' },
  ];

  const aboutCards = [
    { 
      icon: Droplets, 
      title: '100% Hydroponically Grown', 
      desc: 'Clean RO water cultivation with no soil contamination.' 
    },
    { 
      icon: Leaf, 
      title: 'Freshly Harvested Daily', 
      desc: 'Harvested only after receiving orders for maximum freshness.' 
    },
    { 
      icon: ShieldCheck, 
      title: 'Chemical Free', 
      desc: 'No pesticides, herbicides or harmful fertilizers.' 
    },
    { 
      icon: Zap, 
      title: 'Nutrient Dense', 
      desc: 'Contains significantly higher vitamins, minerals and antioxidants than mature vegetables.' 
    },
    { 
      icon: Globe, 
      title: 'Sustainable Farming', 
      desc: 'Uses less water and minimal land while producing maximum nutrition.' 
    },
    { 
      icon: Award, 
      title: 'Farm to Table', 
      desc: 'Freshly packed and delivered hygienically.' 
    },
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery.trim() === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.tamilName.includes(searchQuery) ||
      product.keyNutrients.some(n => n.toLowerCase().includes(searchQuery.toLowerCase())) ||
      product.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (searchQuery.trim() !== '') {
      return matchesSearch;
    }
    return product.rangeId === activeRangeId;
  });

  const techIcons = [
    { icon: Sun, label: 'LED Grow Lights' },
    { icon: Droplets, label: 'Soilless Farming' },
    { icon: Wind, label: 'Climate Control' },
    { icon: ShieldCheck, label: 'Hygienic & Safe' },
  ];

  const footerFeatures = [
    { icon: Leaf, label: '100% Natural', sub: 'No chemicals, no pesticides' },
    { icon: MapPin, label: 'Locally Grown', sub: 'Supporting local farming' },
    { icon: Sun, label: 'Farm Fresh', sub: 'Delivered daily' },
    { icon: Droplets, label: 'Eco Friendly', sub: 'We care for our planet' },
    { icon: Award, label: 'Customer Satisfaction', sub: 'Quality you can trust' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-green-100 selection:text-green-900 overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-green-600 z-[60] origin-left"
        style={{ scaleX }}
      />

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled || isMobileMenuOpen ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src="/logo.png" alt="A2ZEE" className="h-8 sm:h-12 w-auto shrink-0" />
            <span className="flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-2xl font-extrabold text-green-800 tracking-tight">A2ZEE</span>
                <span className="text-xs sm:text-sm font-extrabold text-green-600 tracking-wider uppercase">Microgreenz</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-gray-400 font-extrabold uppercase tracking-wider -mt-0.5 sm:mt-0">Pvt. Ltd.</span>
            </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={(e) => {
                  e.preventDefault();
                  const id = link.href.substring(1);
                  const el = document.getElementById(id);
                  if (el) {
                    const navbarOffset = 80;
                    const elementPosition = el.getBoundingClientRect().top + window.scrollY;
                    const offsetPosition = elementPosition - navbarOffset;
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors duration-300 cursor-pointer"
              >
                {link.name}
              </a>
            ))}
          </div>

          {showOrderNowButton && (
            <div className="hidden lg:flex items-center gap-4">
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-green-800 hover:bg-green-900 text-white px-6 rounded-full font-semibold transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                Order Now
              </Button>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <div className="flex lg:hidden items-center gap-3">
            {showOrderNowButton && (
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-green-800 hover:bg-green-900 text-white px-4 py-2 text-xs rounded-full font-semibold cursor-pointer"
              >
                Order Now
              </Button>
            )}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-green-800 hover:text-green-950 p-1.5 focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Links Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-[64px] sm:top-[72px] left-0 w-full bg-white/95 backdrop-blur-md shadow-lg border-b border-green-50 z-40 lg:hidden overflow-hidden"
          >
            <div className="flex flex-col px-6 py-6 gap-3">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    const id = link.href.substring(1);
                    setTimeout(() => {
                      const el = document.getElementById(id);
                      if (el) {
                        const navbarOffset = 80;
                        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
                        const offsetPosition = elementPosition - navbarOffset;
                        window.scrollTo({
                          top: offsetPosition,
                          behavior: 'smooth'
                        });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="text-base font-bold text-gray-800 hover:text-green-600 transition-colors py-2 border-b border-green-50/50"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Catalogue Section - FIRST SCREEN */}
      <section id="catalogue" className="pt-24 sm:pt-28 pb-20 bg-gradient-to-b from-emerald-50/70 via-white to-green-50/30 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-8">
            <span className="text-emerald-700 font-extrabold tracking-widest text-xs uppercase mb-2 block font-sans">FRESH HYDROPONIC MICROGREENS</span>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
              Explore Our <span className="bg-gradient-to-r from-emerald-700 via-green-700 to-teal-800 bg-clip-text text-transparent">22 Varieties</span>
            </h1>

            {/* Search Bar - Below Title */}
            <div className="max-w-xl mx-auto mb-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700" />
                <input
                  type="text"
                  placeholder="Search by name, Tamil name, or nutrient (e.g. Iron, Protein)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-full border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm shadow-md transition-all duration-300 placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer bg-gray-100 px-2 py-1 rounded-full"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Range Selection Tabs - Horizontal scrollable pill bar on mobile, centered row on desktop */}
          {searchQuery.trim() === '' && (
            <div className="mb-8">
              <div className="flex overflow-x-auto pb-3 pt-1 px-4 -mx-6 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center gap-2.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory touch-pan-x">
                {wellnessRanges.map((range, idx) => {
                  const isActive = activeRangeId === range.id;
                  let activeClass = "";
                  if (range.id === 'range-01') activeClass = "bg-amber-800 text-white border-transparent shadow-amber-900/20";
                  else if (range.id === 'range-02') activeClass = "bg-red-800 text-white border-transparent shadow-red-900/20";
                  else if (range.id === 'range-03') activeClass = "bg-teal-800 text-white border-transparent shadow-teal-900/20";
                  else if (range.id === 'range-04') activeClass = "bg-orange-700 text-white border-transparent shadow-orange-900/20";
                  else if (range.id === 'range-05') activeClass = "bg-pink-800 text-white border-transparent shadow-pink-900/20";
                  else if (range.id === 'range-06') activeClass = "bg-green-800 text-white border-transparent shadow-green-900/20";

                  return (
                    <button
                      key={range.id}
                      onClick={() => setActiveRangeId(range.id)}
                      className={`shrink-0 snap-center px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-xs font-extrabold transition-all duration-300 cursor-pointer border whitespace-nowrap ${
                        isActive 
                          ? `${activeClass} shadow-md scale-[1.02] sm:scale-105` 
                          : 'bg-white border-green-100 text-gray-600 hover:bg-green-50/50 hover:text-green-800 shadow-sm'
                      }`}
                    >
                      <span className="opacity-60 mr-1.5 font-mono">0{idx + 1}</span>
                      {range.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grid display */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {filteredProducts.map((product) => {
              const activeRange = wellnessRanges.find(r => r.id === product.rangeId);
              let rangeBorderClass = "hover:border-amber-400";
              let textAccentColor = "text-amber-800";
              if (product.rangeId === 'range-02') { rangeBorderClass = "hover:border-red-400"; textAccentColor = "text-red-800"; }
              else if (product.rangeId === 'range-03') { rangeBorderClass = "hover:border-teal-400"; textAccentColor = "text-teal-800"; }
              else if (product.rangeId === 'range-04') { rangeBorderClass = "hover:border-orange-450"; textAccentColor = "text-orange-800"; }
              else if (product.rangeId === 'range-05') { rangeBorderClass = "hover:border-pink-400"; textAccentColor = "text-pink-800"; }
              else if (product.rangeId === 'range-06') { rangeBorderClass = "hover:border-green-400"; textAccentColor = "text-green-800"; }

              return (
                <motion.div 
                  key={product.id}
                  id={`product-card-${product.id}`}
                  data-product-id={product.id}
                  data-product-name={product.name.toLowerCase()}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => {
                    setModalProduct(product);
                    setModalType('single');
                    const sizes = Object.keys(product.prices);
                    if (sizes.length > 0) {
                      setSelectedSize(sizes[0]);
                    }
                    setOrderQuantity(1);
                    setIsOrderModalOpen(true);
                  }}
                  className={`bg-white rounded-[2rem] overflow-hidden border border-emerald-100/70 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between ${rangeBorderClass} group cursor-pointer`}
                >
                  <div>
                    {/* Image Area */}
                    <div className="h-56 bg-gradient-to-b from-emerald-50/70 via-white to-green-50/30 overflow-hidden relative flex items-center justify-center border-b border-emerald-100/60">
                      <img 
                        src={encodeURI(product.image || '/greengram.png')} 
                        alt={product.name} 
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.triedFallback) {
                            target.dataset.triedFallback = 'true';
                            target.src = '/greengram.png';
                          }
                        }}
                        className="w-full h-full object-contain p-3 scale-110 group-hover:scale-125 transition-transform duration-500 object-center" 
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-200/80 text-[10px] font-extrabold text-emerald-800 shadow-sm z-10">
                        {activeRange?.title.split(' ')[0]} Care
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-3">
                      <div>
                        <div className="flex justify-between items-baseline gap-1.5">
                          <h4 className="text-base font-extrabold text-gray-900 group-hover:text-emerald-800 transition-colors">{product.name}</h4>
                          <span className="text-[11px] font-black text-emerald-700 font-sans shrink-0">{product.tamilName}</span>
                        </div>
                        <p className="text-[11px] text-emerald-600 font-bold italic mt-0.5">{product.subtitle}</p>
                      </div>
                      
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 font-medium">
                        {product.description}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {product.keyNutrients.map((n, idx) => (
                          <span key={idx} className="bg-emerald-50/80 text-emerald-800 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-100 shadow-2xs">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="px-6 pb-6 pt-3 border-t border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/60">
                      {product.prices['50g'] !== undefined ? (
                        <>
                          <div className="text-left">
                            <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest block mb-0.5">50 Grams</span>
                            <span className="text-sm font-black text-gray-900">₹{product.prices['50g']}</span>
                          </div>
                          <div className="h-6 w-px bg-emerald-200/60" />
                          <div className="text-right">
                            <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest block mb-0.5">100 Grams</span>
                            <span className="text-sm font-black text-emerald-800">₹{product.prices['100g']}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-left">
                            <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest block mb-0.5">500 Grams</span>
                            <span className="text-sm font-black text-gray-900">₹{product.prices['500g']}</span>
                          </div>
                          <div className="h-6 w-px bg-emerald-200/60" />
                          <div className="text-right">
                            <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest block mb-0.5">1 Kilogram</span>
                            <span className="text-sm font-black text-emerald-800">₹{product.prices['1kg']}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setModalProduct(product);
                        setModalType('single');
                        const sizes = Object.keys(product.prices);
                        if (sizes.length > 0) {
                          setSelectedSize(sizes[0]);
                        }
                        setOrderQuantity(1);
                        setIsOrderModalOpen(true);
                      }}
                      className="w-full bg-gradient-to-r from-green-800 via-emerald-800 to-green-900 hover:from-green-900 hover:to-emerald-950 text-white font-extrabold py-3 px-4 rounded-xl text-center text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95 border border-green-700/40"
                    >
                      <MessageCircle className="w-4 h-4 text-white" />
                      Order on WhatsApp
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-green-100/50 shadow-sm mt-8">
              <p className="text-gray-500 font-medium">No microgreens found matching "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs font-bold text-green-800 hover:text-green-900 underline cursor-pointer"
              >
                Clear Search & View All
              </button>
            </div>
          )}

          {/* Active Range Metadata Panel - Displayed Below Products */}
          {searchQuery.trim() === '' && (() => {
            const range = wellnessRanges.find(r => r.id === activeRangeId);
            if (!range) return null;
            
            let borderTheme = "border-amber-200 bg-amber-50/30";
            let textTheme = "text-amber-900";
            let badgeTheme = "bg-amber-100/70 text-amber-900 border-amber-200/50";
            if (range.id === 'range-02') {
              borderTheme = "border-red-200 bg-red-50/30";
              textTheme = "text-red-950";
              badgeTheme = "bg-red-100/70 text-red-950 border-red-200/50";
            } else if (range.id === 'range-03') {
              borderTheme = "border-teal-200 bg-teal-50/30";
              textTheme = "text-teal-950";
              badgeTheme = "bg-teal-100/70 text-teal-950 border-teal-200/50";
            } else if (range.id === 'range-04') {
              borderTheme = "border-orange-200 bg-orange-50/30";
              textTheme = "text-orange-950";
              badgeTheme = "bg-orange-100/70 text-orange-950 border-orange-200/50";
            } else if (range.id === 'range-05') {
              borderTheme = "border-pink-200 bg-pink-50/30";
              textTheme = "text-pink-950";
              badgeTheme = "bg-pink-100/70 text-pink-950 border-pink-200/50";
            } else if (range.id === 'range-06') {
              borderTheme = "border-green-200 bg-green-50/30";
              textTheme = "text-green-950";
              badgeTheme = "bg-green-100/70 text-green-950 border-green-200/50";
            }

            return (
              <motion.div 
                key={range.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`mt-10 p-6 md:p-8 rounded-[2rem] border ${borderTheme} grid md:grid-cols-3 gap-8 items-stretch shadow-sm`}
              >
                <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-bold tracking-widest uppercase bg-green-800 text-white px-2 py-0.5 rounded shadow-sm">
                        Range 0{range.id.split('-')[1]}
                      </span>
                      <h3 className="text-xl md:text-2xl font-black text-green-950 leading-tight">{range.title}</h3>
                      <span className="text-sm md:text-base font-bold text-green-800/80 font-sans TamilName shrink-0">({range.tamilTitle})</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed font-semibold">
                      {range.description}
                    </p>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Range Key Nutrients</p>
                    <div className="flex flex-wrap gap-1.5">
                      {range.keyNutrients.map((n, idx) => (
                        <span key={idx} className={`text-[10px] font-bold px-3 py-1 rounded-full border ${badgeTheme}`}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-white/20 flex flex-col justify-center">
                  <div>
                    <span className="text-[10px] font-black text-green-800 uppercase tracking-widest block mb-1">Best For</span>
                    <p className="text-xs font-bold text-gray-800 leading-snug">{range.bestFor}</p>
                  </div>
                  <div className="border-t border-green-150 pt-3">
                    <span className="text-[10px] font-black text-green-800 uppercase tracking-widest block mb-1">Serving Idea</span>
                    <p className="text-xs text-gray-600 leading-relaxed italic">{range.servingIdea}</p>
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* Catalogue Subtitle - Positioned Below Products */}
          <div className="mt-14 pt-10 border-t border-green-100/80 max-w-2xl mx-auto text-center">
            <p className="text-gray-650 text-sm md:text-base leading-relaxed font-medium">
              Twenty-one soil-less, pesticide-free microgreen varieties plus our RO-water mung bean sprouts — harvested fresh and grouped by what they do for you.
            </p>
          </div>
        </div>
      </section>

      {/* Wellness Boxes & Custom Builder Section */}
      <section id="boxes" className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-green-600 font-bold tracking-widest text-xs uppercase mb-3 block font-sans">READY-MADE COMBINATIONS</span>
            <h2 className="text-4xl font-extrabold text-green-900 mb-4">Curated Wellness Boxes</h2>
            <p className="text-gray-650 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              One box, one purpose. Each brings together the varieties that work best as a set — enough for a family across a week of meals.
            </p>
          </motion.div>

          {/* Curated Boxes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-16">
            {curatedBoxes.map((box) => {
              let boxBg = "bg-amber-50/40 border-amber-200";
              let titleColor = "text-amber-900 font-black";
              let headerBg = "bg-amber-800 text-white";
              if (box.color === 'red') {
                boxBg = "bg-red-50/40 border-red-200";
                titleColor = "text-red-950 font-black";
                headerBg = "bg-red-800 text-white";
              } else if (box.color === 'teal') {
                boxBg = "bg-teal-50/40 border-teal-200";
                titleColor = "text-teal-950 font-black";
                headerBg = "bg-teal-800 text-white";
              } else if (box.color === 'pink') {
                boxBg = "bg-pink-50/40 border-pink-200";
                titleColor = "text-pink-950 font-black";
                headerBg = "bg-pink-800 text-white";
              } else if (box.color === 'green') {
                boxBg = "bg-green-50/40 border-green-200";
                titleColor = "text-green-950 font-black";
                headerBg = "bg-green-800 text-white";
              }

              return (
                <motion.div 
                  key={box.id}
                  id={`box-card-${box.id}`}
                  data-box-id={box.id}
                  data-box-name={box.name.toLowerCase()}
                  variants={fadeInUp}
                  onClick={() => {
                    setModalProduct({
                      id: box.id,
                      name: box.name,
                      description: box.description,
                      price: box.price,
                      image: '',
                    });
                    setModalType('box');
                    setOrderQuantity(1);
                    setIsOrderModalOpen(true);
                  }}
                  className={`bg-white rounded-[2rem] border overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ${boxBg} cursor-pointer`}
                >
                  <div>
                    {/* Header */}
                    <div className={`p-6 text-center ${headerBg}`}>
                      <h4 className="text-base font-black tracking-tight">{box.name}</h4>
                      <p className="text-[11px] text-white/90 mt-1 font-medium">{box.subtitle}</p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {box.description}
                      </p>
                      
                      <div className="space-y-2.5 pt-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                          {box.includesLabel || "Includes 50g of each:"}
                        </span>
                        <div className="space-y-1.5">
                          {box.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-bold text-gray-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-700 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Price & CTA */}
                  <div className="p-6 border-t border-gray-100/50 bg-white/50 backdrop-blur-sm flex flex-col gap-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Special Rate</span>
                      <span className={`text-xl font-black ${titleColor}`}>₹{box.price}</span>
                    </div>
                          <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setModalProduct({
                          id: box.id,
                          name: box.name,
                          description: box.description,
                          price: box.price,
                          image: '',
                        });
                        setModalType('box');
                        setOrderQuantity(1);
                        setIsOrderModalOpen(true);
                      }}
                      className="w-full bg-green-800 hover:bg-green-900 text-white font-bold py-2.5 px-4 rounded-xl text-center text-xs transition-colors duration-300 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Order Box
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Build Your Own Box Section */}
          <div className="bg-gradient-to-br from-green-900 to-green-950 text-white rounded-[3rem] p-8 md:p-12 shadow-xl relative overflow-hidden">
            {/* Background blur blob */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-green-700/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-800/10 rounded-full blur-3xl" />

            <div className="relative z-10 grid lg:grid-cols-5 gap-12 items-center">
              {/* Info Column */}
              <div className="lg:col-span-2 space-y-6">
                <span className="text-green-300 font-bold tracking-widest text-xs uppercase block font-sans">interactive builder</span>
                <h3 className="text-3xl font-extrabold leading-tight">Build your own box.</h3>
                <p className="text-green-100/70 text-sm leading-relaxed font-medium">
                  Prefer your own mix? Choose <span className="text-green-300 font-black">any four varieties</span> from the catalogue at their listed 50g rate and we will pack them together. 
                </p>
                <p className="text-green-100/70 text-sm leading-relaxed font-medium">
                  Tell us who it is for — a diabetic parent, a training teenager, or restaurant plating — and we will suggest the perfect combination.
                </p>

                {/* Selected Items summary panel */}
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-green-300">Your Selection ({customBoxItems.length}/4)</span>
                    {customBoxItems.length > 0 && (
                      <button 
                        onClick={() => setCustomBoxItems([])}
                        className="text-[10px] text-red-300 hover:text-red-400 font-bold underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  {customBoxItems.length === 0 ? (
                    <p className="text-xs text-green-100/40 italic">Please select exactly 4 varieties from the panel...</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {customBoxItems.map((itemName, idx) => {
                        const prod = products.find(p => p.name === itemName);
                        return (
                          <span key={idx} className="bg-white/10 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                            {itemName} (₹{prod?.prices['50g']})
                            <button 
                              onClick={() => setCustomBoxItems(customBoxItems.filter(item => item !== itemName))}
                              className="text-green-300 hover:text-white font-extrabold text-[10px] focus:outline-none cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Computed price info */}
                  {customBoxItems.length === 4 && (
                    <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-green-300 uppercase tracking-widest block">Total 50g Rate</span>
                        <span className="text-lg font-black text-white">
                          ₹{customBoxItems.reduce((acc, curr) => {
                            const p = products.find(prod => prod.name === curr);
                            return acc + (p?.prices['50g'] || 0);
                          }, 0)}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const customBoxPrice = customBoxItems.reduce((acc, curr) => {
                            const p = products.find(prod => prod.name === curr);
                            return acc + (p?.prices['50g'] || 0);
                          }, 0);
                          setModalProduct({
                            id: 'custom-box',
                            name: 'Custom Wellness Box',
                            description: `Selected varieties: ${customBoxItems.join(', ')}`,
                            price: customBoxPrice,
                            image: '',
                          });
                          setModalType('custom');
                          setOrderQuantity(1);
                          setIsOrderModalOpen(true);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Order Custom Box
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Selector Column */}
              <div className="lg:col-span-3 bg-white text-gray-800 p-6 md:p-8 rounded-3xl border border-green-800/10 shadow-lg space-y-4 max-h-[420px] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-green-800">Available Varieties (50g)</h4>
                  <span className="text-[10px] text-gray-400 font-bold">Select 4 items</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {products.filter(p => p.prices['50g'] !== undefined).map((p) => {
                    const isSelected = customBoxItems.includes(p.name);
                    const isMaxSelected = customBoxItems.length >= 4;
                    const isDisabled = !isSelected && isMaxSelected;

                    return (
                      <button
                        key={p.id}
                        disabled={isDisabled}
                        onClick={() => {
                          if (isSelected) {
                            setCustomBoxItems(customBoxItems.filter(item => item !== p.name));
                          } else if (!isMaxSelected) {
                            setCustomBoxItems([...customBoxItems, p.name]);
                          }
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-350 ${
                          isSelected 
                            ? 'bg-green-50 border-green-500 text-green-800 ring-1 ring-green-500 font-bold' 
                            : isDisabled 
                              ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50' 
                              : 'bg-white border-gray-100 text-gray-700 hover:bg-green-50/20 hover:border-green-200 cursor-pointer'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold leading-tight">{p.name}</span>
                          <span className="text-[9px] text-gray-400 font-sans leading-none">{p.tamilName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-green-700 font-sans">₹{p.prices['50g']}</span>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-black shrink-0 ${
                            isSelected 
                              ? 'bg-green-800 border-transparent text-white' 
                              : 'border-gray-250 text-gray-400'
                          }`}>
                            {isSelected ? '✓' : '+'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Overview & Hydroponic Story Section */}
      <section id="home" className="relative py-20 overflow-hidden bg-gradient-to-br from-green-50/50 via-white to-emerald-50/30 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10"
          >
            {/* FSSAI & GST Certification Badges Header */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="inline-flex items-center gap-2 bg-white/90 border border-orange-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-gray-900 shadow-sm backdrop-blur-sm">
                <img src="/fssai_logo.svg" alt="FSSAI Logo" className="h-5 sm:h-6 w-auto object-contain" />
                <span>FSSAI Lic No: <strong className="font-extrabold text-orange-950">22426550001482</strong></span>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-600/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-950 shadow-sm backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>GST: <strong className="font-extrabold text-emerald-950">33AAQFT9606F1ZW</strong></span>
              </div>
            </div>

            <span className="text-emerald-700 font-bold tracking-widest text-sm uppercase mb-4 block">Eat Fresh. Live Healthy.</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-green-900 leading-[1.15] mb-6">
              Eat Fresh.<br />
              <span className="text-green-800">Live Healthy.</span>
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-green-800/90 mb-4">
              Premium Hydroponic Microgreens – Freshly Harvested Every Day
            </h3>
            <p className="text-base text-gray-600 mb-8 leading-relaxed">
              Experience the power of nature with nutrient-rich microgreens grown using clean hydroponic technology. Freshly harvested, pesticide-free and packed with vitamins, minerals and antioxidants for a healthier lifestyle.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => {
                  const el = document.getElementById('catalogue');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-green-800 hover:bg-green-900 text-white px-8 py-4 rounded-md text-base flex items-center gap-2 group cursor-pointer font-bold shadow-md"
              >
                <Leaf className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Shop All Varieties
              </Button>
              <Button 
                variant="outline"
                className="border-green-800/30 text-green-800 px-8 py-4 rounded-md text-base flex items-center gap-2 hover:bg-green-50/50 cursor-pointer font-bold"
                onClick={() => navigate('/learn-more')}
              >
                <Leaf className="w-5 h-5 text-green-600" />
                Learn More
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative block w-full max-w-lg mx-auto lg:max-w-none mt-8 lg:mt-0"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border border-green-200/80 bg-green-950 aspect-[4/3] group">
              <img 
                src="/hero_salad_farm.png" 
                alt="Packaged Microgreens Salad boxes with blurred hydroponic farm background" 
                className="w-full h-full object-cover scale-[1.07] object-center group-hover:scale-[1.12] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            </div>
            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-green-200/50 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -z-10 animate-pulse delay-700" />
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-16 items-start">
            <motion.div {...fadeInUp} className="lg:col-span-1 space-y-6">
              <div>
                <span className="text-green-600 font-bold tracking-widest text-xs uppercase mb-4 block">About Us</span>
                <h2 className="text-3xl font-extrabold text-green-900 mb-6">Growing Nutrition, Naturally</h2>
                <p className="text-gray-600 leading-relaxed mb-4 text-sm">
                  At A2ZEE Microgreenz, we cultivate premium-quality microgreens using advanced hydroponic farming techniques. Our microgreens are grown indoors under controlled conditions using RO water, without soil, pesticides or harmful chemicals.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4 text-sm">
                  Every harvest is carefully monitored to ensure freshness, hygiene and superior nutritional value.
                </p>
                <p className="text-gray-600 leading-relaxed text-sm">
                  We are committed to promoting healthy living while protecting the environment through sustainable farming practices.
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-green-100 hover:scale-[1.02] transition-transform duration-500">
                <img 
                  src="/microgreens_tray.png" 
                  alt="Fresh Microgreens Tray" 
                  className="w-full h-48 object-cover"
                />
              </div>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
              className="lg:col-span-2 grid sm:grid-cols-2 gap-6"
            >
              {aboutCards.map((card, idx) => (
                <motion.div 
                  key={idx}
                  variants={fadeInUp}
                  className="bg-green-50/30 p-8 rounded-2xl border border-green-100 hover:shadow-xl hover:shadow-green-900/5 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-green-800 rounded-full flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                    <card.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-3">{card.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* About the Directors Subsection */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-20 pt-16 border-t border-green-100"
          >
            <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/60 p-8 sm:p-12 rounded-3xl border border-green-200/80 shadow-sm space-y-10">
              <div className="text-center max-w-3xl mx-auto">
                <span className="text-xs font-extrabold text-green-700 uppercase tracking-widest bg-green-100/80 px-3.5 py-1.5 rounded-full inline-block mb-3">Visionary Leadership</span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-green-950 mb-4">About the Directors</h3>
                <p className="text-gray-650 leading-relaxed text-sm sm:text-base">
                  A2Zee Microgreenz Pvt. Ltd. is a joint venture by professional scientists and academists, brewing out of their interest to introduce health and wellbeing through public awareness, optimized cultivation and marketing of microgreens across India.
                </p>
              </div>

              {/* Directors Profiles */}
              <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Dr. Judy Gopal */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-green-100 shadow-md hover:shadow-xl transition-all text-center flex flex-col items-center">
                  <div 
                    onClick={() => setSelectedDirectorBio({
                      name: 'Prof. Dr. Judy Gopal',
                      designation: 'Biologist & Scientist (SIMATS Engineering)',
                      image: '/judy_gopal.png',
                      bio: "A biologist and scientist with decades of experience in Asian countries such as Taiwan and South Korea, Prof. Dr. Judy Gopal carries a deep commitment towards contributing and educating society to levitate from junk and overcooked food culture towards raw consumption of nature's power-packed superfoods such as Microgreens. A passionate creative cook, she is keen on enlightening the public on ways to consume and serve microgreens without losing their nutritional aspect, determined to introduce exotic and rare nutritionally rich varieties into the Indian diet."
                    })}
                    className="relative mb-5 overflow-hidden rounded-2xl border-4 border-emerald-600/30 shadow-lg group cursor-pointer"
                  >
                    <img 
                      src="/judy_gopal.png" 
                      alt="Prof. Dr. Judy Gopal" 
                      className="w-56 sm:w-64 h-72 sm:h-80 object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4 text-center backdrop-blur-[2px]">
                      <Info className="w-8 h-8 mb-2 text-emerald-400 animate-bounce" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">Click to view full Bio</span>
                    </div>
                  </div>
                  <h4 className="text-2xl font-extrabold text-gray-900 tracking-tight">Prof. Dr. Judy Gopal</h4>
                  <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mt-1.5 max-w-xs">
                    Biologist & Scientist (SIMATS Engineering)
                  </p>
                  <button
                    onClick={() => setSelectedDirectorBio({
                      name: 'Prof. Dr. Judy Gopal',
                      designation: 'Biologist & Scientist (SIMATS Engineering)',
                      image: '/judy_gopal.png',
                      bio: "A biologist and scientist with decades of experience in Asian countries such as Taiwan and South Korea, Prof. Dr. Judy Gopal carries a deep commitment towards contributing and educating society to levitate from junk and overcooked food culture towards raw consumption of nature's power-packed superfoods such as Microgreens. A passionate creative cook, she is keen on enlightening the public on ways to consume and serve microgreens without losing their nutritional aspect, determined to introduce exotic and rare nutritionally rich varieties into the Indian diet."
                    })}
                    className="mt-4 text-xs font-extrabold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Info className="w-3.5 h-3.5 text-emerald-700" />
                    Read Biography
                  </button>
                </div>

                {/* Dr. Rama Arunmozhi */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-md hover:shadow-xl transition-all text-center flex flex-col items-center">
                  <div 
                    onClick={() => setSelectedDirectorBio({
                      name: 'Prof. Dr. Rama Arunmozhi',
                      designation: 'Computer Engineer & Product Design Expert',
                      image: '/rama_arunmozhi.jpg',
                      bio: "Dr. Rama Arunmozhi is a computer engineer with a passion for nature and its resources, committed to service and giving back to society the best nature has to offer. Stepping aside from her tech profession to indulge in microgreens cultivation and optimization, as a product design expert she works on all associated components pertaining to microgreen farming, integrating her expertise into kit development and accessories that help individuals take up microgreen farming in their homes."
                    })}
                    className="relative mb-5 overflow-hidden rounded-2xl border-4 border-green-700/30 shadow-lg group cursor-pointer"
                  >
                    <img 
                      src="/rama_arunmozhi.jpg" 
                      alt="Prof. Dr. Rama Arunmozhi" 
                      className="w-56 sm:w-64 h-72 sm:h-80 object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4 text-center backdrop-blur-[2px]">
                      <Info className="w-8 h-8 mb-2 text-green-400 animate-bounce" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">Click to view full Bio</span>
                    </div>
                  </div>
                  <h4 className="text-2xl font-extrabold text-gray-900 tracking-tight">Prof. Dr. Rama Arunmozhi</h4>
                  <p className="text-xs font-black text-green-700 uppercase tracking-widest mt-1.5 max-w-xs">
                    Computer Engineer & Product Design Expert
                  </p>
                  <button
                    onClick={() => setSelectedDirectorBio({
                      name: 'Prof. Dr. Rama Arunmozhi',
                      designation: 'Computer Engineer & Product Design Expert',
                      image: '/rama_arunmozhi.jpg',
                      bio: "Dr. Rama Arunmozhi is a computer engineer with a passion for nature and its resources, committed to service and giving back to society the best nature has to offer. Stepping aside from her tech profession to indulge in microgreens cultivation and optimization, as a product design expert she works on all associated components pertaining to microgreen farming, integrating her expertise into kit development and accessories that help individuals take up microgreen farming in their homes."
                    })}
                    className="mt-4 text-xs font-extrabold text-green-800 hover:text-green-950 bg-green-50 hover:bg-green-100 border border-green-200 px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Info className="w-3.5 h-3.5 text-green-700" />
                    Read Biography
                  </button>
                </div>
              </div>

              {/* Social Impact & Research Commitment */}
              <div className="bg-white/90 p-6 sm:p-8 rounded-2xl border border-green-100 space-y-4 text-sm text-gray-700 leading-relaxed">
                <p>
                  <strong className="text-green-900">Humanity at the Core:</strong> Humanity at the core of this venture, the directors hope to deliver packages suited for economically poor lactating mothers, anemic, vitamin-deficient, and malnourished populations as well as weight management packages.
                </p>
                <p>
                  <strong className="text-green-900">Organic RO Hydroponics & Research:</strong> The microgreens are organically grown without any chemical additives or pesticides, hydroponically using RO water. These scientists are also conducting research on improvising and enriching the nutrients in each of these microgreens using various modified culturing techniques. A2Zee Microgreenz covers end-to-end all aspects pertaining to these micro-natural resources.
                </p>
              </div>

              {/* Inspiring Tagline Box */}
              <div className="bg-gradient-to-r from-emerald-800 to-green-900 text-white p-6 rounded-2xl text-center shadow-md">
                <p className="text-base sm:text-lg font-extrabold tracking-wide">
                  "This is not just a business Initiative; its a Refreshing Revival and MicroRevolution!"
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Chef's Flavour Palette Section */}
      <section id="flavour-palette" className="py-24 bg-green-50/20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-green-600 font-bold tracking-widest text-xs uppercase mb-3 block font-sans">FOR PROFESSIONAL KITCHENS</span>
            <h2 className="text-4xl font-extrabold text-green-900 mb-4">Chef's Microgreen Flavour Palette</h2>
            <p className="text-gray-650 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Pick by taste, not by name. This is how each green behaves on the plate — what it tastes of, and where chefs reach for it.
            </p>
          </motion.div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-green-800/10 shadow-lg overflow-hidden mb-16">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-green-800 text-white text-xs font-black uppercase tracking-wider">
                  <th className="py-5 px-8 w-1/4">Microgreen</th>
                  <th className="py-5 px-8 w-1/4">Flavour Profile</th>
                  <th className="py-5 px-8 w-1/2">Common Uses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                {flavourPalette.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-green-50/20 transition-colors">
                    <td className="py-4.5 px-8 text-gray-950 font-bold">
                      <div className="flex flex-col">
                        <span>{entry.name}</span>
                        {entry.tamilName && (
                          <span className="text-[11px] text-gray-450 font-sans mt-0.5">({entry.tamilName})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4.5 px-8">
                      <span className="inline-block bg-green-55 text-green-800 text-xs px-3 py-1 rounded-full border border-green-100 shadow-sm">
                        {entry.flavour}
                      </span>
                    </td>
                    <td className="py-4.5 px-8 text-gray-650 leading-relaxed font-medium">
                      {entry.uses}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-4 mb-16">
            {flavourPalette.map((entry, idx) => (
              <motion.div 
                key={idx}
                className="bg-white p-5 rounded-2xl border border-green-800/10 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start border-b border-gray-50 pb-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-950 text-base">{entry.name}</span>
                    {entry.tamilName && (
                      <span className="text-[10px] text-gray-450 font-sans mt-0.5">({entry.tamilName})</span>
                    )}
                  </div>
                  <span className="inline-block bg-green-55 text-green-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-green-100 shadow-sm">
                    {entry.flavour}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Common Uses</span>
                  <p className="text-xs text-gray-650 leading-relaxed font-medium">{entry.uses}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Professional Highlights Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Building a pass',
                desc: 'Most kitchens run three: one peppery (radish or mustard), one sweet and crunchy (pea or sunflower), one for colour (beet or amaranthus).',
                icon: '🍽️'
              },
              {
                title: 'Cut to your spec',
                desc: 'Tell us the stem length and we will cut to it. Standing orders get the same size and the same yield every single day.',
                icon: '✂️'
              },
              {
                title: 'Trial before you commit',
                desc: 'Any variety can be trialled as a single 50 g punnet before you put it on a menu.',
                icon: '🧪'
              }
            ].map((highlight, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-white p-8 rounded-[2rem] border border-green-800/10 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              >
                <div className="text-3xl mb-4">{highlight.icon}</div>
                <h4 className="text-lg font-black text-green-950 mb-3">{highlight.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">{highlight.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Microgreens & Tech Section */}
      <section id="benefits" className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          {/* Row 1: Why Eat Microgreens & Featured Product */}
          <div className="grid lg:grid-cols-2 gap-24 items-start">
            <motion.div {...fadeInUp}>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-green-900 mb-6 uppercase">Why Eat Microgreens?</h2>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8">
                Microgreens are harvested at the perfect stage when nutrients are naturally concentrated.
              </p>

              {/* Rich In Section */}
              <div className="mb-10">
                <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4 block">Rich In</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Vitamin A', 'Vitamin C', 'Vitamin E', 'Vitamin K', 'Iron', 'Calcium', 
                    'Magnesium', 'Potassium', 'Zinc', 'Dietary Fiber', 'Protein', 'Antioxidants'
                  ].map((nutri) => (
                    <span key={nutri} className="bg-green-50 text-green-800 text-sm font-bold px-4 py-2 rounded-full border border-green-100 shadow-sm transition-transform duration-300 hover:scale-105">
                      {nutri}
                    </span>
                  ))}
                </div>
              </div>
              {/* Health Advantages */}
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4 block">Health Advantages</h3>
              <ul className="grid sm:grid-cols-2 gap-4">
                {[
                  { emoji: '❤️', text: 'Supports Heart Health' },
                  { emoji: '🩸', text: 'Helps Maintain Healthy Iron Levels' },
                  { emoji: '🛡', text: 'Strengthens Immunity' },
                  { emoji: '🧠', text: 'Supports Brain Function' },
                  { emoji: '👁', text: 'Improves Eye Health' },
                  { emoji: '💪', text: 'Builds Strength and Energy' },
                  { emoji: '🌿', text: 'Supports Digestion' },
                  { emoji: '⚖', text: 'Helps Weight Management' },
                  { emoji: '🔥', text: 'Rich in Natural Antioxidants' }
                ].map((item, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 text-sm text-gray-800 font-bold bg-green-50/10 px-4 py-3.5 rounded-xl border border-green-50/50 hover:shadow-sm transition-all duration-300"
                  >
                    <span className="text-lg shrink-0">{item.emoji}</span>
                    <span>{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative lg:mt-0 mt-12"
            >
              <div className="p-8 bg-green-50/30 rounded-[3rem] border border-green-100 relative overflow-hidden flex flex-col justify-between h-full space-y-6">
                {/* Price Badge */}
                <div className="absolute top-6 right-6 bg-green-800 text-white font-bold text-sm px-4 py-2 rounded-full shadow-lg border border-green-700">
                  ₹50
                </div>

                <div className="space-y-4">
                  <span className="text-green-600 font-bold tracking-widest text-xs uppercase mb-1 block">Featured Product</span>
                  <h2 className="text-3xl font-extrabold text-green-900 leading-tight">Healthy Organic Microgreens Salad</h2>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    A carefully selected blend of premium microgreens including Green Gram, Cress, Sesame, Red Cowpea, Chia, Radish, Fenugreek Mixed with fresh vegetables for a delicious ready-to-eat healthy salad.
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                      'Hydroponically grown',
                      'RO Water Cultivation',
                      'Soil-free',
                      'Organic',
                      'Freshly harvested',
                      'Ready to Eat'
                    ].map((highlight, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center min-h-[220px]">
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-green-100 hover:scale-[1.01] transition-transform duration-500 w-full h-48">
                    <img 
                      src="/microgreens_box.png" 
                      alt="Healthy Organic Microgreens Salad" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    const el = document.getElementById('catalogue');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-green-800 hover:bg-green-900 text-white font-bold py-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Leaf className="w-5 h-5" />
                  Order Salad Now
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Row 2: Smart Hydroponic Cultivation Technology */}
          <div className="mt-24 p-8 md:p-12 bg-green-50/20 rounded-[3rem] border border-green-100 relative overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Side: Tech Grid & Info */}
              <div className="space-y-6">
                <span className="text-green-600 font-bold tracking-widest text-sm uppercase block">Cultivation Concept</span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-green-900 leading-tight">Smart Hydroponic Farming</h3>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-xl">
                  We use modern indoor farming systems to produce fresh, safe and nutritious microgreens throughout the year. Our soil-free cultivation ensures maximum hygiene, safety, and nutrient density.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {[
                    { icon: Droplets, label: 'RO Water Based Hydroponics' },
                    { icon: Wind, label: 'Controlled Environment' },
                    { icon: ShieldCheck, label: 'Hygienic Indoor Cultivation' },
                    { icon: Droplets, label: 'Sustainable Water Management' }
                  ].map((tech, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-green-50 shadow-sm hover:scale-105 transition-transform duration-300 text-center min-h-[120px]">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-700 shrink-0 mb-3">
                        <tech.icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs md:text-sm font-bold text-gray-800 leading-snug">{tech.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Visualizing Vertical Farm */}
              <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-green-100 h-80 relative group">
                <img 
                  src="/hydroponic_farm.png" 
                  alt="Hydroponic Farm Setup" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Range & Future Roadmap Section */}
      <section id="flavour-palette" className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-green-600 font-bold tracking-widest text-xs uppercase mb-4 block">Product Offerings</span>
            <h2 className="text-4xl font-extrabold text-green-900">Our Product Range & Future Roadmap</h2>
          </div>

          <div className="grid lg:grid-cols-5 gap-12">
            {/* Current Range */}
            <div className="lg:col-span-3 space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-green-600 rounded-full" />
                Fresh & Ready Offerings
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-6 bg-green-50/20 rounded-2xl border border-green-50 hover:shadow-md transition-all duration-300">
                  <span className="text-2xl mb-4 block">🌱</span>
                  <h4 className="text-lg font-bold text-green-900 mb-2">Fresh Microgreens</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Daily harvested fresh microgreens for home use.</p>
                </div>

                <div className="p-6 bg-green-50/20 rounded-2xl border border-green-50 hover:shadow-md transition-all duration-300">
                  <span className="text-2xl mb-4 block">🥗</span>
                  <h4 className="text-lg font-bold text-green-900 mb-2">Ready-to-Eat Salad Boxes</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Healthy salad boxes made with multiple nutrient-rich microgreens.</p>
                </div>

                <div className="p-6 bg-green-50/30 rounded-2xl border border-green-100 hover:shadow-md transition-all duration-300 sm:col-span-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <span className="text-2xl block">🧬</span>
                      <h4 className="text-lg font-bold text-green-900">Customized Nutrition Packs</h4>
                      <p className="text-gray-600 text-sm max-w-md leading-relaxed">Special blends developed for targeted health benefits, aligning with our vision of personalized, functional nutrition.</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-green-50 shrink-0">
                      <span className="text-xs font-bold text-green-800 uppercase tracking-wide mb-3 block">Targeted Blends For:</span>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {['Fitness enthusiasts', 'Children', 'Pregnant women', 'Anaemic individuals', 'Elderly people'].map((item) => (
                          <div key={item} className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Future Offerings (Coming Soon) */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-green-600 rounded-full" />
                Coming Soon
              </h3>

              <div className="bg-gradient-to-br from-green-900 to-green-950 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <p className="text-green-300 text-xs font-bold uppercase tracking-widest">Future Roadmap</p>
                  <h4 className="text-2xl font-bold leading-tight">Value-Added Products & AI Cultivation</h4>
                  <p className="text-green-100/70 text-sm leading-relaxed">
                    Expanding our portfolio with processed nutritional products and smart home farming tech.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  {[
                    { title: 'Dried Microgreens', emoji: '🍂' },
                    { title: 'Microgreen Powder', emoji: '🧪' },
                    { title: 'Nutritional Capsules', emoji: '💊' },
                    { title: 'AI Powered Grow Kits', emoji: '🤖' }
                  ].map((item) => (
                    <div key={item.title} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all duration-300">
                      <span className="text-xl mb-1.5 block">{item.emoji}</span>
                      <span className="text-xs font-bold block">{item.title}</span>
                      <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest mt-1 block">In R&D</span>
                    </div>
                  ))}
                </div>

                {/* Decorative blob */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-600/30 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-green-50/20 overflow-hidden relative border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="text-green-600 font-bold tracking-widest text-xs uppercase mb-4 block">Testimonials</span>
            <h2 className="text-4xl font-extrabold text-green-900">What Our Customers Say</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {/* Reviews Cards */}
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
              {reviewsList.length === 0 ? (
                <div className="sm:col-span-2 bg-white p-8 rounded-3xl border border-green-100 shadow-lg shadow-green-900/5 text-center flex flex-col items-center justify-center min-h-[220px]">
                  <MessageSquare className="w-10 h-10 text-green-300 mb-3" />
                  <h4 className="text-base font-bold text-green-900">No reviews yet</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">Be the first to share your feedback about our fresh microgreens!</p>
                </div>
              ) : (
                reviewsList.slice(0, 4).map((review, idx) => (
                  <motion.div 
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white p-6 rounded-3xl border border-green-100 shadow-lg shadow-green-900/5 hover:shadow-xl hover:shadow-green-900/10 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-1 text-yellow-500">
                          {[...Array(review.rating)].map((_, i) => (
                            <span key={i} className="text-base">★</span>
                          ))}
                          {[...Array(5 - review.rating)].map((_, i) => (
                            <span key={i} className="text-base text-gray-200">★</span>
                          ))}
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Review (Admin Only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 italic leading-relaxed text-xs">"{review.comment}"</p>

                      {/* Admin Reply */}
                      {review.adminReply && (
                        <div className="bg-green-50/50 p-3 rounded-xl border border-green-100 flex gap-2 pl-2 text-left">
                          <CornerDownRight className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-green-800 uppercase tracking-wider bg-green-100 px-1.5 py-0.5 rounded block w-fit">Admin Response</span>
                            <p className="text-gray-600 text-[11px] italic leading-normal">
                              "{review.adminReply.replyText}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-green-50 pt-3 mt-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-xs">
                        {review.userName[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800">{review.userName}</span>
                        {review.userId !== 'guest' && (
                          <span className="text-[8px] font-bold text-green-700 uppercase tracking-wider">Verified Buyer</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Write a Review Form Card */}
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-green-100 shadow-lg shadow-green-900/5 space-y-5">
              <div>
                <h3 className="text-lg font-black text-green-900">Share Your Experience</h3>
                <p className="text-[11px] text-gray-500 mt-1">We love to hear from our customers! Post your feedback here.</p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Name - Guest only */}
                {!user ? (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Your Name</label>
                    <input
                      type="text"
                      placeholder="Enter guest name..."
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-green-100 bg-white focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-transparent font-medium"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-green-50/50 rounded-xl border border-green-100 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold text-[10px]">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold text-green-800">Posting as: <strong className="font-extrabold text-green-950">{user.name}</strong></span>
                  </div>
                )}

                {/* Rating selection */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Your Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      >
                        <span className={star <= reviewRating ? "text-yellow-500" : "text-gray-200"}>★</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Review Details</label>
                  <textarea
                    placeholder="Tell us about the freshness, flavor, or delivery..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-green-100 bg-white focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-transparent font-medium"
                  />
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full bg-green-800 hover:bg-green-900 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow cursor-pointer flex items-center justify-center gap-1"
                >
                  {isSubmittingReview ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>

                {submitStatus === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 text-green-800 rounded-xl text-[11px] font-bold text-center border border-green-200"
                  >
                    ✓ Review posted successfully!
                  </motion.div>
                )}

                {submitStatus === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 text-red-800 rounded-xl text-[11px] font-bold text-center border border-red-200"
                  >
                    ⚠ Error submitting review. Try again.
                  </motion.div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability Section */}
      <section className="py-24 bg-green-50/10 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-green-600 font-bold tracking-widest text-xs uppercase mb-4 block">Sustainability</span>
          <h2 className="text-4xl font-extrabold text-green-900 mb-6">Growing Green for a Better Tomorrow</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-16 leading-relaxed">
            Together, we're creating a healthier future for people and the planet. Our farming methods prioritize sustainability at every stage.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-12 border-t border-gray-100">
            {[
              { text: 'Up to 90% less water', icon: Droplets },
              { text: 'No soil degradation', icon: Leaf },
              { text: 'No chemical pesticides', icon: ShieldCheck },
              { text: 'Minimal carbon footprint', icon: Wind },
              { text: 'Eco-friendly packaging', icon: Award }
            ].map((feat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center gap-4 p-5 bg-white rounded-2xl border border-green-50 shadow-sm hover:scale-105 transition-transform duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-700">
                  <feat.icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-900 text-xs md:text-sm text-center leading-snug">{feat.text}</h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Research & Innovation Section */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeInUp} className="space-y-6">
              <span className="text-green-600 font-bold tracking-widest text-xs uppercase mb-4 block">Research & Innovation</span>
              <h2 className="text-4xl font-extrabold text-green-900 leading-tight">Science Behind Every Harvest</h2>
              <p className="text-base text-gray-600 leading-relaxed">
                A2ZEE Microgreenz continuously works on research and innovation in:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                {[
                  'Hydroponic optimization',
                  'Sustainable cultivation',
                  'Nutrient enhancement',
                  'Storage optimization',
                  'AI-assisted farming',
                  'Customized nutrient-balanced salad formulations'
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-green-50/40 rounded-xl border border-green-50 flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                    <span className="text-xs font-semibold text-gray-800 leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-green-100 hover:scale-[1.01] transition-transform duration-500">
                <img 
                  src="/innovation_research.png" 
                  alt="Science Behind Every Harvest" 
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-green-800 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse">
                <Leaf className="w-6 h-6" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ordering & Delivery Process Section */}
      <section className="py-24 bg-green-50/10 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-green-600 font-bold tracking-widest text-xs uppercase mb-3 block font-sans">ORDERING & DELIVERY</span>
          <h2 className="text-4xl font-extrabold text-green-900 mb-6">Harvested the morning it reaches you</h2>
          <p className="text-gray-650 max-w-3xl mx-auto mb-16 text-sm md:text-base leading-relaxed">
            We do not cut ahead and hold stock. Tell us what you need, and your punnets are cut, packed, and delivered on the same day — which is why our greens keep their crunch for a full week in your fridge.
          </p>

          {/* Steps Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              { num: '01', title: 'Send us your list', desc: 'Message the varieties and pack sizes you want on WhatsApp, or simply call.' },
              { num: '02', title: 'We confirm', desc: 'We confirm availability, the total, and your delivery day — usually the next morning.' },
              { num: '03', title: 'We harvest', desc: 'Your punnets are cut on the morning of delivery, never earlier, never from storage.' },
              { num: '04', title: 'Delivered fresh', desc: 'Packed straight into the punnet and delivered to your door across Chennai.' }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                className="bg-white p-8 rounded-3xl border border-green-50 shadow-sm relative overflow-hidden text-left hover:shadow-md transition-shadow"
              >
                <span className="text-4xl font-black text-green-800/10 absolute -top-1 -right-2 tracking-tighter select-none">
                  {step.num}
                </span>
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-800 font-extrabold flex items-center justify-center mb-6 text-sm shadow-inner">
                  {step.num}
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-2">{step.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Why buy from A2Zee highlights */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-green-100 shadow-sm max-w-4xl mx-auto">
            <h3 className="text-lg font-bold text-green-950 mb-8 uppercase tracking-wider">Why buy from A2Zee</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Soil-less', desc: 'Grown on inert media — clean roots, no soil residue.' },
                { title: 'Zero pesticides', desc: 'No pesticides or chemical fertilisers at any stage.' },
                { title: 'Harvested to order', desc: 'Cut the day it reaches you, never held in cold storage.' },
                { title: '22 varieties', desc: 'The widest microgreen and sprout range grown in Chennai.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <h5 className="font-extrabold text-sm text-gray-900">{item.title}</h5>
                  </div>
                  <p className="text-xs text-gray-500 leading-normal pl-6 font-semibold">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-green-50/20 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-green-600 font-bold tracking-widest text-xs uppercase mb-4 block">FAQ</span>
            <h2 className="text-4xl font-extrabold text-green-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Are your microgreens organic?",
                a: "Yes. They are grown without pesticides or harmful chemicals using hydroponic farming."
              },
              {
                q: "How long do they stay fresh?",
                a: "Best consumed within 2–3 days when refrigerated."
              },
              {
                q: "Can children eat microgreens?",
                a: "Yes. They are safe and highly nutritious for children when consumed fresh."
              },
              {
                q: "Do I need to wash them again?",
                a: "No. They are hygienically grown and packed, though you may rinse lightly if preferred."
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-green-100 overflow-hidden transition-all duration-300 shadow-sm">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-green-50/30 transition-colors focus:outline-none"
                  >
                    <span className="font-bold text-gray-900 text-base md:text-lg">{faq.q}</span>
                    <span className={`text-xl text-green-600 transition-transform duration-300 transform ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-48 border-t border-green-55' : 'max-h-0'
                  }`}>
                    <p className="p-6 text-gray-600 text-sm md:text-base leading-relaxed bg-green-50/10">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section / Footer */}
      <footer id="contact" className="pt-24 pb-12 bg-green-950 text-white overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-green-800/20 rounded-full blur-[120px] -z-0 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center mb-20">
            <div className="space-y-12">
              <h2 className="text-3xl font-bold uppercase tracking-widest text-green-400">Get Fresh Microgreens Delivered Today</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1 uppercase">A2ZEE Microgreenz</p>
                    <p className="text-green-100/70 text-sm leading-relaxed">
                      No. 1, Sivaswamy Avenue, MGR Salai<br />
                      Palavakkam, Chennai 600041<br />
                      Tamil Nadu, India
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-green-400" />
                  </div>
                  <a href="mailto:a2zeemicrogreenz@gmail.com" className="text-green-100/70 hover:text-white transition-colors">
                    a2zeemicrogreenz@gmail.com
                  </a>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-green-400" />
                  </div>
                  <a href="tel:+917338840084" className="text-lg font-bold hover:text-green-300 transition-colors cursor-pointer">
                    +91 73388 40084
                  </a>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-green-400" />
                  </div>
                  <a href="https://a2zeemicrogreenz.com/" target="_blank" rel="noopener noreferrer" className="text-green-100/70 hover:text-white transition-colors">
                    https://a2zeemicrogreenz.com/
                  </a>
                </div>

                {/* FSSAI & GST Certification Cards */}
                <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 bg-white/10 border border-white/15 px-4 py-2.5 rounded-2xl backdrop-blur-md">
                    <img src="/fssai_logo.svg" alt="FSSAI Logo" className="h-6 w-auto object-contain bg-white/90 p-1 rounded-lg shrink-0" />
                    <div className="text-left">
                      <span className="text-[10px] uppercase font-bold text-green-300 block tracking-wider">FSSAI Lic No</span>
                      <span className="text-xs font-black text-white">22426550001482</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/10 border border-white/15 px-4 py-2.5 rounded-2xl backdrop-blur-md">
                    <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
                    <div className="text-left">
                      <span className="text-[10px] uppercase font-bold text-green-300 block tracking-wider">GST Registration</span>
                      <span className="text-xs font-black text-white">33AAQFT9606F1ZW</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                {[Facebook, Instagram, MessageCircle].map((Icon, idx) => (
                  <a key={idx} href="#" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-green-950 transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-green-900/30 p-10 rounded-[3rem] border border-white/10 backdrop-blur-sm relative">
              <div className="flex flex-col items-center text-center">
                <h3 className="text-2xl font-bold mb-6">LET'S GROW A HEALTHIER FUTURE TOGETHER</h3>
                <p className="text-green-100/70 mb-10 text-sm max-w-xs">
                  Choose A2ZEE Microgreenz for a healthy you and a healthy planet.
                </p>
                <div className="relative w-48 h-48 mb-8">
                  <img 
                    src="/footer_hands.png" 
                    alt="Sustainable Farming" 
                    className="w-full h-full object-cover rounded-full border-4 border-white/10" 
                  />
                  <div className="absolute -bottom-4 -right-4 bg-green-500 p-4 rounded-full shadow-lg">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="italic text-xl font-medium text-green-200">
                  Thank you for supporting<br />local & sustainable farming!
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-green-100/40 text-sm space-y-2">
            <p className="font-semibold text-green-400 tracking-wider">Fresh • Healthy • Sustainable</p>
            <p className="text-green-200/50">Chennai, Tamil Nadu, India</p>
            <p>© 2026 A2ZEE Microgreenz. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {/* Nutrient Matrix Modal */}
      <AnimatePresence>
        {isMatrixOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl border border-green-50 max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden text-gray-800"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-green-50/30">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-green-900 leading-tight">Vitamin & Benefit Matrix</h3>
                  <p className="text-xs text-gray-500 mt-1">Find the green that matches what you need — scored across the 10 core nutrients.</p>
                </div>
                <button 
                  onClick={() => setIsMatrixOpen(false)}
                  className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow transition-all cursor-pointer focus:outline-none"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-auto p-6 md:p-8">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full border-collapse text-left text-xs font-semibold">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="p-3 font-bold text-gray-900 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-44">Microgreen</th>
                        {nutrientsList.map(n => (
                          <th key={n} className="p-3 font-bold text-gray-900 uppercase tracking-wider text-center">{n}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-105">
                      {products.map((product) => {
                        const ratings = matrixRatings[product.name] || {};
                        return (
                          <tr key={product.id} className="hover:bg-green-50/20 transition-colors">
                            <td className="p-3 font-bold text-gray-950 sticky left-0 bg-white border-r border-gray-100 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold">{product.name}</span>
                                <span className="text-[10px] text-gray-400 font-sans">{product.tamilName}</span>
                              </div>
                            </td>
                            {nutrientsList.map(n => {
                              const rating = ratings[n] || 'none';
                              return (
                                <td key={n} className="p-3 text-center">
                                  <div className="flex justify-center">
                                    {rating === 'excellent' ? (
                                      <div className="w-4.5 h-4.5 rounded-full bg-green-800 border border-green-950 shadow-sm flex items-center justify-center" title="Excellent Source">
                                        <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                                      </div>
                                    ) : rating === 'good' ? (
                                      <div className="w-4 h-4 rounded-full bg-green-500 border border-green-700 shadow-sm" title="Good Source" />
                                    ) : (
                                      <div className="w-3.5 h-3.5 rounded-full bg-gray-100 border border-gray-200" title="Not a Highlight" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legend & Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-gray-600">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4.5 h-4.5 rounded-full bg-green-800 border border-green-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                    </div>
                    <span>Excellent source — a headline nutrient</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 border border-green-700" />
                    <span>Good source</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-100 border border-gray-200" />
                    <span>Not a highlight</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 italic max-w-xs leading-tight">
                  *Ratings are a general guide based on published nutritional values. Not medical advice.
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick Add Modal */}
        {isOrderModalOpen && modalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl border border-green-50 max-w-md w-full overflow-hidden flex flex-col text-left text-gray-800"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-800 to-emerald-800 text-white p-6 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-black">Add to WhatsApp Order</h3>
                  <p className="text-xs text-green-100/90 mt-0.5">Select your options and add to your cart</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Product Summary */}
                <div className="flex gap-4 bg-green-50/40 p-4 rounded-2xl border border-green-100/50">
                  {modalProduct.image ? (
                    <img
                      src={encodeURI(modalProduct.image || '/greengram.png')}
                      alt={modalProduct.name}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedFallback) {
                          target.dataset.triedFallback = 'true';
                          target.src = '/greengram.png';
                        }
                      }}
                      className="w-16 h-16 object-contain rounded-xl border border-green-100 bg-white p-1"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-green-100 text-green-700 flex items-center justify-center rounded-xl border border-green-200">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <h4 className="font-extrabold text-green-950 text-sm leading-snug">{modalProduct.name}</h4>
                    {modalProduct.tamilName && (
                      <span className="text-xs text-green-700/80 font-bold block">{modalProduct.tamilName}</span>
                    )}
                    <span className="inline-block text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-100 mt-1">
                      {modalType === 'single' ? 'Variety' : modalType === 'box' ? 'Curated Box' : 'Custom Box'}
                    </span>
                  </div>
                </div>

                {/* Configurations */}
                <div className="space-y-4">
                  {modalType === 'single' && (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Choose Pack Size</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.keys(modalProduct.prices).map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              selectedSize === size
                                ? 'border-green-600 bg-green-50 text-green-800 font-extrabold'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {size} - ₹{modalProduct.prices[size]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Select Quantity</label>
                    <div className="flex items-center gap-3 w-fit bg-gray-50 border border-gray-200 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setOrderQuantity(prev => Math.max(1, prev - 1))}
                        className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-green-700 transition-colors cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-extrabold text-gray-800">{orderQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setOrderQuantity(prev => prev + 1)}
                        className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-green-700 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Price Preview */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-150 flex justify-between items-center text-sm font-bold text-gray-700">
                    <span>Total Unit Price:</span>
                    <span className="text-lg font-black text-green-700">
                      ₹{(modalType === 'single' ? modalProduct.prices[selectedSize] * orderQuantity : modalProduct.price * orderQuantity)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="bg-gray-50 p-6 border-t border-gray-100">
                <Button
                  onClick={() => {
                    const selectedPrice = modalType === 'single' ? modalProduct.prices[selectedSize] : modalProduct.price;
                    const sizeLabel = modalType === 'single' ? selectedSize : modalType === 'box' ? 'Curated Box' : 'Custom Box';
                    const itemId = `${modalProduct.id}-${sizeLabel}`;

                    const cartItem = {
                      id: itemId,
                      productId: modalProduct.id,
                      productName: modalProduct.name,
                      tamilName: modalProduct.tamilName,
                      size: sizeLabel,
                      price: selectedPrice,
                      quantity: orderQuantity,
                      image: modalProduct.image || '',
                    };

                    setWhatsappCart(prev => {
                      const existingIndex = prev.findIndex(item => item.id === itemId);
                      if (existingIndex > -1) {
                        const updated = [...prev];
                        updated[existingIndex].quantity += orderQuantity;
                        return updated;
                      }
                      return [...prev, cartItem];
                    });

                    toast.success(`${modalProduct.name} (${sizeLabel}) added to WhatsApp cart!`);
                    setIsOrderModalOpen(false);
                  }}
                  className="w-full bg-green-800 hover:bg-green-900 text-white font-extrabold h-12 rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Add to WhatsApp Cart
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Floating Cart Button */}
        {whatsappCart.length > 0 && !isCartOpen && (
          <div className="fixed bottom-6 right-6 z-40">
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsCartOpen(true);
                setIsCheckoutStep(false);
              }}
              className="bg-green-800 hover:bg-green-900 text-white font-black px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 cursor-pointer border border-green-750 ring-4 ring-green-100"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-3.5 -right-3.5 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center border border-white font-black animate-bounce">
                  {whatsappCart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="text-left border-l border-white/20 pl-3">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-green-200">WhatsApp Cart</p>
                <p className="text-sm font-black">
                  ₹{whatsappCart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                </p>
              </div>
            </motion.button>
          </div>
        )}

        {/* WhatsApp Cart & Checkout Modal */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl border border-green-50 max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col text-left text-gray-800"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-800 to-emerald-800 text-white p-6 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-black">
                    {isCheckoutStep ? 'Checkout Details' : 'WhatsApp Order Cart'}
                  </h3>
                  <p className="text-xs text-green-100/90 mt-0.5">
                    {isCheckoutStep ? 'Fill shipping information to place order' : 'Review your selected items'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
                {!isCheckoutStep ? (
                  /* STEP 1: View Cart List */
                  <div className="space-y-4">
                    {whatsappCart.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-bold">Your cart is empty.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 divide-y divide-gray-100 max-h-[45vh] overflow-y-auto pr-2">
                        {whatsappCart.map((item, index) => (
                          <div key={item.id} className={`flex items-center justify-between gap-4 pt-3 ${index === 0 ? 'pt-0 border-none' : ''}`}>
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.productName}
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-green-50 text-green-700 flex items-center justify-center rounded-lg border border-green-100">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-sm text-gray-900 leading-snug">{item.productName}</h4>
                                <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 mt-1 inline-block">
                                  {item.size}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-0.5 rounded-lg text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWhatsappCart(prev =>
                                      prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i)
                                    );
                                  }}
                                  className="p-1 hover:bg-white rounded text-gray-500 hover:text-green-700 transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-6 text-center font-bold text-gray-800">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWhatsappCart(prev =>
                                      prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
                                    );
                                  }}
                                  className="p-1 hover:bg-white rounded text-gray-500 hover:text-green-700 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="text-right min-w-[70px]">
                                <p className="font-black text-sm text-gray-900">₹{item.price * item.quantity}</p>
                                <p className="text-[9px] text-gray-400 font-semibold">₹{item.price} each</p>
                              </div>

                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setWhatsappCart(prev => prev.filter(i => i.id !== item.id));
                                  toast.error('Removed from cart');
                                }}
                                className="p-1.5 hover:bg-red-50 text-gray-450 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Costing Summary */}
                    {whatsappCart.length > 0 && (
                      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 space-y-2 text-xs font-semibold text-gray-500">
                        <div className="flex justify-between">
                          <span>Items Subtotal:</span>
                          <span className="text-gray-900 font-bold">
                            ₹{whatsappCart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery Fee:</span>
                          <span className="text-gray-900 font-bold">
                            FREE
                          </span>
                        </div>
                        <div className="h-px bg-gray-200 my-2" />
                        <div className="flex justify-between text-sm font-black text-gray-950">
                          <span>Grand Total:</span>
                          <span className="text-base text-green-700 font-extrabold">
                            ₹{whatsappCart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* STEP 2: Address form details */
                  <div className="space-y-4 text-left">
                    <h4 className="text-sm font-black text-green-950 uppercase tracking-wider mb-2">Buyer & Delivery Details</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-0.5">Full Name</label>
                        <Input
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="John Doe"
                          className="h-11 rounded-xl bg-gray-50 border-gray-205 focus:border-green-300"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-0.5">Phone Number</label>
                        <Input
                          type="tel"
                          value={buyerPhone}
                          onChange={(e) => setBuyerPhone(e.target.value)}
                          placeholder="7338840084"
                          className="h-11 rounded-xl bg-gray-50 border-gray-205 focus:border-green-300"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-0.5">Email Address</label>
                      <Input
                        type="email"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="h-11 rounded-xl bg-gray-50 border-gray-205 focus:border-green-300"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-0.5">Address Line 1</label>
                      <Input
                        value={buyerAddressLine1}
                        onChange={(e) => setBuyerAddressLine1(e.target.value)}
                        placeholder="Flat/House No, Building, Street"
                        className="h-11 rounded-xl bg-gray-50 border-gray-205 focus:border-green-300"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-0.5">Address Line 2 (Optional)</label>
                      <Input
                        value={buyerAddressLine2}
                        onChange={(e) => setBuyerAddressLine2(e.target.value)}
                        placeholder="Locality, Land Mark"
                        className="h-11 rounded-xl bg-gray-50 border-gray-205 focus:border-green-300"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-0.5">City</label>
                        <Input
                          value={buyerCity}
                          onChange={(e) => setBuyerCity(e.target.value)}
                          placeholder="Chennai"
                          className="h-11 rounded-xl bg-gray-50 border-gray-205 focus:border-green-300"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-0.5">State</label>
                        <Input
                          value={buyerState}
                          onChange={(e) => setBuyerState(e.target.value)}
                          placeholder="Tamil Nadu"
                          className="h-11 rounded-xl bg-gray-50 border-gray-205 focus:border-green-300"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-0.5">Pincode</label>
                        <Input
                          value={buyerPincode}
                          onChange={(e) => setBuyerPincode(e.target.value)}
                          placeholder="600041"
                          className="h-11 rounded-xl bg-gray-50 border-gray-205 focus:border-green-300"
                          required
                        />
                      </div>
                    </div>

                    {/* Tiny Summary */}
                    <div className="bg-green-50 p-4 rounded-xl border border-green-150 flex justify-between items-center text-xs font-bold text-green-900 mt-4">
                      <span>Total Cart Value ({whatsappCart.reduce((sum, item) => sum + item.quantity, 0)} units):</span>
                      <span className="text-sm font-black">
                        ₹{whatsappCart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              {whatsappCart.length > 0 && (
                <div className="bg-gray-50 p-6 border-t border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
                  {isCheckoutStep ? (
                    /* Step 2 Buttons */
                    <>
                      <button
                        type="button"
                        onClick={() => setIsCheckoutStep(false)}
                        className="text-xs font-black text-gray-500 hover:text-gray-800 underline cursor-pointer"
                      >
                        Back to Edit Cart
                      </button>
                      <Button
                        onClick={async () => {
                          if (!buyerName.trim() || !buyerPhone.trim() || !buyerEmail.trim() || !buyerAddressLine1.trim() || !buyerCity.trim() || !buyerPincode.trim()) {
                            toast.error('Please fill in all required fields');
                            return;
                          }
                          if (buyerPhone.replace(/\D/g, '').length < 10) {
                            toast.error('Please enter a valid 10-digit phone number');
                            return;
                          }
                          if (!buyerEmail.includes('@')) {
                            toast.error('Please enter a valid email address');
                            return;
                          }

                          setIsPlacingOrder(true);
                          try {
                            // Map all cart items to OrderItems
                            const orderItems = whatsappCart.map(item => ({
                              productId: item.productId,
                              productName: `${item.productName} (${item.size})`,
                              price: item.price,
                              quantity: item.quantity,
                              imageUrl: item.image,
                            }));

                            const addressDetails = {
                              name: buyerName,
                              phone: buyerPhone,
                              line1: buyerAddressLine1,
                              line2: buyerAddressLine2,
                              city: buyerCity,
                              state: buyerState,
                              pincode: buyerPincode,
                            };

                            const guestInfo = {
                              name: buyerName,
                              email: buyerEmail,
                              phone: buyerPhone,
                            };

                            // Create order
                            const order = await createGuestOrder(orderItems, addressDetails as any, guestInfo, 'cod');
                            toast.success('Order placed successfully! Redirecting to WhatsApp...');

                            // Build multi-item WhatsApp Message
                            let itemsText = '';
                            whatsappCart.forEach((item, index) => {
                              itemsText += `${index + 1}. *${item.productName}* (${item.size}) x ${item.quantity} - ₹${item.price * item.quantity}\n`;
                            });

                            // Redirection removed as the owner will send the confirmation instead.
                            // Cleanup
                            setWhatsappCart([]);
                            setIsCartOpen(false);
                            setIsCheckoutStep(false);
                            setBuyerName('');
                            setBuyerEmail('');
                            setBuyerPhone('');
                            setBuyerAddressLine1('');
                            setBuyerAddressLine2('');
                            setBuyerCity('');
                            setBuyerState('');
                            setBuyerPincode('');
                          } catch (err: any) {
                            console.error(err);
                            toast.error('Failed to place order: ' + (err.message || 'Unknown error'));
                          } finally {
                            setIsPlacingOrder(false);
                          }
                        }}
                        disabled={isPlacingOrder}
                        className="bg-green-700 hover:bg-green-800 text-white font-bold h-12 px-6 rounded-xl w-full md:w-auto shrink-0 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer font-sans"
                      >
                        {isPlacingOrder ? 'Placing Order...' : 'Confirm & Place Order'}
                        <MessageCircle className="w-4 h-4 text-white" />
                      </Button>
                    </>
                  ) : (
                    /* Step 1 Buttons */
                    <>
                      <p className="text-xs text-gray-400 text-center md:text-left leading-relaxed max-w-[280px]">
                        Add items and proceed to the checkout form to receive the invoice details via mail.
                      </p>
                      <Button
                        onClick={() => {
                          setIsCheckoutStep(true);
                        }}
                        className="bg-green-700 hover:bg-green-800 text-white font-bold h-12 px-6 rounded-xl w-full md:w-auto shrink-0 flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        Proceed to Checkout
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Director Biography Modal */}
      <AnimatePresence>
        {selectedDirectorBio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-green-100 relative overflow-hidden space-y-6"
            >
              <button
                onClick={() => setSelectedDirectorBio(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left pt-2">
                <img 
                  src={selectedDirectorBio.image} 
                  alt={selectedDirectorBio.name} 
                  className="w-28 h-36 rounded-2xl object-cover object-top border-2 border-emerald-600 shadow-md shrink-0"
                />
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-block mb-1.5">
                    Director Profile
                  </span>
                  <h3 className="text-2xl font-extrabold text-gray-900 leading-tight">{selectedDirectorBio.name}</h3>
                  <p className="text-xs font-bold text-emerald-700 mt-1 uppercase tracking-wide">
                    {selectedDirectorBio.designation}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/30 p-5 rounded-2xl border border-green-100/80 text-sm text-gray-700 leading-relaxed font-medium">
                {selectedDirectorBio.bio}
              </div>

              <Button
                onClick={() => setSelectedDirectorBio(null)}
                className="w-full bg-green-800 hover:bg-green-900 text-white font-bold py-3 rounded-xl cursor-pointer shadow-md"
              >
                Close Biography
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Floating Bottom-Right "Shop Now" Pop-up Widget (hidden when in Catalogue section or when items exist in WhatsApp cart) */}
      {whatsappCart.length === 0 && !isCatalogueInView && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <button
            onClick={() => {
              const el = document.getElementById('catalogue');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative flex items-center gap-3 bg-gradient-to-r from-green-800 via-emerald-800 to-green-900 text-white px-5 py-3.5 rounded-full shadow-2xl hover:shadow-green-900/40 border border-green-600/40 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            title="Click to view our products catalogue"
          >
            {/* Animated Pulse Ring */}
            <span className="absolute -inset-1 rounded-full bg-green-500/30 animate-ping pointer-events-none" />
            
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black uppercase tracking-wider leading-none">Shop Now</span>
              <span className="text-[10px] text-green-200/90 font-medium leading-tight mt-0.5">Explore 22 Varieties</span>
            </div>
            <ArrowRight className="w-4 h-4 text-green-300 group-hover:translate-x-1 transition-transform ml-1" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

  

