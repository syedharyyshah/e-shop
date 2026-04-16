import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Search, Pencil, Trash2, X, SlidersHorizontal, AlertTriangle, CheckCircle2, TrendingUp, PackageX, LayoutGrid, Table2, Building2, Package, Loader2, Boxes, ShoppingCart, ChevronUp, FileSpreadsheet } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { productApi } from '@/services/productApi';
import { Product, ProductFilters, ViewMode, StockStatus } from '@/types/product';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { SaleDialog } from '@/components/SaleDialog';

function formatPKR(price: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}


function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
        <Package className="h-8 w-8 text-slate-400" />
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

const SORT_OPTIONS = [
  { value: 'productName', order: 'asc', label: 'Name (A → Z)' },
  { value: 'productName', order: 'desc', label: 'Name (Z → A)' },
  { value: 'createdAt', order: 'desc', label: 'Date Added (Newest)' },
  { value: 'createdAt', order: 'asc', label: 'Date Added (Oldest)' },
  { value: 'price', order: 'asc', label: 'Price (Low → High)' },
  { value: 'price', order: 'desc', label: 'Price (High → Low)' },
  { value: 'stockQuantity', order: 'asc', label: 'Stock (Low → High)' },
  { value: 'stockQuantity', order: 'desc', label: 'Stock (High → Low)' },
] as const;

