import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Leaf, Droplets, Zap, Sprout, Shield, Lightbulb, CheckCircle2, Truck, Globe, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

export function LearnMorePage() {
  const navigate = useNavigate();
  const [selectedDirectorBio, setSelectedDirectorBio] = useState<{
    name: string;
    designation: string;
    image: string;
    bio: string;
  } | null>(null);

  const microgreensVarieties = [
    'Green Gram',
    'Cress',
    'Sesame',
    'Red Cowpea',
    'Chia',
    'Radish',
    'Fenugreek'
  ];

  const whyChooseUs = [
    {
      icon: Droplets,
      title: '100% Hydroponically Grown',
      description: 'Clean RO water cultivation with no soil contamination.'
    },
    {
      icon: Leaf,
      title: 'Freshly Harvested Daily',
      description: 'Harvested only after receiving orders for maximum freshness.'
    },
    {
      icon: Shield,
      title: 'Chemical Free',
      description: 'No pesticides, herbicides or harmful fertilizers.'
    },
    {
      icon: Zap,
      title: 'Nutrient Dense',
      description: 'Contains significantly higher vitamins, minerals and antioxidants than mature vegetables.'
    },
    {
      icon: Sprout,
      title: 'Sustainable Farming',
      description: 'Uses less water and minimal land while producing maximum nutrition.'
    },
    {
      icon: Truck,
      title: 'Farm to Table',
      description: 'Freshly packed and delivered hygienically.'
    }
  ];

  const richInNutrients = [
    'Vitamin A', 'Vitamin C', 'Vitamin E', 'Vitamin K', 'Iron', 'Calcium', 
    'Magnesium', 'Potassium', 'Zinc', 'Dietary Fiber', 'Protein', 'Antioxidants'
  ];

  const healthAdvantages = [
    { emoji: '❤️', text: 'Supports Heart Health' },
    { emoji: '🩸', text: 'Helps Maintain Healthy Iron Levels' },
    { emoji: '🛡', text: 'Strengthens Immunity' },
    { emoji: '🧠', text: 'Supports Brain Function' },
    { emoji: '👁', text: 'Improves Eye Health' },
    { emoji: '💪', text: 'Builds Strength and Energy' },
    { emoji: '🌿', text: 'Supports Digestion' },
    { emoji: '⚖', text: 'Helps Weight Management' },
    { emoji: '🔥', text: 'Rich in Natural Antioxidants' }
  ];

  const microgreensUses = [
    'Healthy meals',
    'Salads',
    'Smoothies',
    'Sandwiches',
    'Soups',
    'Garnishing',
    'Fitness diets'
  ];

  const businessOpportunities = [
    'Restaurant supply',
    'Organic store partnerships',
    'Bulk orders',
    'Event supply',
    'Health and fitness collaborations',
    'Smart farming partnerships'
  ];

  const futurePlans = [
    'Online ordering system',
    'Smart farming automation',
    'Subscription delivery plans',
    'Educational workshops',
    'Hydroponic farming expansion',
    'Mobile application support'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold hidden sm:inline">Back</span>
          </button>
          <h1 className="text-2xl tracking-wide flex items-center gap-2">
            <span className="font-extrabold text-green-800">A2ZEE</span>
            <span className="font-semibold text-green-600 text-sm tracking-widest uppercase">Microgreenz</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pvt. Ltd.</span>
          </h1>
          <div className="w-12"></div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">About A2ZEE Microgreenz</h2>
          <p className="text-lg text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed">
            At A2ZEE Microgreenz, we cultivate premium-quality microgreens using advanced hydroponic farming techniques. Our microgreens are grown indoors under controlled conditions using RO water, without soil, pesticides or harmful chemicals.
          </p>
          <p className="text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed">
            Every harvest is carefully monitored to ensure freshness, hygiene and superior nutritional value.
          </p>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We are committed to promoting healthy living while protecting the environment through sustainable farming practices.
          </p>
        </section>

        {/* Mission & Vision */}
        <section className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-green-100">
            <h3 className="text-2xl font-bold text-green-700 mb-4">Our Mission</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              To improve health and wellness by delivering fresh, nutrient-rich microgreens while promoting environmentally sustainable agriculture.
            </p>
            <p className="text-sm text-gray-600">
              We believe healthy food should be fresh, chemical-free, and accessible to everyone.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border border-emerald-100">
            <h3 className="text-2xl font-bold text-emerald-700 mb-4">Our Vision</h3>
            <p className="text-gray-700 mb-6 leading-relaxed">
              To become India's leading microgreens brand through innovation, research, and sustainable farming practices.
            </p>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h4 className="font-semibold text-emerald-900 mb-3">Our Core Goal:</h4>
              <p className="text-sm text-emerald-800">
                Pioneering the future of smart, sustainable vertical hydroponic farming in India.
              </p>
            </div>
          </div>
        </section>

        {/* About the Directors */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/60 p-8 sm:p-10 rounded-3xl border border-green-200/80 shadow-sm space-y-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-extrabold text-green-700 uppercase tracking-widest bg-green-100/80 px-3 py-1 rounded-full">Visionary Leadership</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3 mb-4">About the Directors</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                A2Zee Microgreenz Pvt. Ltd. is not a layman initiative by amateurs, but a joint venture by professional scientists and academists, brewing out of their interest to introduce health and wellbeing through public awareness, optimized cultivation and marketing of the not so famous microgreens within the Indian population.
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
                <strong>Humanity at the Core:</strong> Humanity at the core of this venture, the directors hope to deliver packages suited for economically poor lactating mothers, anemic, vitamin-deficient, and malnourished populations as well as weight management packages.
              </p>
              <p>
                <strong>Organic RO Hydroponics & Research:</strong> The microgreens are organically grown without any chemical additives or pesticides, hydroponically using RO water. These scientists are also conducting research on improvising and enriching the nutrients in each of these microgreens using various modified culturing techniques. A2Zee Microgreenz will not just look at one aspect; it will cover end-to-end all aspects pertaining to these micro-natural resources.
              </p>
            </div>

            {/* Inspiring Tagline Box */}
            <div className="bg-gradient-to-r from-emerald-800 to-green-900 text-white p-6 rounded-2xl text-center shadow-md">
              <p className="text-base sm:text-lg font-extrabold tracking-wide">
                "This is not just a business Initiative; its a Refreshing Revival and MicroRevolution!"
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-lg mb-16 border border-green-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Who We Are</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Organization Details</h4>
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">A2ZEE Microgreenz</span>
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                No. 1, Sivaswamy Avenue, MGR Salai<br/>
                Palavakkam, Chennai 600041<br/>
                Tamil Nadu, India
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Get In Touch</h4>
              <div className="space-y-3">
                <a href="tel:+917338840084" className="flex items-center gap-3 text-green-600 hover:text-green-700 transition-colors">
                  <Phone className="w-5 h-5 text-green-500" />
                  <span>+91 73388 40084</span>
                </a>
                <a href="mailto:a2zeemicrogreenz@gmail.com" className="flex items-center gap-3 text-green-600 hover:text-green-700 transition-colors">
                  <Mail className="w-5 h-5 text-green-500" />
                  <span>a2zeemicrogreenz@gmail.com</span>
                </a>
                <a href="https://a2zeemicrogreenz.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-green-600 hover:text-green-700 transition-colors">
                  <Globe className="w-5 h-5 text-green-500" />
                  <span>https://a2zeemicrogreenz.com/</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* What Are Microgreens */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">What Are Microgreens?</h3>
          <div className="bg-white p-8 rounded-lg border border-green-100 mb-8">
            <p className="text-gray-700 mb-6">
              Microgreens are young vegetable greens harvested at an early stage of growth. They are rich in nutrients, antioxidants, vitamins, and minerals.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Common Uses:</h4>
                <ul className="grid grid-cols-2 gap-2">
                  {microgreensUses.map((use, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="text-green-600 mr-2">•</span>
                      {use}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Known For:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start text-gray-700">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>High nutritional value</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Fresh taste</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Fast growth cycle</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Natural farming benefits</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Our Products */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Our Products</h3>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-lg border border-green-200">
            <p className="text-gray-700 mb-6">We cultivate a variety of fresh microgreens:</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {microgreensVarieties.map((variety, index) => (
                <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg border border-green-100">
                  <Leaf className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{variety}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Why Choose A2ZEE?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseUs.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-lg border border-green-100 hover:border-green-300 hover:shadow-lg transition-all duration-300">
                  <Icon className="w-8 h-8 text-green-600 mb-3 animate-pulse" />
                  <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Technology Features */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Smart Hydroponic Farming</h3>
          <p className="text-gray-600 mb-8 max-w-3xl leading-relaxed">
            We use modern indoor farming systems to produce fresh, safe and nutritious microgreens throughout the year.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg border border-green-100">
              <h4 className="font-semibold text-gray-900 mb-4">Technology Includes:</h4>
              <ul className="space-y-3 text-gray-700">
                {[
                  'RO Water Based Hydroponics',
                  'Controlled Environment',
                  'Hygienic Indoor Cultivation',
                  'Sustainable Water Management'
                ].map((tech, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-green-600 mr-3 font-bold">•</span>
                    <span>{tech}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-50 p-8 rounded-lg border border-emerald-200">
              <h4 className="font-semibold text-gray-900 mb-4">System Benefits:</h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-3 font-bold">✓</span>
                  <span>Better plant growth</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-3 font-bold">✓</span>
                  <span>Consistent quality</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-3 font-bold">✓</span>
                  <span>Faster cultivation cycles</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-3 font-bold">✓</span>
                  <span>Reduced wastage</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Health Benefits */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Why Eat Microgreens?</h3>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-lg border border-green-200 space-y-6">
            <p className="text-gray-700 leading-relaxed font-semibold">
              Microgreens are harvested at the perfect stage when nutrients are naturally concentrated.
            </p>
            
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-green-800 uppercase tracking-wider">Rich In:</h4>
              <div className="flex flex-wrap gap-2">
                {richInNutrients.map((nutri) => (
                  <span key={nutri} className="bg-white text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-100 shadow-sm">
                    {nutri}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-green-100">
              <h4 className="text-sm font-bold text-green-800 uppercase tracking-wider">Health Advantages:</h4>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {healthAdvantages.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg border border-green-100">
                    <span className="text-lg shrink-0">{item.emoji}</span>
                    <span className="text-gray-700 text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quality Standards */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Our Quality Standards</h3>
          <div className="bg-white p-8 rounded-lg border border-green-100">
            <p className="text-gray-700 mb-6">We ensure every product meets high-quality standards:</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg">
                <span className="text-green-600 text-lg font-bold">✓</span>
                <span className="text-gray-700">Fresh production</span>
              </div>
              <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg">
                <span className="text-green-600 text-lg font-bold">✓</span>
                <span className="text-gray-700">Safe handling</span>
              </div>
              <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg">
                <span className="text-green-600 text-lg font-bold">✓</span>
                <span className="text-gray-700">Hygienic packaging</span>
              </div>
              <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg">
                <span className="text-green-600 text-lg font-bold">✓</span>
                <span className="text-gray-700">Daily monitoring</span>
              </div>
              <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg">
                <span className="text-green-600 text-lg font-bold">✓</span>
                <span className="text-gray-700">Consistent quality checks</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <span className="font-semibold">Priority:</span> Customer satisfaction and food safety are our top priorities.
            </p>
          </div>
        </section>

        {/* Sustainability */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Growing Green for a Better Tomorrow</h3>
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-8 rounded-lg border border-emerald-200">
            <p className="text-gray-700 mb-6 leading-relaxed">
              Together, we're creating a healthier future for people and the planet. Our farming methods use:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">Up to 90% less water</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">No soil degradation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">No chemical pesticides</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">Minimal carbon footprint</span>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">Eco-friendly packaging</span>
              </div>
            </div>
          </div>
        </section>

        {/* Business Opportunities */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Business Opportunities</h3>
          <div className="bg-white p-8 rounded-lg border border-green-100">
            <p className="text-gray-700 mb-6">A2ZEEMicrogreenz welcomes partnerships and collaborations:</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {businessOpportunities.map((opportunity, index) => (
                <div key={index} className="flex items-center gap-3 bg-green-50 p-4 rounded-lg border border-green-200">
                  <span className="text-green-600 font-bold">→</span>
                  <span className="text-gray-700">{opportunity}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Future Goals */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Future Goals</h3>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 p-8 rounded-lg border border-blue-200">
            <p className="text-gray-700 mb-6">We aim to expand our services and introduce more innovative farming solutions:</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {futurePlans.map((plan, index) => (
                <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-blue-100">
                  <span className="text-blue-600 text-lg font-bold">★</span>
                  <span className="text-gray-700">{plan}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research & Innovation */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Science Behind Every Harvest</h3>
          <div className="bg-white p-8 rounded-lg border border-green-100 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <p className="text-gray-700 leading-relaxed font-semibold">
                A2ZEE Microgreenz continuously works on research and innovation in:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Hydroponic optimization',
                  'Sustainable cultivation',
                  'Nutrient enhancement',
                  'Storage optimization',
                  'AI-assisted farming',
                  'Customized nutrient-balanced salad formulations'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-80 rounded-2xl overflow-hidden border border-green-50 shadow-md shrink-0">
              <img 
                src="/innovation_research.png" 
                alt="Science Behind Every Harvest" 
                className="w-full h-40 object-cover"
              />
            </div>
          </div>
        </section>

        {/* Our Commitment */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-12 rounded-lg text-center">
            <h3 className="text-3xl font-bold mb-4">Our Commitment</h3>
            <p className="text-lg mb-4 max-w-2xl mx-auto">
              At A2ZEE Microgreenz, we are committed to delivering freshness, nutrition, and sustainability through every product we grow.
            </p>
            <p className="text-lg opacity-90">
              We believe that small greens can create a big impact on health and lifestyle.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
          <p className="text-gray-600 mb-8">Join thousands of health-conscious customers enjoying fresh microgreens.</p>
          <Button
            onClick={() => {
              navigate('/');
              setTimeout(() => {
                const element = document.getElementById('catalogue') || document.getElementById('products');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }, 150);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg cursor-pointer"
          >
            Order Now
          </Button>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-12 text-center text-gray-600 space-y-2">
          <p className="font-semibold text-green-700 tracking-wider">Fresh • Healthy • Sustainable</p>
          <p className="text-xs text-gray-400">Chennai, Tamil Nadu, India</p>
          <p className="text-sm">© 2026 A2ZEE Microgreenz. All Rights Reserved.</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 text-sm pt-2">
            <a href="tel:+917338840084" className="text-green-600 hover:text-green-700 font-semibold">+91 73388 40084</a>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <a href="mailto:a2zeemicrogreenz@gmail.com" className="text-green-600 hover:text-green-700 font-semibold">a2zeemicrogreenz@gmail.com</a>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <a href="https://a2zeemicrogreenz.com/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 font-semibold">https://a2zeemicrogreenz.com/</a>
          </div>
        </footer>
      </main>

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
    </div>
  );
}
