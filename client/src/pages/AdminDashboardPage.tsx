import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Users, Package, ShoppingCart, DollarSign, LogOut, UserCheck, Clock, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState<string[]>([]);
  const prevCountRef = useRef(0);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Initial fetch
    fetchPendingCount();

    // Poll every 10 seconds for new user requests
    const interval = setInterval(() => {
      fetchPendingCount();
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchPendingCount = async () => {
    try {
      const res = await fetch('/api/users/pending');
      if (res.ok) {
        const pendingUsers = await res.json();
        const newCount = pendingUsers.length;
        
        // Check if new users signed up
        if (newCount > prevCountRef.current && prevCountRef.current !== 0) {
          const newUsersCount = newCount - prevCountRef.current;
          
          // Show toast notification
          toast.info(
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-500" />
              <span>New user registration request!</span>
            </div>,
            {
              description: `${newUsersCount} new ${newUsersCount === 1 ? 'user' : 'users'} waiting for approval`,
              action: {
                label: 'Review',
                onClick: () => navigate('/admin/users')
              },
              duration: 10000 // 10 seconds
            }
          );

          // Play notification sound (if browser allows)
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {
              // Browser blocked autoplay, ignore
            });
          } catch (e) {
            // Audio not supported, ignore
          }

          // Add to notifications list
          const newNotification = `New signup: ${pendingUsers[0]?.name || 'Unknown'} (${pendingUsers[0]?.shopName || 'No shop'})`;
          setNotifications(prev => [newNotification, ...prev].slice(0, 5));
        }

        prevCountRef.current = newCount;
        setPendingCount(newCount);
      }
    } catch (err) {
      console.error('Failed to fetch pending count:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const stats = [
    { title: 'Total Users', value: '1,234', icon: Users, change: '+12%' },
    { title: 'Products', value: '456', icon: Package, change: '+5%' },
    { title: 'Orders', value: '89', icon: ShoppingCart, change: '+23%' },
    { title: 'Revenue', value: '$12,450', icon: DollarSign, change: '+18%' },
  ];

  return (
    <>
      <Navbar />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Welcome, Admin!</h2>
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Button 
              variant="outline" 
              size="icon" 
              className="relative"
              onClick={() => navigate('/admin/users')}
            >
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Recent Notifications Panel */}
        {notifications.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-yellow-700">
                <Bell className="w-4 h-4" />
                Recent User Signups
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {notifications.map((notif, index) => (
                  <li key={index} className="text-sm text-yellow-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    {notif}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change} this month</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review and approve new user registrations. Users cannot access the app until approved.
            </p>
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/admin/users')} className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Manage Users
              </Button>
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span>{pendingCount} pending</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button onClick={() => navigate('/products')}>Manage Products</Button>
            <Button variant="outline" onClick={() => navigate('/orders')}>View Orders</Button>
            <Button variant="outline" onClick={() => navigate('/customers')}>Manage Customers</Button>
            <Button variant="outline" onClick={() => navigate('/settings')}>Settings</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
