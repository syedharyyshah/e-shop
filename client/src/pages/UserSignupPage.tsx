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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
          <CardDescription>
            Fill in your details to register. Your account will be reviewed by admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                <User className="w-5 h-5" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idCardNumber" className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    ID Card Number (CNIC) *
                  </Label>
                  <Input
                    id="idCardNumber"
                    placeholder="13 digit CNIC (e.g., 3520112345678)"
                    value={formData.idCardNumber}
                    onChange={(e) => handleChange('idCardNumber', e.target.value.replace(/\D/g, '').slice(0, 13))}
                    maxLength={13}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Enter 13 digit Pakistani CNIC number without dashes</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday" className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Date of Birth *
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => handleChange('birthday', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                <Phone className="w-5 h-5" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="03XXXXXXXXX"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 11))}
                    maxLength={11}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Format: 03XXXXXXXXX (11 digits)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Complete Address *
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="House #, Street, Area, City, Province"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Shop Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                <Store className="w-5 h-5" />
                Shop Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="shopName">Name of Your Shop *</Label>
                <Input
                  id="shopName"
                  placeholder="Enter your shop/business name"
                  value={formData.shopName}
                  onChange={(e) => handleChange('shopName', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                🔐 Security
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    minLength={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
                Login here
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
