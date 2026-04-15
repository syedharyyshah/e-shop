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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">E-Shop</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Login to your account.</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">User Login</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Button variant="link" className="p-0 text-sm" onClick={() => toast.info('Contact admin to reset password')}>
                  Forgot password?
                </Button>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Logging in...' : (
                  <>
                    Login
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">New user?</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={() => navigate('/signup')}
              >
                Create an Account
              </Button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium text-gray-700 mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-gray-600">
                <p>Email: user@example.com</p>
                <p>Password: user123</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: New accounts require admin approval before login.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Login Link */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          Are you an admin?{' '}
          <Button variant="link" className="p-0" onClick={() => navigate('/admin/login')}>
            Admin Login
          </Button>
        </p>
      </div>
    </div>
  );
}
