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
        'flex flex-col border-b border-sidebar-border/30 transition-all duration-300',
        sidebarOpen ? 'h-20 px-4' : 'h-20 px-2'
      )}>
        {/* Logo Row */}
        <div className={cn(
          'flex items-center h-full',
          isExpanded ? 'justify-between' : 'justify-center'
        )}>
          <div className="flex items-center gap-3 group/logo">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/30 group-hover/logo:scale-110 transition-transform duration-300">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            {isExpanded && (
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tighter whitespace-nowrap overflow-hidden bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  SHS Shop Flow
                </span>
                <span className="text-[10px] font-medium text-sidebar-muted uppercase tracking-[0.2em] -mt-1">
                  Enterprise
                </span>
              </div>
            )}
          </div>

          {/* Pin/Unpin Toggle Button - shows on hover */}
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
              className="flex items-center justify-center rounded-lg bg-sidebar-accent/50 text-sidebar-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-lg transition-all duration-300 h-8 w-8"
              title={sidebarOpen ? 'Unpin sidebar' : 'Pin sidebar open'}
            >
              <ChevronRight
                className={cn(
                  'transition-transform duration-300 h-4 w-4',
                  sidebarOpen ? 'rotate-180' : ''
                )}
              />
            </button>
          )}
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
          <p className="text-xs text-sidebar-muted">© 2024 SHS Shop Flow</p>
        </div>
      )}
    </aside>
  );
}
