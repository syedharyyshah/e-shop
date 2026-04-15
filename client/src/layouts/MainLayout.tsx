import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const { sidebarOpen } = useStore();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-[70px]'
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
