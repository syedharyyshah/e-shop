import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { orderApi } from '@/services/orderApi';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/types/order';

export default function OrdersPage() {
  const { toast } = useToast();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getOrders({ search, limit: 100 });
      if (response.success) {
        setOrders(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search]);

  // Refresh orders when navigating from Invoice page after creating an order
  useEffect(() => {
    const navState = location.state as { orderCreated?: boolean } | null;
    if (navState?.orderCreated) {
      fetchOrders();
      toast({
        title: 'Order Created',
        description: 'New order has been added successfully.',
      });
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredOrders = orders.filter(
    (o) =>
      o._id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.toLowerCase().includes(search.toLowerCase())
  );

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o._id)));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setOrderToDelete(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (orderToDelete) {
        // Single delete
        const response = await orderApi.deleteOrder(orderToDelete);
        if (response.success) {
          toast({ title: 'Success', description: 'Order deleted successfully' });
          setOrders(orders.filter(o => o._id !== orderToDelete));
          setSelectedOrders(prev => {
            const newSet = new Set(prev);
            newSet.delete(orderToDelete);
            return newSet;
          });
        }
      } else {
        // Bulk delete
        const deletePromises = Array.from(selectedOrders).map(id => orderApi.deleteOrder(id));
        const results = await Promise.all(deletePromises);
        const allSuccess = results.every(r => r.success);
        
        if (allSuccess) {
          toast({ title: 'Success', description: `${selectedOrders.size} orders deleted successfully` });
          setOrders(orders.filter(o => !selectedOrders.has(o._id)));
          setSelectedOrders(new Set());
        } else {
          toast({ title: 'Warning', description: 'Some orders could not be deleted', variant: 'destructive' });
          fetchOrders();
          setSelectedOrders(new Set());
        }
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete order(s)', 
        variant: 'destructive' 
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Navbar />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative w-full sm:w-96">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/10 p-1.5 rounded-md">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <Input
              placeholder="Search orders by ID, customer name or phone..."
              className="pl-12 pr-4 py-2.5 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md focus:shadow-md transition-all duration-200 placeholder:text-slate-400 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={fetchOrders} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
          
          {/* Bulk Delete Button */}
          {selectedOrders.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDeleteClick}
              disabled={isDeleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedOrders.size})
            </Button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-3 px-4 w-10">
                      <Checkbox 
                        checked={filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all orders"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium">Customer</th>
                    <th className="text-left py-3 px-4 font-medium">Items</th>
                    <th className="text-left py-3 px-4 font-medium">Total</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-center py-3 px-4 font-medium w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="text-muted-foreground mt-2">Loading orders...</p>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No orders found. Create your first order from the Invoice page.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <Checkbox 
                            checked={selectedOrders.has(order._id)}
                            onCheckedChange={() => toggleSelectOrder(order._id)}
                            aria-label={`Select order ${order._id.slice(-6)}`}
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">#{order._id.slice(-6)}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{order.customerAddress}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{order.items.length} item(s)</td>
                        <td className="py-3 px-4 font-medium">Rs. {order.total.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}
                            className="capitalize"
                          >
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(order.createdAt)}</td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(order._id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {orderToDelete ? 'Delete Order' : `Delete ${selectedOrders.size} Orders`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {orderToDelete 
                  ? 'Are you sure you want to delete this order? This action cannot be undone.'
                  : `Are you sure you want to delete ${selectedOrders.size} selected orders? This action cannot be undone.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setOrderToDelete(null); }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
