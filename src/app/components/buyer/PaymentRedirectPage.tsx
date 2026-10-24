import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { Card, CardContent } from '../ui/card';
import { ArrowLeft, Smartphone, ShieldCheck } from 'lucide-react';

export function PaymentRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById } = useData();

  const order = id ? getOrderById(id) : undefined;
  const amount = order?.totalAmount || 0;
  const payeeVpa = 'judy.je.gopal@okhdfcbank';
  const payeeName = 'A2Zee Microgreenz';

  const upiUrl = `upi://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order ${id || 'Payment'}`)}`;
  const gpayUrl = `intent://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order ${id || 'Payment'}`)}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`;
  const phonepeUrl = `phonepe://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order ${id || 'Payment'}`)}`;
  const paytmUrl = `paytmmp://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order ${id || 'Payment'}`)}`;

  useEffect(() => {
    // Instantly launch native UPI app chooser (GPay, PhonePe, Paytm) on page load
    window.location.href = upiUrl;
  }, [upiUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 text-white p-6 text-center relative">
          <button 
            onClick={() => navigate(-1)}
            className="absolute left-4 top-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-white/20 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3 backdrop-blur-md border border-white/20">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight">Complete Payment</h1>
          <p className="text-green-100/90 text-xs mt-1 font-medium">A2ZEE Microgreens Organic Superfoods</p>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Amount Box */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-5 text-center">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Payable Amount</p>
            <p className="text-3xl font-black text-emerald-950 mt-1">₹{amount}</p>
            {id && <p className="text-xs text-emerald-700 mt-1 font-medium">Order ID: #{id}</p>}
          </div>

          {/* Direct Launch Button */}
          <div>
            <a
              href={upiUrl}
              className="w-full bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:to-green-800 text-white font-extrabold text-base py-4 rounded-2xl shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-3 text-center block"
            >
              <Smartphone className="w-5 h-5" />
              Pay ₹{amount} with GPay / UPI App
            </a>
            <p className="text-[11px] text-gray-500 text-center mt-2 font-medium">
              Tapping will open Google Pay, PhonePe, Paytm or BHIM installed on your phone.
            </p>
          </div>

          {/* Quick Individual App Buttons */}
          <div className="space-y-2.5 pt-2 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Or select specific payment app:</p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={gpayUrl}
                className="p-3 bg-white border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 shadow-sm group"
              >
                <span className="font-extrabold text-xs text-gray-800 group-hover:text-emerald-700">GPay</span>
                <span className="text-[10px] text-gray-400">Google Pay</span>
              </a>
              <a
                href={phonepeUrl}
                className="p-3 bg-white border border-gray-200 hover:border-purple-500 hover:bg-purple-50 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 shadow-sm group"
              >
                <span className="font-extrabold text-xs text-purple-800 group-hover:text-purple-700">PhonePe</span>
                <span className="text-[10px] text-gray-400">PhonePe</span>
              </a>
              <a
                href={paytmUrl}
                className="p-3 bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 shadow-sm group"
              >
                <span className="font-extrabold text-xs text-blue-800 group-hover:text-blue-700">Paytm</span>
                <span className="text-[10px] text-gray-400">Paytm UPI</span>
              </a>
            </div>
          </div>

          {/* Desktop QR Fallback */}
          <div className="pt-2 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 font-medium mb-2">On desktop? Scan QR code with any UPI app:</p>
            <img 
              src="/gpay_qr.png" 
              alt="GPay Payment QR" 
              className="w-36 h-36 mx-auto rounded-2xl border border-gray-300 p-1 bg-white shadow-sm"
            />
          </div>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Encrypted & Secure Bank Transfer</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
