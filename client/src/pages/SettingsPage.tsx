import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Store, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UserData {
  name: string;
  email: string;
  role: string;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { lowStockThreshold, highStockThreshold, setLowStockThreshold, setHighStockThreshold } = useStore();
  const [userData, setUserData] = useState<UserData>({ name: '', email: '', role: 'user' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const name = localStorage.getItem('userName') || localStorage.getItem('adminEmail') || 'User';
    const email = localStorage.getItem('userEmail') || localStorage.getItem('adminEmail') || '';
    const role = localStorage.getItem('adminToken') ? 'admin' : 'user';
    setUserData({ name, email, role });
    
    // Fetch user settings from server
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setLowStockThreshold(data.settings.lowStockThreshold || 20);
          setHighStockThreshold(data.settings.highStockThreshold || 200);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('User not logged in');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lowStockThreshold,
          highStockThreshold
        })
      });

      if (res.ok) {
        toast.success('Settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-2xl space-y-6">
        <Card className="border-none shadow-sm border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Access the admin dashboard to manage users, view analytics, and configure advanced settings.
            </p>
            <Button onClick={() => navigate('/admin/login')} className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Login as Admin
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-medium">
                {userData.name ? userData.name.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="font-medium text-lg">{userData.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{userData.role}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{userData.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">ShopFlow Store</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle className="text-lg">Store Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Store Name</Label><Input defaultValue="ShopFlow Store" className="mt-1" /></div>
            <div><Label>Store Email</Label><Input defaultValue="admin@shopflow.com" className="mt-1" /></div>
            <div><Label>Currency</Label><Input defaultValue="USD ($)" className="mt-1" /></div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Save className="w-5 h-5" />
              Stock Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Configure when products are flagged as Low Stock or High Stock on the Products page.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  min={1}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Math.max(1, Number(e.target.value)))}
                  className="mt-1"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">Products with stock ≤ this value are "Low Stock"</p>
              </div>
              <div>
                <Label>High Stock Threshold</Label>
                <Input
                  type="number"
                  min={1}
                  value={highStockThreshold}
                  onChange={(e) => setHighStockThreshold(Math.max(1, Number(e.target.value)))}
                  className="mt-1"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">Products with stock ≥ this value are "High Stock"</p>
              </div>
            </div>
            <Button 
              onClick={saveSettings} 
              disabled={saving || loading}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Thresholds'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle className="text-lg">Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Email notifications</p><p className="text-xs text-muted-foreground">Receive order alerts via email</p></div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Low stock alerts</p><p className="text-xs text-muted-foreground">Get notified when stock is below threshold</p></div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Marketing emails</p><p className="text-xs text-muted-foreground">Receive tips and product updates</p></div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
