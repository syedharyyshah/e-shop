import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, Printer, Save, Minus, ShoppingCart, X, Search, Package, ChevronLeft, CreditCard, Banknote, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { orderApi } from '@/services/orderApi';
import { invoiceLoanApi } from '@/services/invoiceLoanApi';
import { userApi } from '@/services/userApi';
import { useToast } from '@/hooks/use-toast';
import '@/styles/invoice.css';
import type { Product } from '@/types/product';

interface InvoiceItem {
  productId: string;
  name: string;
  companyName: string;
  category: string;
  baseQuantity: number;
  parentQuantity: number;
  unitPrice: number;
  total: number;
  baseUnit: string;
  parentUnit: string | null;
  unitsPerParent: number | null;
  stockQuantity: number;
}

export default function InvoicePage() {
  const { products, refreshProducts } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCnic, setCustomerCnic] = useState('');
  const [shopName, setShopName] = useState('ShopFlow');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isQuantityDialogOpen, setIsQuantityDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'loan'>('cash');
  const [dueDate, setDueDate] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [baseQty, setBaseQty] = useState(0);
  const [parentQty, setParentQty] = useState(0);

  // Fetch user's shop name and products on component mount
  useEffect(() => {
    const fetchUserShop = async () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          const user = await userApi.getCurrentUser(userId);
          if (user.shopName) {
            setShopName(user.shopName);
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      }
    };
    fetchUserShop();

    // Fetch products if not already loaded
    if (products.length === 0) {
      refreshProducts();
    }
  }, []);

  // Handle product passed from navigation state (e.g., from Products page)
  useEffect(() => {
    const navState = location.state as { selectedProduct?: Product } | null;
    if (navState?.selectedProduct) {
      const product = navState.selectedProduct;
      // Check if product already in items
      const existingIndex = items.findIndex(item => item.productId === product._id);
      if (existingIndex >= 0) {
        toast({
          title: 'Already added',
          description: `${product.productName} is already in the invoice`,
          variant: 'destructive',
        });
      } else {
        setSelectedProduct(product);
        setBaseQty(0);
        setParentQty(0);
        setIsQuantityDialogOpen(true);
      }
      // Clear the navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, items, toast, navigate, location.pathname]);

  // Helper to check if product supports bulk
  const hasBulkOption = (product: Product) => {
    return !!(product.parentUnit && product.unitsPerParent && product.unitsPerParent > 1);
  };

  // Helper to calculate price based on unit type
  const getUnitPrice = (product: Product, unitType: 'single' | 'bulk') => {
    if (unitType === 'bulk' && hasBulkOption(product) && product.unitsPerParent) {
      return product.price * product.unitsPerParent;
    }
    return product.price;
  };

  const openProductSelection = () => {
    setIsProductDialogOpen(true);
    setProductSearch('');
  };

  const selectProductForQuantity = (product: Product) => {
    // Check if product already in items
    const existingIndex = items.findIndex(item => item.productId === product._id);
    if (existingIndex >= 0) {
      toast({
        title: 'Already added',
        description: `${product.productName} is already in the invoice`,
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedProduct(product);
    setBaseQty(0);
    setParentQty(0);
    setIsProductDialogOpen(false);
    setIsQuantityDialogOpen(true);
  };

  const addItemToInvoice = () => {
    if (!selectedProduct) return;
    
    const totalBaseUnits = baseQty + (parentQty * (selectedProduct.unitsPerParent || 0));
    
    if (totalBaseUnits === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least 1 quantity',
        variant: 'destructive',
      });
      return;
    }

    if (totalBaseUnits > selectedProduct.stockQuantity) {
      toast({
        title: 'Error',
        description: `Insufficient stock! Available: ${selectedProduct.stockQuantity}`,
        variant: 'destructive',
      });
      return;
    }

    const newItem: InvoiceItem = {
      productId: selectedProduct._id,
      name: selectedProduct.productName,
      companyName: selectedProduct.companyName,
      category: selectedProduct.category,
      baseQuantity: baseQty,
      parentQuantity: parentQty,
      unitPrice: selectedProduct.price,
      total: totalBaseUnits * selectedProduct.price,
      baseUnit: selectedProduct.baseUnit || 'piece',
      parentUnit: selectedProduct.parentUnit || null,
      unitsPerParent: selectedProduct.unitsPerParent || null,
      stockQuantity: selectedProduct.stockQuantity,
    };

    setItems([...items, newItem]);
    setIsQuantityDialogOpen(false);
    setSelectedProduct(null);
    setBaseQty(0);
    setParentQty(0);

    toast({
      title: 'Item Added',
      description: `${selectedProduct.productName} added to invoice`,
    });
  };

  const cancelQuantitySelection = () => {
    setIsQuantityDialogOpen(false);
    setSelectedProduct(null);
    setBaseQty(0);
    setParentQty(0);
    setIsProductDialogOpen(true);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateBaseQuantity = (index: number, delta: number) => {
    const item = items[index];
    const newQty = Math.max(0, item.baseQuantity + delta);
    
    const updated = [...items];
    updated[index].baseQuantity = newQty;
    
    // Calculate total base units
    const totalBaseUnits = newQty + (item.parentQuantity * (item.unitsPerParent || 0));
    updated[index].total = totalBaseUnits * item.unitPrice;
    
    setItems(updated);
  };

  const updateParentQuantity = (index: number, delta: number) => {
    const item = items[index];
    const newQty = Math.max(0, item.parentQuantity + delta);
    
    const updated = [...items];
    updated[index].parentQuantity = newQty;
    
    // Calculate total base units
    const totalBaseUnits = item.baseQuantity + (newQty * (item.unitsPerParent || 0));
    updated[index].total = totalBaseUnits * item.unitPrice;
    
    setItems(updated);
  };

  const getTotalBaseUnits = (item: InvoiceItem) => {
    return item.baseQuantity + (item.parentQuantity * (item.unitsPerParent || 0));
  };

  const checkStock = (item: InvoiceItem) => {
    const totalBaseUnits = getTotalBaseUnits(item);
    return {
      sufficient: totalBaseUnits <= item.stockQuantity,
      available: item.stockQuantity,
      required: totalBaseUnits,
    };
  };

  const openPaymentDialog = () => {
    // Validation - only items are required for regular customers
    // Customer details are optional by default, required only for loan
    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item',
        variant: 'destructive',
      });
      return;
    }

    // Check if all items have quantities
    const emptyItem = items.find(item => getTotalBaseUnits(item) === 0);
    if (emptyItem) {
      toast({
        title: 'Error',
        description: `Please add quantity for ${emptyItem.name}`,
        variant: 'destructive',
      });
      return;
    }

    // Check stock availability
    const stockIssue = items.find(item => !checkStock(item).sufficient);
    if (stockIssue) {
      toast({
        title: 'Error',
        description: `Insufficient stock for ${stockIssue.name}. Available: ${stockIssue.stockQuantity}`,
        variant: 'destructive',
      });
      return;
    }

    // Open payment method dialog
    setPaymentMethod('cash');
    setDueDate('');
    setIsPaymentDialogOpen(true);
  };

  const saveOrder = async () => {
    // Validation - only items are required for regular customers
    // Customer details are optional by default, required only for loan
    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item',
        variant: 'destructive',
      });
      return;
    }

    // Check if all items have quantities
    const emptyItem = items.find(item => getTotalBaseUnits(item) === 0);
    if (emptyItem) {
      toast({
        title: 'Error',
        description: `Please add quantity for ${emptyItem.name}`,
        variant: 'destructive',
      });
      return;
    }

    // Check stock availability
    const stockIssue = items.find(item => !checkStock(item).sufficient);
    if (stockIssue) {
      toast({
        title: 'Error',
        description: `Insufficient stock for ${stockIssue.name}. Available: ${stockIssue.stockQuantity}`,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const orderData = {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerAddress: customerAddress.trim() || '-',
        customerPhone: customerPhone.trim() || '-',
        items: items.map(item => {
          const totalBaseUnits = getTotalBaseUnits(item);
          const isMultiUnit = item.parentQuantity > 0;
          return {
            productId: item.productId,
            quantity: isMultiUnit ? item.parentQuantity : item.baseQuantity,
            unitType: isMultiUnit ? 'bulk' as const : 'single' as const,
            price: isMultiUnit && item.unitsPerParent 
              ? item.unitPrice * item.unitsPerParent 
              : item.unitPrice,
            total: item.total,
          };
        }),
        paymentMethod: 'cash' as const,
      };

      const response = await orderApi.createOrder(orderData);
      const orderId = response.data._id;
      
      // If payment method is loan, create invoice loan
      if (paymentMethod === 'loan') {
        // Loan requires all customer details including CNIC
        if (!customerName.trim()) {
          toast({
            title: 'Error',
            description: 'Customer name is required for loan',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }

        if (!customerAddress.trim()) {
          toast({
            title: 'Error',
            description: 'Customer address is required for loan',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }

        if (!customerPhone.trim()) {
          toast({
            title: 'Error',
            description: 'Customer phone is required for loan',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }

        // Pakistani phone validation (03XXXXXXXXX - 11 digits starting with 0)
        const phoneRegex = /^0[0-9]{10}$/;
        if (!phoneRegex.test(customerPhone.trim())) {
          toast({
            title: 'Error',
            description: 'Please enter valid Pakistani phone number (03XXXXXXXXX)',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }

        if (!customerCnic.trim()) {
          toast({
            title: 'Error',
            description: 'Customer CNIC is required for loan',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }

        // CNIC validation (13 digits without dashes)
        const cnicRegex = /^\d{13}$/;
        if (!cnicRegex.test(customerCnic.trim())) {
          toast({
            title: 'Error',
            description: 'Please enter valid 13-digit CNIC number (without dashes)',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }

        const loanItems = items.map(item => {
          const totalBaseUnits = getTotalBaseUnits(item);
          return {
            productId: item.productId,
            productName: item.name,
            quantity: totalBaseUnits,
            unitPrice: item.unitPrice,
            total: item.total,
          };
        });

        const loanData = {
          orderId: orderId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerCNIC: customerCnic.trim(),
          customerAddress: customerAddress.trim(),
          items: loanItems,
          totalAmount: total,
          dueDate: dueDate || undefined,
          notes: 'Invoice loan created from order',
        };

        await invoiceLoanApi.createInvoiceLoan(loanData);
        
        toast({
          title: 'Success',
          description: 'Order saved with loan successfully!',
        });

        // Refresh products to get updated stock
        await refreshProducts();

        // Reset form
        // Refresh page after short delay to show fresh invoice
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: 'Success',
          description: 'Order saved successfully!',
        });

        // Refresh products to get updated stock
        await refreshProducts();

        // Refresh page after short delay to show fresh invoice
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error saving order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save order',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.total, 0), [items]);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  const currentDate = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <Navbar />
      <div className="p-6">
        {/* Print-only A4 Invoice */}
        <div className="invoice-a4 print-only">
          <div className="invoice-header">
            <div className="shop-info">
              <h1 className="shop-name">{shopName}</h1>
              <p className="shop-address">123 Business Street</p>
              <p className="shop-city">Karachi, Pakistan</p>
              <p className="shop-phone">Phone: (051) 123-4567</p>
            </div>
            <div className="invoice-title-section">
              <h2 className="invoice-title">INVOICE</h2>
            </div>
          </div>

          <div className="invoice-meta-section">
            <div className="bill-to-section">
              <div className="section-header-green">BILL TO</div>
              <div className="bill-to-content">
                <p className="customer-name">{customerName || 'Customer Name'}</p>
                <p className="customer-address">{customerAddress || 'Customer Address'}</p>
                <p className="customer-phone">{customerPhone || 'Customer Phone'}</p>
              </div>
            </div>
            <div className="invoice-details">
              <div className="detail-row">
                <div className="detail-label">INVOICE #</div>
                <div className="detail-value">{invoiceNumber}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">DATE</div>
                <div className="detail-value">{currentDate}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">CUSTOMER ID</div>
                <div className="detail-value">{customerPhone ? customerPhone.slice(-3) : '001'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">TERMS</div>
                <div className="detail-value">Due Upon Receipt</div>
              </div>
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th className="col-description">DESCRIPTION</th>
                <th className="col-qty">QTY</th>
                <th className="col-unit-price">UNIT PRICE</th>
                <th className="col-amount">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="item-description">Sample Product</td>
                  <td className="item-qty">1</td>
                  <td className="item-unit-price">{formatPKR(0)}</td>
                  <td className="item-amount">{formatPKR(0)}</td>
                </tr>
              ) : (
                items.map((item, i) => {
                  const totalBaseUnits = getTotalBaseUnits(item);
                  const isMultiUnit = item.parentUnit && item.unitsPerParent && item.unitsPerParent > 1;
                  const hasParentQty = item.parentQuantity > 0;
                  const displayQty = hasParentQty ? item.parentQuantity : item.baseQuantity;
                  const displayUnit = hasParentQty ? item.parentUnit : item.baseUnit;
                  const unitPrice = hasParentQty && item.unitsPerParent 
                    ? item.unitPrice * item.unitsPerParent 
                    : item.unitPrice;
                  
                  return (
                    <tr key={i}>
                      <td className="item-description">
                        <div>{item.name}</div>
                        {isMultiUnit && totalBaseUnits > 0 && (
                          <div className="item-detail">
                            {item.baseQuantity > 0 && `${item.baseQuantity} ${item.baseUnit}`}
                            {item.baseQuantity > 0 && item.parentQuantity > 0 && ' + '}
                            {item.parentQuantity > 0 && `${item.parentQuantity} ${item.parentUnit}`}
                          </div>
                        )}
                      </td>
                      <td className="item-qty">{displayQty} {displayUnit}</td>
                      <td className="item-unit-price">{formatPKR(unitPrice)}</td>
                      <td className="item-amount">{formatPKR(item.total)}</td>
                    </tr>
                  );
                })
              )}
              {/* Empty rows for alignment */}
              {[...Array(Math.max(0, 8 - items.length))].map((_, i) => (
                <tr key={`empty-${i}`} className="empty-row">
                  <td className="item-description">&nbsp;</td>
                  <td className="item-qty">-</td>
                  <td className="item-unit-price">-</td>
                  <td className="item-amount">-</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-footer-section">
            <div className="thank-you">Thank you for your business!</div>
            <div className="totals-section">
              <div className="total-row">
                <span className="total-label">SUBTOTAL</span>
                <span className="total-value">{formatPKR(subtotal)}</span>
              </div>
              <div className="total-row">
                <span className="total-label">TAX RATE</span>
                <span className="total-value">10%</span>
              </div>
              <div className="total-row">
                <span className="total-label">TAX</span>
                <span className="total-value">{formatPKR(tax)}</span>
              </div>
              <div className="total-row grand-total">
                <span className="total-label">TOTAL</span>
                <span className="total-value">{formatPKR(total)}</span>
              </div>
            </div>
          </div>

          <div className="invoice-contact-footer">
            <p>If you have any question about this invoice, please contact</p>
            <p>{shopName} | Phone: (051) 555-0987 | Email: {shopName.toLowerCase().replace(/\s/g, '')}@gmail.com</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Customer Details</CardTitle>
                <p className="text-xs text-muted-foreground">Optional for regular customers, required for loan</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Customer Name <span className="text-muted-foreground">(Optional)</span></Label>
                  <Input
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Customer Address <span className="text-muted-foreground">(Optional)</span></Label>
                  <Input
                    placeholder="Enter customer address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Customer Phone <span className="text-muted-foreground">(Optional)</span></Label>
                  <Input
                    placeholder="03XXXXXXXXX (11 digits)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1"
                    maxLength={11}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Pakistani format: 03XXXXXXXXX (11 digits)</p>
                </div>
                <div>
                  <Label>Customer CNIC <span className="text-amber-600 font-medium">(Required for Loan)</span></Label>
                  <Input
                    placeholder="XXXXXXXXXXXXX (13 digits)"
                    value={customerCnic}
                    onChange={(e) => setCustomerCnic(e.target.value)}
                    className="mt-1"
                    maxLength={13}
                  />
                  <p className="text-xs text-muted-foreground mt-1">13 digits without dashes - Required for Loan</p>
                </div>
              </CardContent>
            </Card>

            {/* Select Products Button */}
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Products</CardTitle>
                <Button onClick={openProductSelection}>
                  <Package className="mr-2 h-4 w-4" />
                  Select Product
                </Button>
              </CardHeader>
            </Card>

            {/* Product Selection Dialog */}
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogContent className="w-[calc(100%-2rem)] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Select Product
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                    {products
                      .filter(p => {
                        const matchesSearch = !productSearch || 
                          p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.companyName.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.category.toLowerCase().includes(productSearch.toLowerCase());
                        const notAdded = !items.find(item => item.productId === p._id);
                        const inStock = p.stockQuantity > 0;
                        return matchesSearch && notAdded && inStock;
                      })
                      .map((product) => (
                        <Button
                          key={product._id}
                          variant="outline"
                          className="h-auto py-3 px-4 justify-start text-left"
                          onClick={() => selectProductForQuantity(product)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.productName}</p>
                            <p className="text-xs text-muted-foreground">{product.companyName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">Rs. {product.price}/{product.baseUnit || 'piece'}</Badge>
                              <span className="text-xs text-muted-foreground">Stock: {product.stockQuantity}</span>
                            </div>
                          </div>
                          <Plus className="h-4 w-4 ml-2 shrink-0" />
                        </Button>
                      ))}
                  </div>
                  
                  {products.filter(p => {
                    const matchesSearch = !productSearch || 
                      p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.companyName.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.category.toLowerCase().includes(productSearch.toLowerCase());
                    const notAdded = !items.find(item => item.productId === p._id);
                    const inStock = p.stockQuantity > 0;
                    return matchesSearch && notAdded && inStock;
                  }).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {productSearch ? 'No products match your search.' : 'No more products available in stock.'}
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Quantity Selection Dialog (SaleDialog Style) */}
            <Dialog open={isQuantityDialogOpen} onOpenChange={setIsQuantityDialogOpen}>
              <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 -ml-2"
                      onClick={cancelQuantitySelection}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <ShoppingCart className="h-5 w-5" />
                    Add to Invoice
                  </DialogTitle>
                </DialogHeader>

                {selectedProduct && (
                  <div className="space-y-6 py-4">
                    {/* Product Info */}
                    <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-1.5">
                      <h3 className="font-semibold text-base sm:text-lg">{selectedProduct.productName}</h3>
                      <p className="text-sm text-muted-foreground">{selectedProduct.companyName}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{selectedProduct.category}</Badge>
                        <span className="text-sm font-medium text-primary">
                          Rs. {selectedProduct.price} / {selectedProduct.baseUnit}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Stock: </span>
                        <span className="font-medium">
                          {selectedProduct.parentUnit ? (
                            <>
                              {selectedProduct.stockQuantity} {selectedProduct.baseUnit}
                              <span className="text-muted-foreground ml-1">
                                ({Math.floor(selectedProduct.stockQuantity / (selectedProduct.unitsPerParent || 1))} {selectedProduct.parentUnit})
                              </span>
                            </>
                          ) : (
                            <>{selectedProduct.stockQuantity} {selectedProduct.baseUnit}</>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Inputs */}
                    <div className="space-y-4">
                      {/* Base Unit Quantity */}
                      <div className="space-y-2">
                        <Label className="flex justify-between">
                          <span>{selectedProduct.baseUnit} Quantity</span>
                          <span className="text-xs text-muted-foreground">1 {selectedProduct.baseUnit}</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={() => setBaseQty(Math.max(0, baseQty - 1))}
                            disabled={baseQty === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={baseQty}
                            onChange={(e) => setBaseQty(Math.max(0, parseInt(e.target.value) || 0))}
                            className="text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={() => setBaseQty(baseQty + 1)}
                            disabled={baseQty + (parentQty * (selectedProduct.unitsPerParent || 0)) >= selectedProduct.stockQuantity}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Parent Unit Quantity (for multi-unit) */}
                      {selectedProduct.parentUnit && selectedProduct.unitsPerParent && selectedProduct.unitsPerParent > 1 ? (
                        <>
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">Or</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="flex justify-between">
                              <span>{selectedProduct.parentUnit} Quantity</span>
                              <span className="text-xs text-muted-foreground">
                                {selectedProduct.parentUnit} (1/{selectedProduct.unitsPerParent})
                              </span>
                            </Label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0"
                                onClick={() => setParentQty(Math.max(0, parentQty - 1))}
                                disabled={parentQty === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                min="0"
                                value={parentQty}
                                onChange={(e) => setParentQty(Math.max(0, parseInt(e.target.value) || 0))}
                                className="text-center"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0"
                                onClick={() => setParentQty(parentQty + 1)}
                                disabled={baseQty + ((parentQty + 1) * selectedProduct.unitsPerParent) > selectedProduct.stockQuantity}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>

                    {/* Summary */}
                    {(() => {
                      const totalBaseUnits = baseQty + (parentQty * (selectedProduct.unitsPerParent || 0));
                      const totalAmount = totalBaseUnits * selectedProduct.price;
                      const isMultiUnit = selectedProduct.parentUnit && selectedProduct.unitsPerParent && selectedProduct.unitsPerParent > 1;
                      
                      return totalBaseUnits > 0 ? (
                        <div className="bg-primary/5 p-3 sm:p-4 rounded-lg space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Units:</span>
                            <span className="font-medium">{totalBaseUnits} {selectedProduct.baseUnit}</span>
                          </div>
                          {isMultiUnit && parentQty > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Parent Units:</span>
                              <span className="font-medium">{parentQty} {selectedProduct.parentUnit}</span>
                            </div>
                          )}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-sm sm:text-base">Item Total:</span>
                              <span className="font-bold text-base sm:text-lg text-primary">Rs. {totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Stock Warning */}
                    {(() => {
                      const totalBaseUnits = baseQty + (parentQty * (selectedProduct.unitsPerParent || 0));
                      if (totalBaseUnits > selectedProduct.stockQuantity) {
                        return (
                          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Insufficient stock! Available: {selectedProduct.stockQuantity} {selectedProduct.baseUnit}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={cancelQuantitySelection}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={addItemToInvoice}
                    disabled={(() => {
                      const totalBaseUnits = baseQty + (parentQty * (selectedProduct?.unitsPerParent || 0));
                      return totalBaseUnits === 0 || totalBaseUnits > (selectedProduct?.stockQuantity || 0);
                    })()}
                    className="gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Invoice
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Line Items */}
            {items.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Line Items ({items.length})
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setIsProductDialogOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" /> Add More
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => {
                    const isMultiUnit = item.parentUnit && item.unitsPerParent && item.unitsPerParent > 1;
                    const stock = checkStock(item);
                    const totalBaseUnits = getTotalBaseUnits(item);
                    
                    return (
                      <div key={index} className="bg-muted/50 p-4 rounded-lg space-y-3">
                        {/* Product Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.companyName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{item.category}</Badge>
                              <span className="text-sm font-medium text-primary">
                                Rs. {item.unitPrice}/{item.baseUnit}
                              </span>
                            </div>
                            <p className="text-sm mt-1">
                              <span className="text-muted-foreground">Stock: </span>
                              <span className="font-medium">
                                {isMultiUnit ? (
                                  <>
                                    {item.stockQuantity} {item.baseUnit}
                                    <span className="text-muted-foreground ml-1">
                                      ({Math.floor(item.stockQuantity / (item.unitsPerParent || 1))} {item.parentUnit})
                                    </span>
                                  </>
                                ) : (
                                  <>{item.stockQuantity} {item.baseUnit}</>
                                )}
                              </span>
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive shrink-0"
                            onClick={() => removeItem(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Base Unit Quantity */}
                        <div className="space-y-2">
                          <Label className="flex justify-between text-sm">
                            <span>{item.baseUnit} Quantity</span>
                            <span className="text-xs text-muted-foreground">1 {item.baseUnit}</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 shrink-0"
                              onClick={() => updateBaseQuantity(index, -1)}
                              disabled={item.baseQuantity === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={item.baseQuantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const diff = val - item.baseQuantity;
                                updateBaseQuantity(index, diff);
                              }}
                              className="text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 shrink-0"
                              onClick={() => updateBaseQuantity(index, 1)}
                              disabled={totalBaseUnits >= item.stockQuantity}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Parent Unit Quantity (for multi-unit) */}
                        {isMultiUnit && (
                          <>
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="flex justify-between text-sm">
                                <span>{item.parentUnit} Quantity</span>
                                <span className="text-xs text-muted-foreground">
                                  {item.parentUnit} (1/{item.unitsPerParent})
                                </span>
                              </Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10 shrink-0"
                                  onClick={() => updateParentQuantity(index, -1)}
                                  disabled={item.parentQuantity === 0}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.parentQuantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    const diff = val - item.parentQuantity;
                                    updateParentQuantity(index, diff);
                                  }}
                                  className="text-center"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10 shrink-0"
                                  onClick={() => updateParentQuantity(index, 1)}
                                  disabled={totalBaseUnits + (item.unitsPerParent || 0) > item.stockQuantity}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Item Summary */}
                        {totalBaseUnits > 0 && (
                          <div className="bg-primary/5 p-3 rounded-lg space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Units:</span>
                              <span className="font-medium">{totalBaseUnits} {item.baseUnit}</span>
                            </div>
                            {item.parentQuantity > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Parent Units:</span>
                                <span className="font-medium">{item.parentQuantity} {item.parentUnit}</span>
                              </div>
                            )}
                            <div className="border-t pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold">Item Total:</span>
                                <span className="font-bold text-primary">Rs. {item.total.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stock Warning */}
                        {!stock.sufficient && totalBaseUnits > 0 && (
                          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Insufficient stock! Available: {stock.available} {item.baseUnit}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

          </div>

          {/* Preview */}
          <Card className="border-none shadow-sm sticky top-24 screen-only">
            <CardHeader>
              <CardTitle className="text-lg">Invoice Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-card border rounded-xl p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-primary">{shopName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Invoice #{Date.now().toString().slice(-6)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Bill To</p>
                  <p className="font-medium">{customerName || 'Customer Name'}</p>
                  <p className="text-sm text-muted-foreground mt-1">{customerAddress || 'Customer Address'}</p>
                  <p className="text-sm text-muted-foreground">{customerPhone || 'Customer Phone'}</p>
                </div>

                <Separator />

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left py-2 font-medium">Item</th>
                      <th className="text-center py-2 font-medium">Qty</th>
                      <th className="text-right py-2 font-medium">Unit</th>
                      <th className="text-right py-2 font-medium">Price</th>
                      <th className="text-right py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const totalBaseUnits = getTotalBaseUnits(item);
                      const isMultiUnit = item.parentUnit && item.unitsPerParent && item.unitsPerParent > 1;
                      const hasParentQty = item.parentQuantity > 0;
                      
                      return (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {isMultiUnit && totalBaseUnits > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {item.baseQuantity > 0 && `${item.baseQuantity} ${item.baseUnit}`}
                                  {item.baseQuantity > 0 && item.parentQuantity > 0 && ' + '}
                                  {item.parentQuantity > 0 && `${item.parentQuantity} ${item.parentUnit}`}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-2 text-center">
                            {hasParentQty ? item.parentQuantity : item.baseQuantity}
                          </td>
                          <td className="py-2 text-right">
                            {hasParentQty ? item.parentUnit : item.baseUnit}
                          </td>
                          <td className="py-2 text-right">
                            Rs. {hasParentQty && item.unitsPerParent 
                              ? (item.unitPrice * item.unitsPerParent).toFixed(2) 
                              : item.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-2 text-right">Rs. {item.total.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <Separator />

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax (10%)</span><span>Rs. {tax.toFixed(2)}</span></div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>Rs. {total.toFixed(2)}</span></div>
                </div>

                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={openPaymentDialog}
                    disabled={isSaving}
                  >
                    <Save className="mr-2 h-4 w-4" /> 
                    {isSaving ? 'Saving...' : 'Save Order'}
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Print Invoice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Select Payment Method
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Payment Method Options */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Banknote className={`h-8 w-8 ${paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-medium ${paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Cash
                </span>
              </button>

              <button
                onClick={() => setPaymentMethod('loan')}
                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'loan'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <CreditCard className={`h-8 w-8 ${paymentMethod === 'loan' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-medium ${paymentMethod === 'loan' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Loan
                </span>
              </button>
            </div>

            {/* Due Date (only for loan) */}
            {paymentMethod === 'loan' && (
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Set a due date for when the loan should be paid
                </p>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-bold text-primary">Rs. {total.toFixed(2)}</span>
              </div>
              {paymentMethod === 'loan' && (
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Payment Type:</span>
                  <Badge variant="secondary">Loan / Credit</Badge>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveOrder}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  {paymentMethod === 'loan' ? 'Create Loan Order' : 'Confirm Cash Payment'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
