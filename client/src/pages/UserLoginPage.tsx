import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Mail, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';

export default function UserLoginPage() {
  const navigate = useNavigate();
  const { setLowStockThreshold, setHighStockThreshold } = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    const adminToken = localStorage.getItem('adminToken');
    if (userToken || adminToken) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.status === 'pending') {
          toast.error('Your account is pending admin approval. Please wait.');
        } else {
          toast.error(data.message || 'Login failed');
        }
        setLoading(false);
        return;
      }

      toast.success('Login successful!');
      localStorage.setItem('userToken', 'user-token-' + Date.now());
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userId', data._id);
      
      // Fetch user settings
      try {
        const settingsRes = await fetch(`/api/users/${data._id}/settings`);
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.settings) {
            setLowStockThreshold(settingsData.settings.lowStockThreshold || 20);
            setHighStockThreshold(settingsData.settings.highStockThreshold || 200);
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
      
      navigate('/');
    } catch (err) {
      toast.error('Login failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with blur & overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[2px] scale-105"
        style={{ backgroundImage: 'url("/bg-shop.png")' }}
      />
      <div className="absolute inset-0 z-0 bg-slate-900/60 backdrop-blur-sm" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl border border-white/20 hover:scale-105 transition-transform duration-300">
            <User className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">E-Shop</h1>
          <p className="text-white/80 mt-2 font-medium">Welcome back! Login to your account.</p>
        </div>

        <Card className="shadow-2xl border border-white/20 bg-white/10 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="space-y-1 pb-6 pt-8 px-8">
            <CardTitle className="text-2xl font-bold text-white">User Login</CardTitle>
            <CardDescription className="text-white/70">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90 font-semibold ml-1">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-white/50 group-focus-within:text-white transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-12 h-12 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/20 rounded-xl transition-all shadow-inner"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90 font-semibold ml-1">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-white/50 group-focus-within:text-white transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-12 h-12 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/20 rounded-xl transition-all shadow-inner"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-sm cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-white/30 rounded-md bg-white/5 checked:bg-primary checked:border-primary transition-all" />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/80 group-hover:text-white transition-colors">Remember me</span>
                </label>
                <Button variant="link" className="p-0 text-sm text-white/70 hover:text-white font-medium" onClick={() => toast.info('Contact admin to reset password')} type="button">
                  Forgot password?
                </Button>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl bg-white text-slate-900 hover:bg-white/90 font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 hover:-translate-y-1" disabled={loading}>
                {loading ? 'Logging in...' : (
                  <>
                    Login
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                  <span className="bg-transparent px-4 text-white/50">New user?</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-6 h-12 rounded-xl bg-black/20 border-white/20 text-white hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold" 
                onClick={() => navigate('/signup')}
              >
                Create an Account
              </Button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-8 p-5 bg-black/20 border border-white/10 rounded-xl backdrop-blur-md text-sm text-white/80 shadow-inner">
              <p className="font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Demo Credentials:
              </p>
              <div className="space-y-1.5 font-medium">
                <p>Email: <span className="text-emerald-300">user@example.com</span></p>
                <p>Password: <span className="text-emerald-300">user123</span></p>
              </div>
              <p className="text-xs text-white/50 mt-3 font-medium">
                Note: New accounts require admin approval before login.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Login Link */}
        <p className="text-center mt-8 text-sm text-white/70 font-medium">
          Are you an admin?{' '}
          <Button variant="link" className="p-0 text-white hover:text-primary-300 font-bold ml-1 hover:underline underline-offset-4" onClick={() => navigate('/admin/login')}>
            Admin Login
          </Button>
        </p>
        <p className="text-center mt-3 text-sm">
          <Button variant="link" className="p-0 text-white/50 hover:text-white/80 text-xs" onClick={() => navigate('/welcome')}>
            ← SHS Shop Flow Home
          </Button>
        </p>
      </div>
    </div>
  );
}
