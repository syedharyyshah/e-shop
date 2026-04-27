import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  ChevronRight,
  Store,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Products', icon: Package, path: '/products' },
  { label: 'Orders', icon: ShoppingCart, path: '/orders' },
  { label: 'Loans', icon: Wallet, path: '/loans' },
  { label: 'Customers', icon: Users, path: '/customers' },
  { label: 'Invoice Generator', icon: FileText, path: '/invoices' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function AppSidebar() {
  const { sidebarOpen, setSidebarOpen } = useStore();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  
  // Use hover state to control sidebar, fallback to store state
  const isExpanded = isHovered || sidebarOpen;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out flex flex-col group',
        isExpanded ? 'w-64' : 'w-[70px]'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={cn(
        'flex flex-col border-b border-sidebar-border',
        sidebarOpen ? 'h-16 px-4' : 'py-3 px-2'
      )}>
        {/* Logo Row */}
        <div className={cn(
          'flex items-center',
          isExpanded ? 'justify-between h-full' : 'flex-col gap-2'
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-md shadow-primary/30">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            {isExpanded && (
              <span className="text-lg font-semibold tracking-tight whitespace-nowrap overflow-hidden">ShopFlow</span>
            )}
          </div>

          {/* Pin/Unpin Toggle Button - shows on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
            className={cn(
              'flex items-center justify-center rounded-lg bg-primary/80 text-primary-foreground hover:bg-primary hover:shadow-lg transition-all duration-200',
              isExpanded ? 'h-7 w-7 opacity-100' : 'h-6 w-6 opacity-0 group-hover:opacity-100'
            )}
            title={sidebarOpen ? 'Unpin sidebar' : 'Pin sidebar open'}
          >
            <ChevronRight
              className={cn(
                'transition-transform duration-200',
                sidebarOpen ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 rotate-180'
              )}
            />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
              title={!isExpanded ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {isExpanded && (
                <span className="whitespace-nowrap overflow-hidden transition-all duration-300">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {isExpanded && (
        <div className="border-t border-sidebar-border p-4 whitespace-nowrap overflow-hidden transition-all duration-300">
          <p className="text-xs text-sidebar-muted">© 2024 ShopFlow</p>
        </div>
      )}
    </aside>
  );
}