export default function ProductsPage() {
  const { lowStockThreshold, highStockThreshold } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>((localStorage.getItem('productViewMode') as ViewMode) || 'table');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [productToSell, setProductToSell] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [inventoryStats, setInventoryStats] = useState<{
    outOfStock: number;
    lowStock: number;
    inStock: number;
    highStock: number;
  }>({ outOfStock: 0, lowStock: 0, inStock: 0, highStock: 0 });

  // Dynamic stock status function using user's custom thresholds
  const getStockStatus = useCallback((stock: number): StockStatus => {
    if (stock === 0) return 'out-of-stock';
    if (stock <= lowStockThreshold) return 'low-stock';
    if (stock >= highStockThreshold) return 'high-stock';
    return 'in-stock';
  }, [lowStockThreshold, highStockThreshold]);

  // StockBadge component using dynamic thresholds
  const StockBadge = useCallback(({ stock }: { stock: number }) => {
    const status = getStockStatus(stock);
    const config: Record<StockStatus, { label: string; className: string; icon: React.ReactNode; dotColor: string }> = {
      'out-of-stock': {
        label: 'Out of Stock',
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
        icon: <PackageX className="h-3 w-3" />,
        dotColor: 'bg-red-500',
      },
      'low-stock': {
        label: `Low Stock (${stock})`,
        className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800',
        icon: <AlertTriangle className="h-3 w-3" />,
        dotColor: 'bg-orange-500',
      },
      'in-stock': {
        label: `In Stock (${stock})`,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
        icon: <CheckCircle2 className="h-3 w-3" />,
        dotColor: 'bg-emerald-500',
      },
      'high-stock': {
        label: `High Stock (${stock})`,
        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
        icon: <TrendingUp className="h-3 w-3" />,
        dotColor: 'bg-blue-500',
      },
    };
    const c = config[status];
    return (
      <Badge variant="outline" className={`gap-1.5 font-medium text-xs ${c.className}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${c.dotColor}`} />
        {c.label}
      </Badge>
    );
  }, [getStockStatus]);
  
  const [newProduct, setNewProduct] = useState({
    productName: '',
    companyName: '',
    category: '',
    price: '',
    stockQuantity: '',
    piecesPerUnit: '1',
    baseUnit: 'piece',
    // Multi-unit fields
    parentUnit: '',
    unitsPerParent: '',
    purchasePrice: '',
    costPerUnit: '',
    profitPerUnit: '',
    description: '',
    imageUrl: '',
  });
  const [showMultiUnitFields, setShowMultiUnitFields] = useState(false);

  // Read filters from URL
  const search = searchParams.get('q') || '';
  const stockFilter = (searchParams.get('stock') || 'all') as 'all' | StockStatus;
  const categoryFilter = searchParams.get('category') || 'all';
  const companyFilter = searchParams.get('company') || 'all';
  const priceMin = searchParams.get('priceMin') || '';
  const priceMax = searchParams.get('priceMax') || '';
  const sortValue = searchParams.get('sort') || 'productName-asc';
  const [sortBy, sortOrder] = sortValue.split('-') as [string, 'asc' | 'desc'];

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show/hide back to top button based on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch inventory stats
  const fetchInventoryStats = useCallback(async () => {
    try {
      const response = await productApi.getInventoryStats(lowStockThreshold, highStockThreshold);
      if (response.success && response.data) {
        setInventoryStats({
          outOfStock: response.data.overall.outOfStock || 0,
          lowStock: response.data.overall.lowStock || 0,
          inStock: response.data.overall.inStock || 0,
          highStock: response.data.overall.highStock || 0,
        });
      }
    } catch (err) {
      // Silently fail - stats are not critical
      console.error('Failed to fetch inventory stats:', err);
    }
  }, [lowStockThreshold, highStockThreshold]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: ProductFilters = {
        search: search || undefined,
        stockStatus: stockFilter !== 'all' ? stockFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        company: companyFilter !== 'all' ? companyFilter : undefined,
        minPrice: priceMin || undefined,
        maxPrice: priceMax || undefined,
        sortBy,
        sortOrder,
        lowStockThreshold,
        highStockThreshold,
      };
      
      const response = await productApi.getProducts(filters);
      setProducts(response.data);
      setCategories(response.filters.categories);
      setCompanies(response.filters?.companies || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, lowStockThreshold, highStockThreshold]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchInventoryStats();
  }, [fetchInventoryStats]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('productViewMode', viewMode);
  }, [viewMode]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!value || value === 'all') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        // Reset to page 1 when filters change
        next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  const hasFilters = search || stockFilter !== 'all' || categoryFilter !== 'all' || companyFilter !== 'all' || priceMin || priceMax;

  const clearFilters = () => {
    setSearchParams({});
  };

  const handleEditClick = (product: Product) => {
    setProductToEdit(product);
    setEditMode(true);
    setNewProduct({
      productName: product.productName,
      companyName: product.companyName,
      category: product.category,
      price: String(product.price),
      stockQuantity: String(product.stockQuantity),
      piecesPerUnit: String(product.piecesPerUnit || 1),
      baseUnit: product.baseUnit || 'piece',
      parentUnit: product.parentUnit || '',
      unitsPerParent: product.unitsPerParent ? String(product.unitsPerParent) : '',
      purchasePrice: product.purchasePrice ? String(product.purchasePrice) : '',
      costPerUnit: product.costPerUnit ? String(product.costPerUnit) : '',
      profitPerUnit: product.profitPerUnit ? String(product.profitPerUnit) : '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
    });
    setShowMultiUnitFields(!!product.parentUnit);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setNewProduct({
      productName: '',
      companyName: '',
      category: '',
      price: '',
      stockQuantity: '',
      piecesPerUnit: '1',
      baseUnit: 'piece',
      parentUnit: '',
      unitsPerParent: '',
      purchasePrice: '',
      costPerUnit: '',
      profitPerUnit: '',
      description: '',
      imageUrl: '',
    });
    setShowMultiUnitFields(false);
    setEditMode(false);
    setProductToEdit(null);
  };

  const handleAddProduct = async () => {
    if (!newProduct.productName || !newProduct.companyName || !newProduct.category || !newProduct.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate multi-unit fields if parentUnit is provided
    if (showMultiUnitFields && newProduct.parentUnit) {
      if (!newProduct.unitsPerParent || Number(newProduct.unitsPerParent) < 1) {
        toast.error('Units per parent is required and must be at least 1');
        return;
      }
      if (!newProduct.purchasePrice || Number(newProduct.purchasePrice) < 0) {
        toast.error('Purchase price is required and cannot be negative');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Calculate cost and profit per unit
      let costPerUnit = Number(newProduct.costPerUnit) || null;
      let profitPerUnit = null;
      
      if (showMultiUnitFields && newProduct.parentUnit && newProduct.purchasePrice && newProduct.unitsPerParent) {
        const unitsPerParentNum = Number(newProduct.unitsPerParent);
        const purchasePriceNum = Number(newProduct.purchasePrice);
        if (unitsPerParentNum > 0) {
          costPerUnit = Math.round((purchasePriceNum / unitsPerParentNum) * 100) / 100;
        }
      }
      
      if (costPerUnit !== null) {
        profitPerUnit = Math.round((Number(newProduct.price) - costPerUnit) * 100) / 100;
      }

      const productData = {
        productName: newProduct.productName,
        companyName: newProduct.companyName,
        category: newProduct.category,
        price: Number(newProduct.price),
        stockQuantity: Number(newProduct.stockQuantity) || 0,
        piecesPerUnit: Number(newProduct.piecesPerUnit) || 1,
        baseUnit: newProduct.baseUnit || 'piece',
        // Multi-unit fields (only send if enabled)
        parentUnit: showMultiUnitFields ? (newProduct.parentUnit || null) : null,
        unitsPerParent: showMultiUnitFields ? (Number(newProduct.unitsPerParent) || null) : null,
        purchasePrice: showMultiUnitFields ? (Number(newProduct.purchasePrice) || null) : null,
        costPerUnit,
        profitPerUnit,
        description: newProduct.description || null,
        imageUrl: newProduct.imageUrl || null,
      };
      
      await productApi.createProduct(productData);
      
      toast.success('Product added successfully');
      setNewProduct({
        productName: '',
        companyName: '',
        category: '',
        price: '',
        stockQuantity: '',
        piecesPerUnit: '1',
        baseUnit: 'piece',
        parentUnit: '',
        unitsPerParent: '',
        purchasePrice: '',
        costPerUnit: '',
        profitPerUnit: '',
        description: '',
        imageUrl: '',
      });
      setShowMultiUnitFields(false);
      setDialogOpen(false);
      fetchProducts();
      fetchInventoryStats(); // Refresh inventory stats
    } catch (error: any) {
      console.error('Failed to add product:', error);
      toast.error(error.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await productApi.deleteProduct(productToDelete._id);
      toast.success('Product deleted successfully');
      fetchProducts();
      fetchInventoryStats(); // Refresh inventory stats
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleUpdateProduct = async () => {
    if (!productToEdit) return;

    if (!newProduct.productName || !newProduct.companyName || !newProduct.category || !newProduct.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (showMultiUnitFields && newProduct.parentUnit) {
      if (!newProduct.unitsPerParent || Number(newProduct.unitsPerParent) < 1) {
        toast.error('Units per parent is required and must be at least 1');
        return;
      }
      if (!newProduct.purchasePrice || Number(newProduct.purchasePrice) < 0) {
        toast.error('Purchase price is required and cannot be negative');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let costPerUnit = Number(newProduct.costPerUnit) || null;
      let profitPerUnit = null;

      if (showMultiUnitFields && newProduct.parentUnit && newProduct.purchasePrice && newProduct.unitsPerParent) {
        const unitsPerParentNum = Number(newProduct.unitsPerParent);
        const purchasePriceNum = Number(newProduct.purchasePrice);
        if (unitsPerParentNum > 0) {
          costPerUnit = Math.round((purchasePriceNum / unitsPerParentNum) * 100) / 100;
        }
      }

      if (costPerUnit !== null) {
        profitPerUnit = Math.round((Number(newProduct.price) - costPerUnit) * 100) / 100;
      }

      const productData = {
        productName: newProduct.productName,
        companyName: newProduct.companyName,
        category: newProduct.category,
        price: Number(newProduct.price),
        stockQuantity: Number(newProduct.stockQuantity) || 0,
        piecesPerUnit: Number(newProduct.piecesPerUnit) || 1,
        baseUnit: newProduct.baseUnit || 'piece',
        parentUnit: showMultiUnitFields ? (newProduct.parentUnit || null) : null,
        unitsPerParent: showMultiUnitFields ? (Number(newProduct.unitsPerParent) || null) : null,
        purchasePrice: showMultiUnitFields ? (Number(newProduct.purchasePrice) || null) : null,
        costPerUnit,
        profitPerUnit,
        description: newProduct.description || null,
        imageUrl: newProduct.imageUrl || null,
      };

      await productApi.updateProduct(productToEdit._id, productData);

      toast.success('Product updated successfully');
      resetForm();
      setDialogOpen(false);
      fetchProducts();
      fetchInventoryStats(); // Refresh inventory stats
    } catch (error: any) {
      console.error('Failed to update product:', error);
      toast.error(error.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaleClick = (product: Product) => {
    if (product.stockQuantity === 0) {
      toast.error('This product is out of stock');
      return;
    }
    setProductToSell(product);
    setSaleDialogOpen(true);
  };

  const handleSaleComplete = () => {
    fetchProducts(); // Refresh product list after sale
    fetchInventoryStats(); // Refresh inventory stats
  };

  // Export products to Excel
  const exportToExcel = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }

    const headers = [
      'Product Name', 'Company', 'Category', 'Price (PKR)', 
      'Base Stock', 'Base Unit', 'Parent Unit', 'Units Per Parent', 'Parent Stock',
      'Stock Status', 'Purchase Price', 'Cost Per Unit', 'Profit Per Unit'
    ];
    
    const rows = products.map(p => {
      // Calculate parent stock if multi-unit
      const parentStock = p.parentUnit && p.unitsPerParent 
        ? Math.floor(p.stockQuantity / p.unitsPerParent)
        : '-';
      
      return [
        p.productName,
        p.companyName,
        p.category,
        p.price,
        p.stockQuantity,
        p.baseUnit,
        p.parentUnit || '-',
        p.unitsPerParent || '-',
        parentStock,
        getStockStatus(p.stockQuantity),
        p.purchasePrice || '-',
        p.costPerUnit || '-',
        p.profitPerUnit || '-'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    const filterLabel = stockFilter === 'all' ? 'All Products' : 
      stockFilter === 'out-of-stock' ? 'Out of Stock' :
      stockFilter === 'low-stock' ? 'Low Stock' :
      stockFilter === 'in-stock' ? 'In Stock' :
      stockFilter === 'high-stock' ? 'High Stock' : 'Filtered';
    
    toast.success(`${products.length} ${filterLabel} products downloaded`);
  };

  return (
    <>
      <Navbar />
      <div className="p-4 sm:p-6 space-y-4">
        {/* Search + Actions bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-96">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/10 p-1.5 rounded-md">
                <Search className="h-4 w-4 text-primary" />
              </div>
              <Input
                placeholder="Search products, companies, categories..."
                className="pl-12 pr-4 py-2.5 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md focus:shadow-md transition-all duration-200 placeholder:text-slate-400 text-sm"
                value={search}
                onChange={(e) => updateParam('q', e.target.value)}
              />
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table" className="flex items-center gap-1.5">
                  <Table2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Table</span>
                </TabsTrigger>
                <TabsTrigger value="grid" className="flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              className="shrink-0 bg-[#217346] hover:bg-[#1a5c38] text-white border-0"
              onClick={exportToExcel}
              disabled={products.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Excel
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="shrink-0" onClick={() => { resetForm(); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editMode ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                  <DialogDescription>
                    {editMode ? 'Update the product details below.' : 'Fill in the details below to add a new product to your inventory.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      placeholder="e.g., Premium Rice 5kg"
                      value={newProduct.productName}
                      onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g., Nestle Pakistan"
                      value={newProduct.companyName}
                      onChange={(e) => setNewProduct({ ...newProduct, companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Groceries"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (PKR) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="e.g., 1500"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      placeholder="e.g., 100"
                      value={newProduct.stockQuantity}
                      onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="piecesPerUnit">Pieces Per Base Unit *</Label>
                    <Input
                      id="piecesPerUnit"
                      type="number"
                      min="1"
                      placeholder="e.g., 1 for single piece"
                      value={newProduct.piecesPerUnit}
                      onChange={(e) => setNewProduct({ ...newProduct, piecesPerUnit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baseUnit">Base Unit *</Label>
                    <Input
                      id="baseUnit"
                      placeholder="e.g., piece, packet, kg, tablet"
                      value={newProduct.baseUnit}
                      onChange={(e) => setNewProduct({ ...newProduct, baseUnit: e.target.value })}
                    />
                  </div>
                  
                  {/* Multi-Unit Toggle */}
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center space-x-3 py-3 px-4 border rounded-lg bg-muted/30">
                      <Checkbox
                        id="multiUnitToggle"
                        checked={showMultiUnitFields}
                        onCheckedChange={(checked) => setShowMultiUnitFields(!!checked)}
                      />
                      <Label htmlFor="multiUnitToggle" className="cursor-pointer flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-primary" />
                        <span>This product is purchased/sold in bulk (carton/box/pack)</span>
                      </Label>
                    </div>
                  </div>

                  {/* Multi-Unit Fields (Conditional) */}
                  {showMultiUnitFields && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="parentUnit">Parent Unit (Carton/Box/Plate) *</Label>
                        <Input
                          id="parentUnit"
                          placeholder="e.g., carton, box, plate"
                          value={newProduct.parentUnit}
                          onChange={(e) => setNewProduct({ ...newProduct, parentUnit: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unitsPerParent">
                          Units per Parent * 
                          <span className="text-xs text-muted-foreground block font-normal">
                            How many {newProduct.baseUnit || 'base units'} in 1 {newProduct.parentUnit || 'parent unit'}?
                          </span>
                        </Label>
                        <Input
                          id="unitsPerParent"
                          type="number"
                          min="1"
                          placeholder="e.g., 12 for a dozen"
                          value={newProduct.unitsPerParent}
                          onChange={(e) => setNewProduct({ ...newProduct, unitsPerParent: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="purchasePrice">
                          Purchase Price (PKR) *
                          <span className="text-xs text-muted-foreground block font-normal">
                            Price for 1 {newProduct.parentUnit || 'parent unit'}
                          </span>
                        </Label>
                        <Input
                          id="purchasePrice"
                          type="number"
                          min="0"
                          placeholder="e.g., 2400 for a carton"
                          value={newProduct.purchasePrice}
                          onChange={(e) => {
                            const purchasePrice = Number(e.target.value);
                            const unitsPerParent = Number(newProduct.unitsPerParent);
                            const price = Number(newProduct.price);
                            let costPerUnit = '';
                            let profitPerUnit = '';
                            
                            if (purchasePrice && unitsPerParent > 0) {
                              costPerUnit = (Math.round((purchasePrice / unitsPerParent) * 100) / 100).toString();
                              if (price) {
                                profitPerUnit = (Math.round((price - Number(costPerUnit)) * 100) / 100).toString();
                              }
                            }
                            
                            setNewProduct({ 
                              ...newProduct, 
                              purchasePrice: e.target.value,
                              costPerUnit,
                              profitPerUnit
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="costPerUnit">
                          Cost Per Base Unit (PKR)
                          <span className="text-xs text-muted-foreground block font-normal">
                            Auto-calculated: Purchase Price ÷ Units per Parent
                          </span>
                        </Label>
                        <Input
                          id="costPerUnit"
                          type="number"
                          min="0"
                          placeholder="Auto-calculated"
                          value={newProduct.costPerUnit}
                          onChange={(e) => setNewProduct({ ...newProduct, costPerUnit: e.target.value })}
                          readOnly={!!(newProduct.purchasePrice && newProduct.unitsPerParent)}
                          className={newProduct.purchasePrice && newProduct.unitsPerParent ? "bg-muted" : ""}
                        />
                      </div>
                      {newProduct.profitPerUnit && (
                        <div className="space-y-2">
                          <Label htmlFor="profitPerUnit">
                            Profit Per Unit (PKR)
                            <span className="text-xs text-muted-foreground block font-normal">
                              Auto-calculated: Selling Price - Cost
                            </span>
                          </Label>
                          <Input
                            id="profitPerUnit"
                            type="number"
                            value={newProduct.profitPerUnit}
                            readOnly
                            className="bg-emerald-50 text-emerald-700"
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={newProduct.imageUrl}
                      onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Brief product description..."
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>
                    Cancel
                  </Button>
                  <Button onClick={editMode ? handleUpdateProduct : handleAddProduct} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editMode ? 'Update Product' : 'Add Product'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{productToDelete?.productName}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="border shadow-sm animate-in slide-in-from-top-2 duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-foreground">Filters</span>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-muted-foreground">
                    <X className="h-3 w-3 mr-1" /> Clear All
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Stock Status</Label>
                  <Select value={stockFilter} onValueChange={(v) => updateParam('stock', v)}>
                    <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="low-stock">Low Stock</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Category</Label>
                  <Select value={categoryFilter} onValueChange={(v) => updateParam('category', v)}>
                    <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Company</Label>
                  <Select value={companyFilter} onValueChange={(v) => updateParam('company', v)}>
                    <SelectTrigger><SelectValue placeholder="All Companies" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {companies.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Min Price (PKR)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={priceMin}
                    onChange={(e) => updateParam('priceMin', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Max Price (PKR)</Label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={priceMax}
                    onChange={(e) => updateParam('priceMax', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Summary Badges - Using actual backend data */}
        <div className="flex flex-wrap items-center gap-2">
          {(() => {
            const totalProducts = inventoryStats.outOfStock + inventoryStats.lowStock + inventoryStats.inStock + inventoryStats.highStock;
            const badges = [
              { 
                key: 'all', 
                count: totalProducts, 
                label: 'All Products', 
                bg: 'bg-slate-100 dark:bg-slate-800', 
                text: 'text-slate-700 dark:text-slate-300', 
                border: 'border-slate-200 dark:border-slate-700',
                icon: Boxes
              },
              { 
                key: 'out-of-stock', 
                count: inventoryStats.outOfStock, 
                label: 'Out of Stock', 
                bg: 'bg-red-100 dark:bg-red-950/40', 
                text: 'text-red-700 dark:text-red-400', 
                border: 'border-red-200 dark:border-red-800',
                icon: PackageX
              },
              { 
                key: 'low-stock', 
                count: inventoryStats.lowStock, 
                label: 'Low Stock', 
                bg: 'bg-amber-100 dark:bg-amber-950/40', 
                text: 'text-amber-700 dark:text-amber-400', 
                border: 'border-amber-200 dark:border-amber-800',
                icon: AlertTriangle
              },
              { 
                key: 'in-stock', 
                count: inventoryStats.inStock, 
                label: 'In Stock', 
                bg: 'bg-emerald-100 dark:bg-emerald-950/40', 
                text: 'text-emerald-700 dark:text-emerald-400', 
                border: 'border-emerald-200 dark:border-emerald-800',
                icon: CheckCircle2
              },
              { 
                key: 'high-stock', 
                count: inventoryStats.highStock, 
                label: 'High Stock', 
                bg: 'bg-blue-100 dark:bg-blue-950/40', 
                text: 'text-blue-700 dark:text-blue-400', 
                border: 'border-blue-200 dark:border-blue-800',
                icon: TrendingUp
              },
            ];
            
            return badges.map(badge => (
              <button
                key={badge.key}
                onClick={() => updateParam('stock', badge.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${badge.bg} ${badge.text} ${badge.border} hover:shadow-md transition-all duration-200 ${stockFilter === badge.key ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
              >
                <badge.icon className="h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span className="text-lg font-bold leading-none">{badge.count}</span>
                  <span className="text-xs font-medium opacity-90">{badge.label}</span>
                </div>
                {stockFilter === badge.key && (
                  <span className="ml-1 text-[10px] bg-white/50 dark:bg-black/30 px-1.5 py-0.5 rounded">Active</span>
                )}
              </button>
            ));
          })()}
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-24 inline-block" />
            ) : (
              <>
                <strong className="text-foreground">{products.length}</strong> product{products.length !== 1 ? 's' : ''} found
              </>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground hidden sm:inline">Sort by:</Label>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(v) => updateParam('sort', v)}
            >
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={`${o.value}-${o.order}`} value={`${o.value}-${o.order}`}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-40 w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No products found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                {hasFilters 
                  ? "Try adjusting your filters or search terms to find what you're looking for."
                  : "Get started by adding your first product to the inventory."}
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Products Grid View */}
        {!isLoading && viewMode === 'grid' && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card
                key={product._id}
                className="group overflow-hidden border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                  <ProductImage src={product.imageUrl} alt={product.productName} />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                      {product.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {product.productName}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <Building2 className="h-3 w-3" />
                      <span className="line-clamp-1">{product.companyName}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">Price</span>
                      <p className="font-bold text-lg text-primary">{formatPKR(product.price)}</p>
                    </div>
                    <StockBadge stock={product.stockQuantity} />
                  </div>
                  
                  {/* Unit Information */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium">Base:</span> {product.piecesPerUnit || 1} {product.baseUnit || 'piece'} @ {formatPKR(product.price)}
                    </p>
                    {product.parentUnit && product.unitsPerParent && (
                      <>
                        {/* Bulk price */}
                        <p className="text-sm font-medium text-primary">
                          <span className="font-medium">Bulk:</span> 1 {product.parentUnit} @ {formatPKR(product.price * product.unitsPerParent)}
                        </p>
                        {/* Stock: 400 packets (40 cartons) */}
                        <p className="text-emerald-600">
                          <span className="font-medium">Stock:</span> {product.stockQuantity} {product.baseUnit}
                          ({Math.floor(product.stockQuantity / product.unitsPerParent)} {product.parentUnit})
                        </p>
                        {/* Conversion: Carton (1/10) */}
                        <p className="text-slate-500">
                          <span className="font-medium">Conversion:</span> {product.parentUnit} (1/{product.unitsPerParent})
                          {product.costPerUnit && (
                            <span className="text-emerald-600 ml-1">| Cost: {formatPKR(product.costPerUnit)}</span>
                          )}
                          {product.profitPerUnit && product.profitPerUnit > 0 && (
                            <span className="text-emerald-600 ml-1">| Profit: {formatPKR(product.profitPerUnit)}</span>
                          )}
                        </p>
                      </>
                    )}
                    {!product.parentUnit && (
                      <p className="text-slate-500">
                        <span className="font-medium">Stock:</span> {product.stockQuantity} {product.baseUnit}
                      </p>
                    )}
                  </div>
                  
                  <div className="pt-2 flex items-center justify-end gap-1 border-t mt-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => handleSaleClick(product)}
                            disabled={product.stockQuantity === 0}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sell</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(product)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Products Table View */}
        {!isLoading && viewMode === 'table' && products.length > 0 && (
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16">Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="hidden md:table-cell">Company</TableHead>
                      <TableHead className="hidden sm:table-cell">Category</TableHead>
                      <TableHead className="text-right">Price (PKR)</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="hidden lg:table-cell">Unit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product._id} className="group">
                        <TableCell>
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted">
                            <ProductImage src={product.imageUrl} alt={product.productName} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium line-clamp-1">{product.productName}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{product.companyName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{product.companyName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="font-normal">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatPKR(product.price)}
                        </TableCell>
                        <TableCell>
                          <StockBadge stock={product.stockQuantity} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          <div className="space-y-0.5">
                            <span>{product.piecesPerUnit || 1} {product.baseUnit || 'piece'} @ {formatPKR(product.price)}</span>
                            {product.parentUnit && product.unitsPerParent && (
                              <>
                                {/* Bulk price line */}
                                <div className="text-sm font-medium text-primary">
                                  1 {product.parentUnit} @ {formatPKR(product.price * product.unitsPerParent)}
                                </div>
                                {/* Stock: 400 packets (40 cartons) */}
                                <div className="text-xs text-emerald-600">
                                  Stock: {product.stockQuantity} {product.baseUnit}
                                  ({Math.floor(product.stockQuantity / product.unitsPerParent)} {product.parentUnit})
                                </div>
                                {/* Conversion: Carton (1/10) */}
                                <div className="text-xs text-slate-500">
                                  {product.parentUnit} (1/{product.unitsPerParent})
                                  {product.costPerUnit && <span className="ml-1">| Cost: {formatPKR(product.costPerUnit)}</span>}
                                  {product.profitPerUnit && product.profitPerUnit > 0 && <span className="ml-1 text-emerald-600">| Profit: {formatPKR(product.profitPerUnit)}</span>}
                                </div>
                              </>
                            )}
                            {!product.parentUnit && (
                              <div className="text-xs text-slate-500">Stock: {product.stockQuantity} {product.baseUnit}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                                    onClick={() => handleSaleClick(product)}
                                    disabled={product.stockQuantity === 0}
                                  >
                                    <ShoppingCart className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Sell</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(product)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteClick(product)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sale Dialog */}
      <SaleDialog
        product={productToSell}
        open={saleDialogOpen}
        onOpenChange={setSaleDialogOpen}
        onSaleComplete={handleSaleComplete}
      />

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:scale-110 transition-all duration-300"
          title="Back to top"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}
    </>
  );
}
