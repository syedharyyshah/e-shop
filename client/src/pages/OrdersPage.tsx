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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Loader2, Trash2, AlertTriangle, X, Package, User, MapPin, Phone, Calendar, CreditCard, FileText, FileSpreadsheet, Download } from 'lucide-react';
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);

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

  const handleDeleteClick = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
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

  const downloadOrderExcel = (order: Order) => {
    const formatExcelDate = (dateString?: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const today = new Date().toLocaleDateString('en-GB');

    const styles = `
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
        th { background-color: #F4B084; color: #000000; font-weight: bold; text-align: left; padding: 8px; border: 1px solid #D9D9D9; }
        td { padding: 6px 8px; border: 1px solid #D9D9D9; text-align: left; }
        tr:nth-child(even) { background-color: #FCE4D6; }
        tr:nth-child(odd) { background-color: #FFFFFF; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .header-row { background-color: #F4B084 !important; }
        .report-title { font-size: 16pt; font-weight: bold; margin-bottom: 5px; color: #C65911; }
        .customer-info { background-color: #FFF2CC; padding: 10px; margin: 10px 0; border-left: 4px solid #F4B084; }
        .amount-box { background-color: #E2EFDA; padding: 8px; text-align: center; font-weight: bold; }
        .status-completed { color: #00B050; font-weight: bold; }
        .status-pending { color: #FF0000; font-weight: bold; }
        .status-cancelled { color: #FF0000; font-weight: bold; }
        .price-highlight { color: #C65911; font-weight: bold; }
      </style>
    `;

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        ${styles}
      </head>
      <body>
        <div class="report-title">Order Receipt - #${order._id.slice(-6)}</div>
        <div style="font-size: 10pt; color: #666;">Generated on: ${today}</div>
        
        <div class="customer-info">
          <table style="width: 100%; border: none;">
            <tr>
              <td style="border: none; width: 50%;"><b>Customer Name:</b> ${order.customerName}</td>
              <td style="border: none; width: 50%;"><b>Phone:</b> ${order.customerPhone || '-'}</td>
            </tr>
            <tr>
              <td style="border: none;" colspan="2"><b>Address:</b> ${order.customerAddress || '-'}</td>
            </tr>
          </table>
        </div>

        <table>
          <thead>
            <tr class="header-row">
              <th>S.No</th>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Unit Price (Rs.)</th>
              <th>Total (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.productName}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-center capitalize">${item.unitType}</td>
                <td class="text-right">${item.unitPrice.toFixed(2)}</td>
                <td class="text-right price-highlight">${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table style="margin-top: 15px; width: 60%; margin-left: auto;">
          <tr>
            <td style="text-align: right; font-weight: bold;">Subtotal:</td>
            <td style="text-align: right; font-weight: bold;">Rs. ${order.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: bold;">Tax (${order.taxRate}%):</td>
            <td style="text-align: right;">Rs. ${order.tax.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: bold;">Total Amount:</td>
            <td style="text-align: right; font-weight: bold; color: #C65911;">Rs. ${order.total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: bold;">Payment Method:</td>
            <td style="text-align: right; text-transform: capitalize;">${order.paymentMethod}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: bold;">Order Status:</td>
            <td style="text-align: right;" class="${order.status === 'completed' ? 'status-completed' : 'status-pending'}">${order.status}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: bold;">Order Date:</td>
            <td style="text-align: right;">${formatExcelDate(order.createdAt)}</td>
          </tr>
        </table>

        ${order.notes ? `
        <div style="margin-top: 20px; padding: 10px; background-color: #F2F2F2; border-left: 3px solid #C65911;">
          <b>Notes:</b><br>
          ${order.notes}
        </div>
        ` : ''}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Order_${order._id.slice(-6)}_${order.customerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: `Order #${order._id.slice(-6)} downloaded as Excel`,
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
                      <tr 
                        key={order._id} 
                        className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleOrderClick(order)}
                      >
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
                            onClick={(e) => handleDeleteClick(order._id, e)}
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

        {/* Order Details Dialog */}
        <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Package className="h-5 w-5 text-primary" />
                Order Details
              </DialogTitle>
              {selectedOrder && (
                <Button
                  className="bg-[#217346] hover:bg-[#1a5c38] text-white border-0 shrink-0"
                  onClick={() => downloadOrderExcel(selectedOrder)}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Download Excel
                </Button>
              )}
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono font-medium">#{selectedOrder._id.slice(-6)}</p>
                  </div>
                  <Badge
                    variant={selectedOrder.status === 'completed' ? 'default' : selectedOrder.status === 'pending' ? 'secondary' : 'destructive'}
                    className="capitalize text-sm px-3 py-1"
                  >
                    {selectedOrder.status}
                  </Badge>
                </div>

                {/* Customer Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{selectedOrder.customerPhone || '-'}</span>
                    </div>
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium">{selectedOrder.customerAddress || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Order Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Payment:</span>
                      <span className="font-medium capitalize">{selectedOrder.paymentMethod}</span>
                    </div>
                    {selectedOrder.notes && (
                      <div className="sm:col-span-2 p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground text-xs">Notes:</span>
                        <p className="text-sm mt-1">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Order Items ({selectedOrder.items.length})</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium">Product</th>
                          <th className="text-center py-2 px-3 font-medium">Qty</th>
                          <th className="text-center py-2 px-3 font-medium">Unit</th>
                          <th className="text-right py-2 px-3 font-medium">Price</th>
                          <th className="text-right py-2 px-3 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="py-2 px-3">{item.productName}</td>
                            <td className="py-2 px-3 text-center">{item.quantity}</td>
                            <td className="py-2 px-3 text-center capitalize">{item.unitType}</td>
                            <td className="py-2 px-3 text-right">Rs. {item.unitPrice.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-medium">Rs. {item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>Rs. {selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({selectedOrder.taxRate}%):</span>
                    <span>Rs. {selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-primary">Rs. {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
