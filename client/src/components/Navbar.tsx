import { User, Menu, LogOut, Settings, Store } from 'lucide-react';
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
import { NotificationCenter } from '@/components/NotificationCenter';

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
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/50 bg-background/60 backdrop-blur-xl px-8 transition-all duration-300">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:bg-primary/10 transition-colors"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Shop Name - Center */}
      <div className="absolute left-1/2 transform -translate-x-1/2 group cursor-default">
        <div className="flex items-center gap-3 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-6 py-2.5 rounded-full border border-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.05)] group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)] transition-all duration-500">
          <div className="bg-primary/20 p-1 rounded-full group-hover:rotate-12 transition-transform duration-500">
            <Store className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-primary hidden sm:inline text-lg uppercase">{userData.shopName || 'My Shop'}</span>
          <span className="font-bold tracking-tight text-primary sm:hidden uppercase">{userData.shopName ? userData.shopName.substring(0, 12) : 'Shop'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center">
          <NotificationCenter />
        </div>
        
        <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-3 py-1.5 h-auto hover:bg-primary/5 rounded-xl transition-all duration-300">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-600 text-primary-foreground text-sm font-bold shadow-lg ring-2 ring-background ring-offset-2 ring-offset-primary/10">
                  {getInitials(userData.name)}
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-success shadow-sm"></div>
              </div>
              <div className="hidden md:flex flex-col items-start gap-0.5">
                <span className="text-sm font-bold leading-none text-foreground">{userData.name}</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{userData.role}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-border/50 backdrop-blur-xl">
            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-border/50" />
            <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-lg px-3 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors">
              <User className="mr-2 h-4 w-4" /> 
              <span className="font-medium">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-lg px-3 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors">
              <Settings className="mr-2 h-4 w-4" /> 
              <span className="font-medium">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-border/50" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg px-3 py-2 cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground transition-colors">
              <LogOut className="mr-2 h-4 w-4" /> 
              <span className="font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
