import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  Store,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Products', icon: Package, path: '/products' },
  { label: 'Orders', icon: ShoppingCart, path: '/orders' },
  { label: 'Customers', icon: Users, path: '/customers' },
  { label: 'Invoice Generator', icon: FileText, path: '/invoices' },
  { label: 'Loans', icon: Wallet, path: '/loans' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function AppSidebar() {
  const { sidebarOpen, toggleSidebar } = useStore();
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-[70px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex flex-col border-b border-sidebar-border',
        sidebarOpen ? 'h-16 px-4' : 'py-3 px-2'
      )}>
        {/* Logo Row */}
        <div className={cn(
          'flex items-center',
          sidebarOpen ? 'justify-between h-full' : 'flex-col gap-2'
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-md shadow-primary/30">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <span className="text-lg font-semibold tracking-tight">ShopFlow</span>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90 hover:shadow-lg transition-all duration-200',
              sidebarOpen ? 'h-8 w-8' : 'h-7 w-7'
            )}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ChevronLeft
              className={cn('transition-transform duration-200', sidebarOpen ? 'h-4 w-4' : 'h-4 w-4 rotate-180')}
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
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-muted">© 2024 ShopFlow</p>
        </div>
      )}
    </aside>
  );
}
