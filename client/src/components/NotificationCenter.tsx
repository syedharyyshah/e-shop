import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Bell, 
  Package, 
  PackageX, 
  Wallet, 
  FileText, 
  RotateCcw, 
  ShoppingCart,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  CheckCircle2,
  Trash2,
  MoreHorizontal,
  Eye,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { notificationApi, Notification, NotificationType } from '@/services/notificationApi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NotificationCenterProps {
  trigger?: React.ReactNode;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'OUT_OF_STOCK':
      return <PackageX className="h-5 w-5" />;
    case 'LOW_STOCK':
      return <Package className="h-5 w-5" />;
    case 'HIGH_STOCK':
      return <Package className="h-5 w-5" />;
    case 'LOAN_OVERDUE':
      return <Wallet className="h-5 w-5" />;
    case 'INVOICE_LOAN_OVERDUE':
      return <FileText className="h-5 w-5" />;
    case 'PENDING_RETURN':
      return <RotateCcw className="h-5 w-5" />;
    case 'PENDING_ORDER':
      return <ShoppingCart className="h-5 w-5" />;
    case 'PARTIAL_PAYMENT':
      return <Wallet className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getIconColors = (priority: string, type: string) => {
  if (priority === 'urgent') return "bg-red-500/10 text-red-600 border-red-200";
  if (priority === 'high') return "bg-orange-500/10 text-orange-600 border-orange-200";
  
  switch (type) {
    case 'OUT_OF_STOCK': return "bg-red-500/10 text-red-600 border-red-200";
    case 'LOW_STOCK': return "bg-orange-500/10 text-orange-600 border-orange-200";
    case 'LOAN_OVERDUE': return "bg-amber-500/10 text-amber-600 border-amber-200";
    case 'PENDING_ORDER': return "bg-blue-500/10 text-blue-600 border-blue-200";
    case 'PENDING_RETURN': return "bg-purple-500/10 text-purple-600 border-purple-200";
    default: return "bg-slate-500/10 text-slate-600 border-slate-200";
  }
};

const getNotificationLink = (notification: Notification): string => {
  const entityName = encodeURIComponent(notification.relatedEntity?.name || '');
  switch (notification.relatedEntity?.type) {
    case 'Product': return `/products?q=${entityName}`;
    case 'Loan': return `/loans?tab=regular&q=${entityName}`;
    case 'InvoiceLoan': return `/loans?tab=invoice&q=${entityName}`;
    case 'Return': return `/orders?q=${notification.relatedEntity?.id || ''}`;
    case 'Order': return `/orders?q=${notification.relatedEntity?.id || ''}`;
    default: return '/';
  }
};

export function NotificationCenter({ trigger }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const { data, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
    refetchInterval: 300000,
    retry: 1,
  });

  const allNotifications = data?.notifications || [];
  const summary = data?.summary || { totalActive: 0, totalUnread: 0, byType: {} };

  const filteredNotifications = activeTab === 'all' 
    ? allNotifications 
    : allNotifications.filter(n => {
        if (activeTab === 'unread') return !n.isRead;
        if (activeTab === 'urgent') return n.priority === 'urgent' || n.priority === 'high';
        return true;
      });

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      refetch();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      refetch();
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    setOpen(false);
    navigate(getNotificationLink(notification));
  };

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(id);
      refetch();
      toast.success('Removed');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const unreadCount = summary.totalUnread;
  const hasUrgent = allNotifications.some(n => n.priority === 'urgent' && !n.isRead);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ? (
          <div className="cursor-pointer">{trigger}</div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-10 w-10 rounded-full hover:bg-muted transition-all duration-300"
          >
            <Bell className={cn("h-5 w-5 transition-transform duration-300", open && "scale-110 text-primary")} />
            {unreadCount > 0 && (
              <span className={cn(
                "absolute right-1.5 top-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full border-2 border-background px-1 text-[10px] font-bold text-white shadow-sm transition-all duration-300",
                hasUrgent ? "bg-red-500 animate-pulse" : "bg-primary"
              )}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-[420px] p-0 overflow-hidden shadow-2xl border-border/50 rounded-2xl" align="end" sideOffset={8}>
        <div className="bg-background/95 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Notifications</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                You have {unreadCount} unread messages
              </p>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border/40">
                  <DropdownMenuItem onClick={handleMarkAllAsRead} className="cursor-pointer">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => refetch()} className="cursor-pointer">
                    <RotateCcw className="mr-2 h-4 w-4" /> Refresh
                  </DropdownMenuItem>
                  <Separator className="my-1" />
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" /> Notification settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4 mb-2">
              <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-lg h-9">
                <TabsTrigger value="all" className="rounded-md text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">All</TabsTrigger>
                <TabsTrigger value="unread" className="rounded-md text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Unread</TabsTrigger>
                <TabsTrigger value="urgent" className="rounded-md text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-red-500">Urgent</TabsTrigger>
              </TabsList>
            </div>

            <Separator className="opacity-50" />

            <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
              <ScrollArea className="h-[480px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-[300px] gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Loading notifications...</p>
                  </div>
                ) : isError ? (
                  <div className="flex flex-col items-center justify-center h-[350px] p-8 text-center">
                    <div className="bg-red-500/10 rounded-full p-6 mb-4">
                      <AlertTriangle className="h-10 w-10 text-red-500" />
                    </div>
                    <h4 className="text-base font-semibold">Connection Error</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(error as Error)?.message || 'Could not load notifications.'}
                    </p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[350px] p-8 text-center animate-in fade-in zoom-in duration-300">
                    <div className="bg-muted/50 rounded-full p-6 mb-4 ring-8 ring-muted/20">
                      <Bell className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <h4 className="text-base font-semibold">No notifications yet</h4>
                    <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                      When you have alerts, they will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "group flex items-start gap-4 p-4 hover:bg-muted/40 transition-all duration-200 cursor-pointer relative border-l-[3px] border-transparent",
                          !notification.isRead && "bg-primary/5 border-l-primary",
                          notification.priority === 'urgent' && "bg-red-500/5"
                        )}
                      >
                        <div 
                          className={cn(
                            "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border transition-transform duration-300 group-hover:scale-105",
                            getIconColors(notification.priority, notification.type)
                          )}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={cn(
                              "text-[14px] font-bold truncate leading-tight transition-colors",
                              !notification.isRead ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {notification.title}
                            </h4>
                            <span className="text-[11px] font-medium text-muted-foreground/60">
                              {new Date(notification.createdAt).toLocaleDateString('en-PK', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                          
                          <p className={cn(
                            "text-[13px] line-clamp-2 leading-snug tracking-tight",
                            !notification.isRead ? "text-foreground/90 font-medium" : "text-muted-foreground/80"
                          )}>
                            {notification.message}
                          </p>
                          
                          {!notification.isRead && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <div className="h-2.5 w-2.5 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2.5">
                            <Badge variant="outline" className="bg-background/50 text-[10px] h-4.5 px-2 font-semibold tracking-wider opacity-80 uppercase border-border/60">
                              {notification.type.replace('_', ' ')}
                            </Badge>
                            {notification.relatedEntity?.name && (
                              <span className="text-[11px] text-muted-foreground/50 truncate max-w-[120px]">
                                • {notification.relatedEntity.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                            onClick={(e) => handleDismiss(e, notification._id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="p-3 bg-muted/20 border-t border-border/40 text-center">
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs font-semibold text-primary hover:no-underline"
              onClick={() => {
                setOpen(false);
                navigate('/settings');
              }}
            >
              See all notifications in settings
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationCenter;
