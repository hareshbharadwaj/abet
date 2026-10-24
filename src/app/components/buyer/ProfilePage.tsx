import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { User, MapPin, Bell, HelpCircle, LogOut, ChevronRight, X, Check, Phone, Home, Edit2 } from 'lucide-react';

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // State management
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Edit profile state
  const [editFormData, setEditFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Addresses state
  const [addresses, setAddresses] = useState([
    { id: 1, type: 'Home', address: '123 Main Street, Chennai', default: true },
    { id: 2, type: 'Work', address: '456 Business Park, Chennai', default: false },
  ]);
  const [newAddress, setNewAddress] = useState({ type: 'Home', address: '' });
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    orders: true,
    promotions: true,
    deliveryUpdates: true,
    newsletter: false,
  });

  // FAQ data
  const faqs = [
    {
      q: 'How do I track my order?',
      a: 'Go to Orders section to see real-time tracking for all your orders with delivery status and estimated arrival time.'
    },
    {
      q: 'What is your return policy?',
      a: 'We offer 7-day returns for any product in original condition. Contact support for hassle-free returns.'
    },
    {
      q: 'How are microgreens stored?',
      a: 'Keep microgreens in a cool place (2-4°C) in the provided packaging. They stay fresh for up to 10 days.'
    },
    {
      q: 'Do you deliver on Sundays?',
      a: 'Yes, we deliver 7 days a week including holidays. Same-day delivery available for orders before 10 AM.'
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleEditProfile = () => {
    setEditFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveProfile = () => {
    // In real app, this would call an API to update user data
    console.log('Profile updated:', editFormData);
    setEditDialogOpen(false);
  };

  const handleAddAddress = () => {
    if (newAddress.address.trim()) {
      setAddresses([...addresses, { id: Date.now(), ...newAddress, default: false }]);
      setNewAddress({ type: 'Home', address: '' });
    }
  };

  const handleDeleteAddress = (id: number) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  const handleSetDefaultAddress = (id: number) => {
    setAddresses(addresses.map(addr => ({ ...addr, default: addr.id === id })));
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatMemberSince = (createdAt?: string) => {
    try {
      if (createdAt) {
        const date = new Date(createdAt);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
          });
        }
      }
    } catch (error) {
      // ignore and fallback
    }
    return new Date().toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  };

  const menuItems = [
    { 
      icon: Edit2, 
      label: 'Edit Profile', 
      onClick: handleEditProfile,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    { 
      icon: MapPin, 
      label: 'Saved Addresses', 
      onClick: () => setAddressDialogOpen(true),
      color: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      onClick: () => setNotificationDialogOpen(true),
      color: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    { 
      icon: HelpCircle, 
      label: 'Help & Support', 
      onClick: () => setHelpDialogOpen(true),
      color: 'bg-green-50',
      iconColor: 'text-green-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10 md:pb-20">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-8 md:p-16 rounded-b-[3rem] shadow-xl">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white/30 shadow-2xl">
            <AvatarImage src={user?.photoURL} />
            <AvatarFallback className="bg-white text-green-600 text-3xl font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-bold mb-2">{user?.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <Badge className="bg-white/20 hover:bg-white/30 border-none px-4 py-1 backdrop-blur-md">
                {user?.email}
              </Badge>
              <Badge className="bg-green-400/20 hover:bg-green-400/30 border-none px-4 py-1 backdrop-blur-md capitalize">
                {user?.role} Account
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8 -mt-10">
        <div className="space-y-6">
          {/* Stats Card */}
          <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-2 gap-8 divide-x divide-gray-100">
                <div className="text-center px-4">
                  <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Member Since</p>
                  <p className="font-bold text-gray-900 md:text-lg">
                    {formatMemberSince(user?.createdAt)}
                  </p>
                </div>
                <div className="text-center px-4">
                  <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="font-bold text-green-600 md:text-lg capitalize">{user?.status || 'Active'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items */}
          <div className="grid grid-cols-1 gap-3">
            {menuItems.map((item, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <Card
                    className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-none rounded-2xl bg-white"
                    onClick={item.onClick}
                  >
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`${item.color} p-3 rounded-xl group-hover:bg-green-600 transition-colors duration-300`}>
                          <item.icon className={`w-6 h-6 ${item.iconColor} group-hover:text-white transition-colors duration-300`} />
                        </div>
                        <span className="font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{item.label}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-green-50 group-hover:translate-x-1 transition-all">
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
              </Dialog>
            ))}
          </div>

          {/* Sign Out Button */}
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center h-14 text-red-600 hover:text-white hover:bg-red-500 rounded-xl font-bold transition-all"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out from Device
              </Button>
            </CardContent>
          </Card>

          <div className="text-center space-y-2 pt-8 pb-4">
            <p className="text-sm font-bold text-gray-300 uppercase tracking-[0.2em]">A2ZEE MICROGREENZ v1.2.0</p>
            <p className="text-xs text-gray-400 font-medium">Proudly serving fresh organic greens</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                placeholder="Enter your name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                placeholder="Enter your email"
                type="email"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={editFormData.phone}
                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                placeholder="Enter your phone number"
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveProfile} className="flex-1 bg-green-600 hover:bg-green-700">Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Addresses Modal */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="max-w-md max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Saved Addresses</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing Addresses */}
            <div className="space-y-3">
              {addresses.map((addr) => (
                <Card key={addr.id} className="p-4 border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-green-600" />
                      <Badge variant={addr.default ? 'default' : 'outline'}>{addr.type}</Badge>
                      {addr.default && <Badge className="bg-green-100 text-green-700">Default</Badge>}
                    </div>
                    <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{addr.address}</p>
                  {!addr.default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="w-full text-xs"
                    >
                      Set as Default
                    </Button>
                  )}
                </Card>
              ))}
            </div>

            {/* Add New Address */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold">Add New Address</h4>
              <div>
                <Label>Address Type</Label>
                <select
                  value={newAddress.type}
                  onChange={(e) => setNewAddress({...newAddress, type: e.target.value})}
                  className="w-full mt-1 p-2 border rounded-lg"
                >
                  <option>Home</option>
                  <option>Work</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                  placeholder="Enter full address"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddAddress} className="w-full bg-green-600 hover:bg-green-700">Add Address</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Modal */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {[
              { key: 'orders' as const, label: 'Order Updates', icon: '📦' },
              { key: 'promotions' as const, label: 'Promotions & Offers', icon: '🎉' },
              { key: 'deliveryUpdates' as const, label: 'Delivery Updates', icon: '🚚' },
              { key: 'newsletter' as const, label: 'Weekly Newsletter', icon: '📬' },
            ].map((notif) => (
              <div key={notif.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span>{notif.icon}</span>
                  <span className="font-medium text-gray-700">{notif.label}</span>
                </div>
                <button
                  onClick={() => handleNotificationChange(notif.key)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications[notif.key] ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notifications[notif.key] ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}
            <Button onClick={() => setNotificationDialogOpen(false)} className="w-full bg-green-600 hover:bg-green-700 mt-4">
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help & Support Modal */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="max-w-md max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Contact Us</span>
              </div>
              <a href="tel:+917338840084" className="text-green-600 hover:underline text-sm">+91 73388 40084</a>
              <p className="text-xs text-gray-600 mt-1">Available 9 AM - 6 PM, Monday to Saturday</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Frequently Asked Questions</h4>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <details key={idx} className="group border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                    <summary className="font-medium text-sm flex justify-between items-center">
                      {faq.q}
                      <span className="group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <p className="text-xs text-gray-600 mt-2">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
