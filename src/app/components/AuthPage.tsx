import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, Leaf, Mail, Lock, User, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const loggedInUser = await signInWithEmail(email, password);
      // If on /admin path, redirect to the correct dashboard based on role
      if (location.pathname === '/admin') {
        if (loggedInUser.role === 'superadmin') navigate('/superadmin', { replace: true });
        else if (loggedInUser.role === 'seller') navigate('/seller/dashboard', { replace: true });
        else navigate('/home', { replace: true });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      if (errorMessage.includes('API key') || errorMessage.includes('invalid-api-key')) {
        setError('Firebase not configured. Please see SETUP_HELP.md.');
      } else {
        setError(errorMessage);
      }
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(email, password, name, role);
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      if (errorMessage.includes('API key') || errorMessage.includes('invalid-api-key')) {
        setError('Firebase not configured. Please see SETUP_HELP.md.');
      } else {
        setError(errorMessage);
      }
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await resetPassword(email);
      setSuccessMessage('Password reset link has been sent to your email.');
      setIsForgotPassword(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAF8] overflow-hidden relative">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-green-200 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-emerald-200 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-5xl w-full mx-4 flex bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-green-50 relative z-10 min-h-[700px]">
        {/* Left Side: Image & Branding */}
        <div className="hidden lg:flex w-1/2 relative bg-green-900 overflow-hidden">
          <img
            src="/hero_microgreens.png"
            alt="Microgreens"
            className="absolute inset-0 w-full h-full object-cover opacity-60 scale-110 hover:scale-100 transition-transform duration-[10s]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-green-950 via-green-900/40 to-transparent" />

          <div className="relative z-20 p-12 flex flex-col justify-between h-full text-white">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              {/* <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
                <Leaf className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-2xl font-bold tracking-tight">A2ZEE</span> */}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold leading-tight mb-4">
                Purely Organic,<br />
                Truly Healthy.
              </h2>
              <p className="text-green-100/70 text-lg max-w-sm">
                Join our community and get the freshest microgreens delivered to your doorstep.
              </p>
            </motion.div>

            <div className="flex gap-4">
              <div className="w-12 h-1 bg-green-500 rounded-full" />
              <div className="w-4 h-1 bg-white/20 rounded-full" />
              <div className="w-4 h-1 bg-white/20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 md:p-16 flex flex-col relative">
          <button
            onClick={() => navigate('/')}
            className="absolute top-8 left-8 lg:left-12 p-2 hover:bg-green-50 rounded-full transition-colors text-gray-400 hover:text-green-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-10 text-center lg:text-left">
                  <div className="flex justify-center lg:center mb-6">
                    <img src="/logo.png" alt="A2ZEE" className="h-16 w-16 object-contain" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-green-950 mb-2">
                    {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Get Started'}
                  </h1>
                  <p className="text-gray-500">
                    {isForgotPassword
                      ? 'Enter your email to receive a reset link.'
                      : isLogin
                        ? 'Please enter your details to sign in.'
                        : 'Create an account to start your journey.'}
                  </p>
                </div>

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm flex items-center gap-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {successMessage}
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {error}
                  </motion.div>
                )}

                <form onSubmit={isForgotPassword ? handleResetPassword : (isLogin ? handleLogin : handleRegister)} className="space-y-5">
                  {!isLogin && !isForgotPassword && (
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold ml-1">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="pl-12 h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-green-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold ml-1">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="pl-12 h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-green-500/20 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {!isForgotPassword && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <Label className="text-gray-700 font-semibold">Password</Label>
                        {isLogin && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsForgotPassword(true);
                              setError('');
                              setSuccessMessage('');
                            }}
                            className="text-xs text-green-700 font-bold hover:underline"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="password"
                          autoComplete={isLogin ? 'current-password' : 'new-password'}
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-12 h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-green-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {!isLogin && !isForgotPassword && (
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold ml-1 text-sm">Account Type</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          className="pl-12 h-14 w-full rounded-2xl bg-gray-50 border border-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all appearance-none"
                          value={role}
                          onChange={(e) => setRole(e.target.value as UserRole)}
                        >
                          <option value="buyer">Individual Buyer</option>
                          <option value="seller">Business Seller</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-green-800 hover:bg-green-900 text-white text-lg font-bold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-gray-500 text-sm">
                    {isForgotPassword ? (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(false)}
                        className="text-green-700 font-bold hover:text-green-800 transition-colors"
                      >
                        Back to Login
                      </button>
                    ) : (
                      <>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                          type="button"
                          onClick={() => setIsLogin(!isLogin)}
                          className="ml-2 text-green-700 font-bold hover:text-green-800 transition-colors"
                        >
                          {isLogin ? 'Register Now' : 'Sign In Here'}
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-12 text-center text-[10px] text-gray-400 uppercase tracking-widest">
            © 2026 A2ZEE MICROGREENZ
          </div>
        </div>
      </div>
    </div>
  );
}
