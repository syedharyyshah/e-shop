import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Search, Loader2, Trash2, AlertTriangle, X, Package, User, MapPin, Phone, Calendar, CreditCard, FileText, FileSpreadsheet, Download, RotateCcw, Undo2, Eye, Printer } from 'lucide-react';
import { orderApi } from '@/services/orderApi';
import { returnApi } from '@/services/returnApi';
import { useToast } from '@/hooks/use-toast';
import type { Order, OrderItem } from '@/types/order';
import type { Return, ReturnItem } from '@/types/return';

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

  // Return-related state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnItems, setReturnItems] = useState<{ orderItem: OrderItem; returnQuantity: number; returnReason: string }[]>([]);
  const [returnType, setReturnType] = useState<'partial' | 'full'>('partial');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'original_payment' | 'store_credit'>('cash');
  const [returnNotes, setReturnNotes] = useState('');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [orderReturns, setOrderReturns] = useState<Return[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returnsHistoryOpen, setReturnsHistoryOpen] = useState(false);
  const [invoiceViewOpen, setInvoiceViewOpen] = useState(false);

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

  // Return handling functions
  const handleReturnClick = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrder(order);
    
    // Initialize return items from order items
    const initialReturnItems = order.items.map(item => ({
      orderItem: item,
      returnQuantity: 0,
      returnReason: ''
    }));
    setReturnItems(initialReturnItems);
    setReturnType('partial');
    setRefundMethod('cash');
    setReturnNotes('');
    setReturnDialogOpen(true);
  };

  const handleFullReturnClick = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrder(order);
    
    // Initialize return items with full quantities
    const initialReturnItems = order.items.map(item => ({
      orderItem: item,
      returnQuantity: item.quantity,
      returnReason: 'Full order return'
    }));
    setReturnItems(initialReturnItems);
    setReturnType('full');
    setRefundMethod('cash');
    setReturnNotes('');
    setReturnDialogOpen(true);
  };

  const updateReturnQuantity = (index: number, quantity: number) => {
    setReturnItems(prev => prev.map((item, i) => 
      i === index ? { ...item, returnQuantity: Math.max(0, Math.min(quantity, item.orderItem.quantity)) } : item
    ));
  };

  const updateReturnReason = (index: number, reason: string) => {
    setReturnItems(prev => prev.map((item, i) => 
      i === index ? { ...item, returnReason: reason } : item
    ));
  };

  const calculateReturnTotal = () => {
    const subtotal = returnItems.reduce((sum, item) => {
      return sum + (item.returnQuantity * item.orderItem.unitPrice);
    }, 0);
    const taxRate = selectedOrder?.taxRate || 10;
    const tax = Math.round((subtotal * taxRate / 100) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    return { subtotal, tax, total };
  };

  const processReturn = async () => {
    if (!selectedOrder) return;

    // Filter out items with 0 return quantity
    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0);
    
    if (itemsToReturn.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one item to return',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingReturn(true);
    try {
      const returnData = {
        orderId: selectedOrder._id,
        items: itemsToReturn.map(item => ({
          productId: item.orderItem.productId,
          quantity: item.returnQuantity,
          unitType: item.orderItem.unitType,
          returnReason: item.returnReason
        })),
        returnType,
        refundMethod,
        notes: returnNotes,
        processedBy: localStorage.getItem('userName') || 'System'
      };

      const response = await returnApi.createReturn(returnData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `Return processed successfully. Return Number: ${response.data.returnNumber}`
        });
        
        // Refresh orders to get updated status
        fetchOrders();
        
        // Close dialog
        setReturnDialogOpen(false);
        setSelectedOrder(null);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process return',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const viewReturnsHistory = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setReturnsHistoryOpen(true);
    setReturnsLoading(true);
    
    try {
      const response = await returnApi.getOrderReturns(order._id);
      if (response.success) {
        setOrderReturns(response.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch returns history',
        variant: 'destructive'
      });
    } finally {
      setReturnsLoading(false);
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

        ${order.existingLoanId ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #FFF8E1; border: 2px solid #FF8F00; border-radius: 5px;">
          <div style="font-size: 12pt; font-weight: bold; color: #E65100; margin-bottom: 8px;">
            ⚠️ Added to Existing Loan
          </div>
          <div style="font-size: 10pt; color: #333;">
            <b>Original Borrower:</b> ${typeof order.existingLoanId === 'object' ? order.existingLoanId.customerName : 'N/A'}<br>
            <b>Loan ID:</b> ${typeof order.existingLoanId === 'string' ? order.existingLoanId.slice(-6) : order.existingLoanId._id.slice(-6)}<br>
            ${order.addedBy ? `<b>Items Added By:</b> ${order.addedBy}<br>` : ''}
            <b>Status:</b> This order was added to an existing customer's loan
          </div>
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
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">#{order._id.slice(-6)}</span>
                            {order.existingLoanId && (
                              <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
                                Existing Loan
                              </Badge>
                            )}
                          </div>
                        </td>
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
                            variant={
                              order.status === 'completed' ? 'default' : 
                              order.status === 'pending' ? 'secondary' : 
                              order.status === 'cancelled' ? 'destructive' :
                              order.status === 'returned' ? 'destructive' :
                              'outline'
                            }
                            className={`capitalize ${
                              order.status === 'returned' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                              order.status === 'partially_returned' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : ''
                            }`}
                          >
                            {order.status === 'partially_returned' ? 'Partially Returned' : order.status}
                          </Badge>
                          {order.returnStatus !== 'none' && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {order.returnStatus === 'full' ? 'Fully Returned' : 'Partially Returned'}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(order.createdAt)}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Return button - only show if not cancelled or fully returned */}
                            {order.status !== 'cancelled' && order.status !== 'returned' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={(e) => handleReturnClick(order, e)}
                                title="Return Items"
                              >
                                <Undo2 className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* View returns history - show if order has returns */}
                            {order.returnStatus !== 'none' && order.returns && order.returns.length > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={(e) => viewReturnsHistory(order, e)}
                                title="View Returns History"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Delete button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDeleteClick(order._id, e)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setInvoiceViewOpen(true)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Invoice
                  </Button>
                  <Button
                    className="bg-[#217346] hover:bg-[#1a5c38] text-white border-0 shrink-0"
                    onClick={() => downloadOrderExcel(selectedOrder)}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Download Excel
                  </Button>
                </div>
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
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        selectedOrder.status === 'completed' ? 'default' : 
                        selectedOrder.status === 'pending' ? 'secondary' : 
                        selectedOrder.status === 'cancelled' ? 'destructive' :
                        selectedOrder.status === 'returned' ? 'destructive' :
                        'outline'
                      }
                      className={`capitalize text-sm px-3 py-1 ${
                        selectedOrder.status === 'returned' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                        selectedOrder.status === 'partially_returned' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : ''
                      }`}
                    >
                      {selectedOrder.status === 'partially_returned' ? 'Partially Returned' : selectedOrder.status}
                    </Badge>
                    {selectedOrder.returnStatus !== 'none' && (
                      <span className="text-xs text-muted-foreground">
                        {selectedOrder.returnStatus === 'full' ? 'Fully Returned' : 'Partially Returned'}
                      </span>
                    )}
                  </div>
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
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-medium font-mono">#{selectedOrder._id.slice(-6)}</span>
                    </div>
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

                {/* Existing Loan Info */}
                {selectedOrder.existingLoanId && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-amber-600">
                      <CreditCard className="h-4 w-4" />
                      Existing Loan Details
                    </h3>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 mb-2">
                        <strong>This order was added to an existing loan</strong>
                      </p>
                      <p className="text-sm text-amber-700 mb-1">
                        <span className="text-muted-foreground">Original Borrower:</span>{' '}
                        <span className="font-medium">
                          {typeof selectedOrder.existingLoanId === 'object' 
                            ? selectedOrder.existingLoanId.customerName
                            : 'N/A'}
                        </span>
                      </p>
                      {selectedOrder.addedBy && (
                        <p className="text-sm text-amber-700">
                          <span className="text-muted-foreground">Items added by:</span>{' '}
                          <span className="font-medium">{selectedOrder.addedBy}</span>
                        </p>
                      )}
                      <p className="text-xs text-amber-600 mt-2">
                        Loan ID: {typeof selectedOrder.existingLoanId === 'string' 
                          ? selectedOrder.existingLoanId.slice(-6)
                          : selectedOrder.existingLoanId._id.slice(-6)}
                      </p>
                    </div>
                  </div>
                )}

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

        {/* Return Dialog */}
        <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <RotateCcw className="h-5 w-5 text-orange-600" />
                Process Return - Order #{selectedOrder?._id.slice(-6)}
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order ID & Customer Info */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Order ID</p>
                      <p className="text-lg font-bold text-primary">#{selectedOrder._id.slice(-6)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Customer:</span>{' '}
                      <span className="font-medium">{selectedOrder.customerName}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Original Total:</span>{' '}
                      <span className="font-medium">Rs. {selectedOrder.total.toFixed(2)}</span>
                    </p>
                  </div>
                </div>

                {/* Return Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Return Type</label>
                  <Select value={returnType} onValueChange={(value: 'partial' | 'full') => setReturnType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="partial">Partial Return (Selected Items)</SelectItem>
                      <SelectItem value="full">Full Return (All Items)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Items to Return */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Select Items to Return</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium">Product</th>
                          <th className="text-center py-2 px-3 font-medium">Purchased</th>
                          <th className="text-center py-2 px-3 font-medium">Return Qty</th>
                          <th className="text-right py-2 px-3 font-medium">Price</th>
                          <th className="text-right py-2 px-3 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnItems.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="py-2 px-3">
                              <div>
                                <p className="font-medium">{item.orderItem.productName}</p>
                                <Input
                                  type="text"
                                  placeholder="Return reason (optional)"
                                  value={item.returnReason}
                                  onChange={(e) => updateReturnReason(index, e.target.value)}
                                  className="mt-1 text-xs h-7"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center">{item.orderItem.quantity}</td>
                            <td className="py-2 px-3 text-center">
                              <Input
                                type="number"
                                min={0}
                                max={item.orderItem.quantity}
                                value={item.returnQuantity}
                                onChange={(e) => updateReturnQuantity(index, parseInt(e.target.value) || 0)}
                                className="w-20 mx-auto text-center h-8"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">Rs. {item.orderItem.unitPrice.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-medium">
                              Rs. {(item.returnQuantity * item.orderItem.unitPrice).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Refund Method */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Refund Method</label>
                  <Select value={refundMethod} onValueChange={(value: 'cash' | 'original_payment' | 'store_credit') => setRefundMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash Refund</SelectItem>
                      <SelectItem value="original_payment">Original Payment Method</SelectItem>
                      <SelectItem value="store_credit">Store Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Return Notes (Optional)</label>
                  <Textarea
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Add any additional notes about this return..."
                    rows={3}
                  />
                </div>

                {/* Return Summary */}
                <div className="border-t pt-4 space-y-2 bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800">Return Summary</h4>
                  {(() => {
                    const { subtotal, tax, total } = calculateReturnTotal();
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span>Rs. {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax ({selectedOrder.taxRate}%):</span>
                          <span>Rs. {tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-orange-200">
                          <span>Refund Amount:</span>
                          <span className="text-orange-700">Rs. {total.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={processReturn}
                    disabled={isProcessingReturn || returnItems.every(i => i.returnQuantity === 0)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {isProcessingReturn ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Process Return
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Returns History Dialog */}
        <Dialog open={returnsHistoryOpen} onOpenChange={setReturnsHistoryOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Eye className="h-5 w-5 text-blue-600" />
                Returns History - Order #{selectedOrder?._id.slice(-6)}
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="p-3 bg-primary/5 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Order ID</p>
                    <p className="text-lg font-bold text-primary">#{selectedOrder._id.slice(-6)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium">{selectedOrder.customerName}</p>
                  </div>
                </div>
              </div>
            )}

            {returnsLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-muted-foreground mt-2">Loading returns...</p>
              </div>
            ) : orderReturns.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No returns found for this order.
              </div>
            ) : (
              <div className="space-y-4">
                {orderReturns.map((returnRecord) => (
                  <div key={returnRecord._id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-lg">Return #{returnRecord.returnNumber}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(returnRecord.createdAt)}</p>
                      </div>
                      <Badge
                        variant={returnRecord.returnType === 'full' ? 'destructive' : 'outline'}
                        className={returnRecord.returnType === 'full' ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}
                      >
                        {returnRecord.returnType === 'full' ? 'Full Return' : 'Partial Return'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Returned Items:</p>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        {returnRecord.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.productName} x {item.quantity}</span>
                            <span className="font-medium">Rs. {item.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Refund Method: </span>
                        <span className="capitalize">{returnRecord.refundMethod.replace('_', ' ')}</span>
                      </div>
                      <div className="text-lg font-bold text-orange-700">
                        Rs. {returnRecord.total.toFixed(2)}
                      </div>
                    </div>

                    {returnRecord.notes && (
                      <div className="text-sm bg-blue-50 p-2 rounded">
                        <span className="text-muted-foreground">Notes: </span>
                        {returnRecord.notes}
                      </div>
                    )}
                  </div>
                ))}

                {/* Total Refunded */}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total Refunded:</span>
                    <span className="text-orange-700">
                      Rs. {orderReturns.reduce((sum, ret) => sum + ret.total, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Invoice View Dialog */}
        <Dialog open={invoiceViewOpen} onOpenChange={setInvoiceViewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Invoice - Order #{selectedOrder?._id.slice(-6)}
              </DialogTitle>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="shrink-0"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </DialogHeader>
            
            <div id="printable-invoice">
              {selectedOrder ? (
                <>
                  {/* Simple Invoice - Same for screen and print */}
                  <div className="space-y-6 p-4 border rounded-lg bg-white">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start border-b pb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
                        <p className="text-sm text-muted-foreground mt-1">Order ID: #{selectedOrder._id.slice(-6)}</p>
                        <p className="text-sm text-muted-foreground">
                          Date: {formatDate(selectedOrder.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={selectedOrder.status === 'completed' ? 'default' : 'outline'}
                          className={`capitalize ${
                            selectedOrder.status === 'returned' ? 'bg-orange-100 text-orange-700' :
                            selectedOrder.status === 'partially_returned' ? 'bg-yellow-100 text-yellow-700' : ''
                          }`}
                        >
                          {selectedOrder.status === 'partially_returned' ? 'Partially Returned' : selectedOrder.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Bill To */}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground uppercase">Bill To</p>
                      <p className="font-medium text-lg">{selectedOrder.customerName}</p>
                      <p className="text-sm">{selectedOrder.customerAddress}</p>
                      <p className="text-sm">{selectedOrder.customerPhone}</p>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr className="text-muted-foreground">
                          <th className="text-left py-2 font-medium">Item</th>
                          <th className="text-center py-2 font-medium">Qty</th>
                          <th className="text-center py-2 font-medium">Unit</th>
                          <th className="text-right py-2 font-medium">Price</th>
                          <th className="text-right py-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-3">{item.productName}</td>
                            <td className="py-3 text-center">{item.quantity}</td>
                            <td className="py-3 text-center capitalize">{item.unitType}</td>
                            <td className="py-3 text-right">Rs. {item.unitPrice.toFixed(2)}</td>
                            <td className="py-3 text-right font-medium">Rs. {item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

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
                      <div className="flex justify-between text-sm pt-2">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="capitalize">{selectedOrder.paymentMethod}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                      <p>Thank you for your business!</p>
                      <p className="mt-1">{selectedOrder.shopName}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No order selected. Please close and try again.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
