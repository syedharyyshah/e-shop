import { Bell, User, Menu, LogOut, Settings, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { userApi } from '@/services/userApi';

interface UserData {
  name: string;
  email: string;
  role: string;
  shopName: string;
}

export function Navbar() {
  const { toggleSidebar } = useStore();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData>({ name: '', email: '', role: 'user', shopName: '' });

  useEffect(() => {
    // Get user data from localStorage
    const name = localStorage.getItem('userName') || localStorage.getItem('adminEmail') || 'User';
    const email = localStorage.getItem('userEmail') || localStorage.getItem('adminEmail') || '';
    const role = localStorage.getItem('adminToken') ? 'admin' : 'user';
    const shopName = localStorage.getItem('shopName') || '';
    setUserData({ name, email, role, shopName });

    // Fetch shop name from backend if userId exists
    const userId = localStorage.getItem('userId');
    if (userId) {
      userApi.getCurrentUser(userId)
        .then((user) => {
          setUserData(prev => ({ ...prev, shopName: user.shopName }));
          localStorage.setItem('shopName', user.shopName);
        })
        .catch(() => {
          // Silently fail, use localStorage value
        });
    }
  }, []);

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Shop Name - Center */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
          <Store className="h-4 w-4 text-primary" />
          <span className="font-semibold text-primary hidden sm:inline">{userData.shopName || 'My Shop'}</span>
          <span className="font-semibold text-primary sm:hidden">{userData.shopName ? userData.shopName.substring(0, 15) : 'Shop'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {getInitials(userData.name)}
              </div>
              <span className="hidden md:inline text-sm font-medium">{userData.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
