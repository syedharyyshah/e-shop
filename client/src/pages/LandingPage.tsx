import { useNavigate } from 'react-router-dom';
import {
  Store,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Wallet,
  BarChart3,
  Shield,
  Bell,
  Zap,
  ArrowRight,
  CheckCircle2,
  Star,
  TrendingUp,
  Clock,
  Globe,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const features = [
  {
    icon: Package,
    title: 'Product Management',
    desc: 'Keep complete track of your products — stock, price, categories all in one place.',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: ShoppingCart,
    title: 'Order Tracking',
    desc: 'Track every order in real-time and keep your customers satisfied.',
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Wallet,
    title: 'Loan Management',
    desc: 'Keep record of loans — know which customer owes what amount.',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: FileText,
    title: 'Invoice Generator',
    desc: 'Generate professional invoices in one click and print them.',
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Users,
    title: 'Customer Records',
    desc: 'Manage your customers complete history and details all in one place.',
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-500/10',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    desc: 'Understand your shop performance through charts and graphs to improve it.',
    color: 'from-indigo-500 to-blue-500',
    bg: 'bg-indigo-500/10',
  },
];

const stats = [
  { value: '500+', label: 'Active Shops', icon: Store },
  { value: '99.9%', label: 'Uptime', icon: Zap },
  { value: '24/7', label: 'Support', icon: Clock },
  { value: '100%', label: 'Secure', icon: Shield },
];

const benefits = [
  'Easy and simple interface',
  'Real-time stock alerts',
  'Designed for Pakistani market',
  'Loan and credit tracking',
  'Professional invoices',
  'Admin dashboard',
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden font-sans">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[80px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#080c14]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                SHS Shop Flow
              </span>
              <span className="text-[10px] text-blue-400 uppercase tracking-widest font-medium">
                Enterprise
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Benefits', 'Stats'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-white/60 hover:text-white transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <button
              id="nav-login-btn"
              onClick={() => navigate('/login')}
              className="px-5 py-2 text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/30 rounded-xl transition-all duration-200"
            >
              Login
            </button>
            <button
              id="nav-signup-btn"
              onClick={() => navigate('/signup')}
              className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-blue-300 font-medium">Pakistan's #1 Shop Management System</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
            <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
              Your Shop,
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Run Smartly
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            <span className="text-white/80 font-medium">SHS Shop Flow</span> is a complete shop management system —
            products, orders, loans, invoices and customers — all in one place, easy and fast.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              id="hero-signup-btn"
              onClick={() => navigate('/signup')}
              className="group flex items-center gap-2 px-8 py-4 text-base font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-2xl transition-all duration-300 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
            >
              Start Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              id="hero-login-btn"
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-4 text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/30 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:bg-white/5"
            >
              Login
            </button>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="relative mx-auto max-w-4xl">
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
              {/* Fake Dashboard Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-4 text-xs text-white/30 font-mono">SHS Shop Flow — Dashboard</span>
              </div>
              {/* Dashboard Content Mockup */}
              <div className="p-6 grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Sales', val: 'PKR 2.4L', color: 'text-emerald-400', icon: TrendingUp },
                  { label: 'Orders Today', val: '47', color: 'text-blue-400', icon: ShoppingCart },
                  { label: 'Products', val: '312', color: 'text-violet-400', icon: Package },
                  { label: 'Pending Loans', val: 'PKR 85K', color: 'text-orange-400', icon: Wallet },
                ].map((card) => (
                  <div key={card.label} className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <card.icon className={`w-4 h-4 ${card.color}`} />
                      <p className="text-xs text-white/40">{card.label}</p>
                    </div>
                    <p className={`text-xl font-bold ${card.color}`}>{card.val}</p>
                  </div>
                ))}
              </div>
              {/* Chart bar mockup */}
              <div className="px-6 pb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-end gap-2 h-20">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-blue-600 to-violet-600 opacity-60 hover:opacity-100 transition-opacity"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/30 mt-2">Monthly Sales Chart</p>
                </div>
              </div>
              {/* Glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-transparent to-transparent pointer-events-none" />
            </div>
            {/* Floating notifications */}
            <div className="absolute -right-4 top-16 bg-[#0f1520] border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-white/80">New order received!</span>
              </div>
            </div>
            <div className="absolute -left-4 bottom-24 bg-[#0f1520] border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-white/80">Stock alert cleared</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm hover:bg-white/[0.06] transition-all duration-300 hover:border-white/10 group"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-blue-400 group-hover:scale-110 transition-transform" />
                <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                <p className="text-sm text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Everything In One Place
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              SHS Shop Flow has everything you need to run your shop efficiently
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Gradient background blob */}
                <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${feature.color} opacity-5 group-hover:opacity-10 transition-opacity blur-2xl`} />
                
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${feature.bg} border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 bg-gradient-to-br ${feature.color} bg-clip-text`} style={{ color: 'transparent', filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' }} />
                  <feature.icon className={`w-6 h-6 absolute bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`} />
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left - Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <Star className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300">Why Choose Us?</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                Built For{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Pakistani Shopkeepers
                </span>
              </h2>
              <p className="text-white/40 text-lg mb-8 leading-relaxed">
                Our system is specifically designed keeping Pakistan's local market in mind. 
                Urdu-friendly, PKR currency, and credit tracking — everything for you.
              </p>
              <div className="space-y-3">
                {benefits.map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-white/70">{b}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex gap-4">
                <button
                  id="benefits-signup-btn"
                  onClick={() => navigate('/signup')}
                  className="group flex items-center gap-2 px-6 py-3 font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:scale-105"
                >
                  Sign Up Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right - Mockup Cards */}
            <div className="relative">
              <div className="space-y-4">
                {/* Notification card */}
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/[0.07] transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">Low Stock Alert</p>
                      <p className="text-xs text-white/40 mt-1">Rice (Basmati) — only 5 kg remaining</p>
                      <div className="mt-2 w-full bg-white/5 rounded-full h-1.5">
                        <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: '15%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order card */}
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 backdrop-blur-sm ml-8 hover:bg-white/[0.07] transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white text-sm">New Order #0421</p>
                        <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Paid</span>
                      </div>
                      <p className="text-xs text-white/40 mt-1">Ali Ahmed — PKR 3,450</p>
                    </div>
                  </div>
                </div>

                {/* Loan card */}
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/[0.07] transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white text-sm">Loan Record</p>
                        <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">Pending</span>
                      </div>
                      <p className="text-xs text-white/40 mt-1">Mehmood Bhai — PKR 12,800 outstanding</p>
                    </div>
                  </div>
                </div>

                {/* Revenue card */}
                <div className="bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 rounded-2xl p-5 backdrop-blur-sm ml-8 hover:from-blue-600/30 hover:to-violet-600/30 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <p className="font-semibold text-white text-sm">Today's Earnings</p>
                  </div>
                  <p className="text-3xl font-black text-white">PKR 24,350</p>
                  <p className="text-xs text-emerald-400 mt-1">↑ 18% more than yesterday</p>
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl overflow-hidden border border-white/10">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-violet-600/10 to-emerald-600/20" />
            <div className="absolute inset-0 backdrop-blur-sm" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                Start Today
              </h2>
              <p className="text-white/50 text-lg mb-8">
                Make your shop digital and take your business forward — absolutely free!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  id="cta-signup-btn"
                  onClick={() => navigate('/signup')}
                  className="group flex items-center gap-2 px-8 py-4 text-base font-bold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-2xl transition-all duration-300 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 w-full sm:w-auto justify-center"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  id="cta-login-btn"
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 text-base font-medium text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded-2xl transition-all duration-300 hover:bg-white/5 w-full sm:w-auto"
                >
                  Already have an account? Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/60">SHS Shop Flow</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/30">
            <Globe className="w-4 h-4" />
            <span>Made with ❤️ for Pakistani Shopkeepers</span>
          </div>
          <p className="text-xs text-white/20">© 2024 SHS Shop Flow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
