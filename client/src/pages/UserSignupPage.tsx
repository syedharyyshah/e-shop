import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Store, Phone, MapPin, Calendar, CreditCard, User } from 'lucide-react';
import { toast } from 'sonner';

export default function UserSignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    idCardNumber: '',
    birthday: '',
    gender: '',
    phoneNumber: '',
    address: '',
    shopName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    const adminToken = localStorage.getItem('adminToken');
    if (userToken || adminToken) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    // Pakistani ID card validation (13 digits)
    const idCardRegex = /^\d{13}$/;
    if (!idCardRegex.test(formData.idCardNumber)) {
      toast.error('ID Card number must be 13 digits (Pakistani CNIC)');
      return false;
    }

    // Phone number validation (Pakistani format)
    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.error('Phone number must start with 03 and be 11 digits (e.g., 03001234567)');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          idCardNumber: formData.idCardNumber,
          birthday: formData.birthday,
          gender: formData.gender,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          shopName: formData.shopName
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      toast.success('Account created successfully! Please wait for admin approval.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden py-10">
      {/* Background Image with blur & overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[2px] scale-105"
        style={{ backgroundImage: 'url("/bg-shop.png")' }}
      />
      <div className="absolute inset-0 z-0 bg-slate-900/70 backdrop-blur-sm" />

      <div className="w-full max-w-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <Card className="shadow-2xl border border-white/20 bg-white/10 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="text-center space-y-2 pb-6 pt-8 px-8">
            <div className="mx-auto w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center mb-4 shadow-2xl border border-white/20 hover:scale-105 transition-transform duration-300">
              <UserPlus className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <CardTitle className="text-3xl font-black text-white tracking-tight drop-shadow-md">Create Your Account</CardTitle>
            <CardDescription className="text-white/70 font-medium">
              Fill in your details to register. Your account will be reviewed by admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-white border-b border-white/10 pb-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white/90 font-semibold ml-1">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="h-12 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/20 rounded-xl transition-all shadow-inner"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idCardNumber" className="flex items-center gap-1 text-white/90 font-semibold ml-1">
                      <CreditCard className="w-4 h-4 text-white/60" />
                      ID Card Number (CNIC) *
                    </Label>
                    <Input
                      id="idCardNumber"
                      placeholder="13 digit CNIC (e.g., 3520112345678)"
                      value={formData.idCardNumber}
                      onChange={(e) => handleChange('idCardNumber', e.target.value.replace(/\D/g, '').slice(0, 13))}
                      maxLength={13}
                      className="h-12 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/20 rounded-xl transition-all shadow-inner"
                      required
                    />
                    <p className="text-[10px] text-white/50 ml-1">Enter 13 digit Pakistani CNIC number without dashes</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthday" className="flex items-center gap-1 text-white/90 font-semibold ml-1">
                      <Calendar className="w-4 h-4 text-white/60" />
                      Date of Birth *
                    </Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => handleChange('birthday', e.target.value)}
                      className="h-12 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/20 rounded-xl transition-all shadow-inner"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-white/90 font-semibold ml-1">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                      <SelectTrigger className="h-12 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/20 rounded-xl transition-all shadow-inner">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10 text-white">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-lg flex items-center gap-2 text-white border-b border-white/10 pb-2">
                  <Phone className="w-5 h-5 text-blue-400" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-white/90 font-semibold ml-1">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="03XXXXXXXXX"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 11))}
                      maxLength={11}
                      className="h-12 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/20 rounded-xl transition-all shadow-inner"
                      required
                    />
                    <p className="text-[10px] text-white/50 ml-1">Format: 03XXXXXXXXX (11 digits)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/90 font-semibold ml-1">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="h-12 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/20 rounded-xl transition-all shadow-inner"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address" className="flex items-center gap-1 text-white/90 font-semibold ml-1">
                      <MapPin className="w-4 h-4 text-white/60" />
                      Complete Address *
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="House #, Street, Area, City, Province"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="min-h-[80px] bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/20 rounded-xl transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shop Information */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-lg flex items-center gap-2 text-white border-b border-white/10 pb-2">
                  <Store className="w-5 h-5 text-orange-400" />
                  Shop Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="shopName" className="text-white/90 font-semibold ml-1">Name of Your Shop *</Label>
                  <Input
                    id="shopName"
                    placeholder="Enter your shop/business name"
                    value={formData.shopName}
                    onChange={(e) => handleChange('shopName', e.target.value)}
                    className="h-12 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/20 rounded-xl transition-all shadow-inner"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-lg flex items-center gap-2 text-white border-b border-white/10 pb-2">
                  <span className="text-xl">🔐</span> Security
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/90 font-semibold ml-1">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      minLength={6}
                      className="h-12 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/20 rounded-xl transition-all shadow-inner"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white/90 font-semibold ml-1">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className="h-12 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/20 rounded-xl transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-14 rounded-xl bg-white text-slate-900 hover:bg-white/90 font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 hover:-translate-y-1" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 text-center">
                <p className="text-sm text-white/70 font-medium">
                  Already have an account?{' '}
                  <Button variant="link" className="p-0 text-white hover:text-primary-300 font-bold ml-1 hover:underline underline-offset-4" onClick={() => navigate('/login')}>
                    Login here
                  </Button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
