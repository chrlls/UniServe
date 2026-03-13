import { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, BarChart2, Zap, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const roleRedirects = {
  admin: '/admin/dashboard',
  cashier: '/cashier/pos',
  customer: '/menu',
};

const FEATURES = [
  { icon: Shield,    text: 'Secure, role-aware workflows for canteen staff.' },
  { icon: BarChart2, text: 'Real-time visibility across orders and inventory.' },
  { icon: Zap,       text: 'Faster daily service with fewer manual steps.' },
];

const panelVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2, delayChildren: 0.5 } },
};
const panelItem = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
const timelineContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.32, delayChildren: 0.9 } },
};
const timelineItem = {
  hidden: { opacity: 0, x: -32, scale: 0.97 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
const timelineAccent = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1, transition: { duration: 0.5, ease: 'easeOut', delay: 0.2 } },
};
const fieldAnim = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode]                 = useState('login');
  const [form, setForm]                 = useState({ email: '', password: '', remember: false, name: '', password_confirmation: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');
  const [fieldErrors, setFieldErrors]   = useState({});

  function toggleMode() {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError('');
    setFieldErrors({});
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: '' }));
    if (error) setError('');
  }

  function validate() {
    const errs = {};
    if (mode === 'register' && !form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (mode === 'register' && form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (mode === 'register' && form.password !== form.password_confirmation)
      errs.password_confirmation = 'Passwords do not match.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setIsSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      let user;
      if (mode === 'login') {
        user = await login(form);
      } else {
        user = await register({
          name: form.name,
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
        });
      }
      navigate(roleRedirects[user.role] ?? '/', { replace: true });
    } catch (err) {
      setError(err.message ?? (mode === 'login' ? 'Login failed.' : 'Registration failed.'));
      if (err.errors) {
        const mapped = {};
        for (const [key, messages] of Object.entries(err.errors)) {
          mapped[key] = messages[0];
        }
        setFieldErrors(mapped);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LayoutGroup>
    <div className="min-h-screen w-full flex items-center justify-center bg-[#EEF2F7] px-4 py-10">
      <motion.div
        className="w-full max-w-[960px] bg-white rounded-2xl shadow-xl grid grid-cols-1 lg:grid-cols-[55%_45%]"
        layout
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], layout: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
      >

        {/* Left: Marketing panel (desktop only) */}
        <motion.div layout className="hidden lg:flex flex-col justify-between p-10 bg-white rounded-l-2xl overflow-hidden" variants={panelVariants} initial="hidden" animate="visible">

          {/* Wordmark */}
          <motion.div className="flex items-center gap-3" variants={panelItem}>
            <div className="w-12 h-12 rounded-xl bg-[#1B3A6B] flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#0F1C2E] tracking-tight">UniServe</span>
          </motion.div>

          {/* Hero headline */}
          <motion.div className="flex-1 flex flex-col justify-center py-10" variants={panelItem}>
            <h1 className="text-4xl font-bold text-[#0F1C2E] leading-tight mb-4">
              Canteen management,<br />simplified for<br />everyday campus <br/>service.
            </h1>
            <p className="text-[#4B5F76] text-base leading-relaxed max-w-sm">
              UniServe gives your team the tools to manage orders, track inventory,
              and serve students faster.
            </p>
          </motion.div>

          {/* Feature bullets — timeline sequence */}
          <motion.div className="space-y-3" variants={timelineContainer} initial="hidden" animate="visible">
            {FEATURES.map(({ icon: Icon, text }) => (
              <motion.div
                key={text}
                variants={timelineItem}
                className="relative flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 overflow-hidden"
              >
                {/* Left accent line that grows in */}
                <motion.span
                  variants={timelineAccent}
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-[#2563EB] origin-top"
                />
                <Icon className="w-5 h-5 text-[#2563EB] shrink-0" />
                <span className="text-sm text-[#4B5F76]">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: Form card */}
        <motion.div layout className="flex items-center justify-center bg-[#EEF2F7] p-4 lg:p-6 overflow-hidden rounded-2xl lg:rounded-l-none lg:rounded-r-2xl">
          <motion.div layout className="bg-white rounded-2xl shadow-lg w-full p-8">

            {/* Mobile wordmark */}
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-[#1B3A6B] flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-[#0F1C2E] tracking-tight">UniServe</span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                layout
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut', layout: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
              >

            {/* Heading */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#0F1C2E]">
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </h2>
                <p className="text-sm text-[#4B5F76] mt-1">
                  {mode === 'login'
                    ? 'Welcome back. Enter your account details to continue.'
                    : 'Fill in the details below to create your account.'}
                </p>
              </div>

            {/* Global error */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Name - register only */}
              {mode === 'register' && (
                <motion.div
                  className="space-y-1.5"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Label htmlFor="name" className="text-sm font-medium text-[#0F1C2E]">Full name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                    className={fieldErrors.name ? 'border-red-400 focus-visible:ring-red-300' : ''}
                  />
                  {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
                </motion.div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-[#0F1C2E]">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className={`pl-10 ${fieldErrors.email ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                  />
                </div>
                {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-[#0F1C2E]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    className={`pl-10 pr-10 ${fieldErrors.password ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#4B5F76] transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
              </div>

              {/* Password confirm - register only */}
              {mode === 'register' && (
                <motion.div
                  className="space-y-1.5"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Label htmlFor="password_confirmation" className="text-sm font-medium text-[#0F1C2E]">
                    Confirm password
                  </Label>
                  <Input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    value={form.password_confirmation}
                    onChange={handleChange}
                    className={fieldErrors.password_confirmation ? 'border-red-400 focus-visible:ring-red-300' : ''}
                  />
                  {fieldErrors.password_confirmation && (
                    <p className="text-xs text-red-500">{fieldErrors.password_confirmation}</p>
                  )}
                </motion.div>
              )}

              {/* Remember me + Forgot password - login only */}
              {mode === 'login' && (
                <motion.div
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={form.remember}
                      onCheckedChange={(checked) =>
                        setForm((p) => ({ ...p, remember: checked === true }))
                      }
                    />
                    <Label htmlFor="remember" className="text-sm text-[#4B5F76] cursor-pointer font-normal">
                      Remember me
                    </Label>
                  </div>
                  <Link to="#" className="text-sm text-[#2563EB] hover:underline">
                    Forgot password?
                  </Link>
                </motion.div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#1B3A6B] hover:bg-[#152E58] text-white text-base font-semibold rounded-lg mt-2"
              >
                {isSubmitting
                  ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                  : (mode === 'login' ? 'Sign in' : 'Create account')}
              </Button>
            </form>

              </motion.div>
            </AnimatePresence>

            {/* Mode toggle */}
            <p className="mt-5 text-sm text-center text-[#4B5F76]">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-[#1B3A6B] hover:underline"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>


          </motion.div>
        </motion.div>

      </motion.div>
    </div>
    </LayoutGroup>
  );
}
