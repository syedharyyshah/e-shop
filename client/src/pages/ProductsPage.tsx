import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import { Plus, Search, Pencil, Trash2, X, SlidersHorizontal, AlertTriangle, CheckCircle2, TrendingUp, PackageX, LayoutGrid, Table2, Building2, Package, Loader2, Boxes, ShoppingCart, ChevronUp, FileSpreadsheet, DollarSign, RotateCcw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { productApi } from '@/services/productApi';
import { Product, ProductFilters, ViewMode, StockStatus } from '@/types/product';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>((localStorage.getItem('productViewMode') as ViewMode) || 'table');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
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
    const config: Record<StockStatus, { label: string; className: string; icon: React.ReactNode; dotColor: string; glow: string }> = {
      'out-of-stock': {
        label: 'Out of Stock',
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50',
        icon: <PackageX className="h-3.5 w-3.5" />,
        dotColor: 'bg-red-500',
        glow: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]'
      },
      'low-stock': {
        label: `Low: ${stock}`,
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        dotColor: 'bg-amber-500',
        glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]'
      },
      'in-stock': {
        label: `In Stock: ${stock}`,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        dotColor: 'bg-emerald-500',
        glow: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]'
      },
      'high-stock': {
        label: `High: ${stock}`,
        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        dotColor: 'bg-blue-500',
        glow: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]'
      },
    };
    const c = config[status];
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "gap-2 px-2.5 py-1 font-bold text-[11px] uppercase tracking-tight rounded-full border transition-all duration-300 min-w-[100px] justify-start",
          c.className,
          c.glow
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", c.dotColor)} />
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
    navigate('/invoices', { state: { selectedProduct: product } });
  };

  // Export products to Excel with styling
  const exportToExcel = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }

    const today = new Date().toLocaleDateString('en-GB');
    const filterLabel = stockFilter === 'all' ? 'All Products' : 
      stockFilter === 'out-of-stock' ? 'Out of Stock' :
      stockFilter === 'low-stock' ? 'Low Stock' :
      stockFilter === 'in-stock' ? 'In Stock' :
      stockFilter === 'high-stock' ? 'High Stock' : 'Filtered';

    // CSS styles for Excel-compatible HTML
    const styles = `
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
        th { background-color: #F4B084; color: #000000; font-weight: bold; text-align: left; padding: 8px; border: 1px solid #D9D9D9; }
        td { padding: 6px 8px; border: 1px solid #D9D9D9; text-align: left; }
        tr:nth-child(even) { background-color: #FCE4D6; }
        tr:nth-child(odd) { background-color: #FFFFFF; }
        tr:hover { background-color: #F8CBAD; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .price { font-weight: bold; color: #C65911; }
        .stock-out { color: #FF0000; font-weight: bold; }
        .stock-low { color: #FFC000; font-weight: bold; }
        .stock-in { color: #00B050; font-weight: bold; }
        .stock-high { color: #0070C0; font-weight: bold; }
        .header-row { background-color: #F4B084 !important; }
        .report-title { font-size: 14pt; font-weight: bold; margin-bottom: 10px; color: #C65911; }
        .report-date { font-size: 10pt; color: #666; margin-bottom: 15px; }
        .profit-positive { color: #00B050; font-weight: bold; }
        .profit-negative { color: #FF0000; font-weight: bold; }
      </style>
    `;

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        ${styles}
      </head>
      <body>
        <div class="report-title">Products Report - ${filterLabel}</div>
        <div class="report-date">Generated on: ${today} | Total Records: ${products.length}</div>
        <table>
          <thead>
            <tr class="header-row">
              <th>S.No</th>
              <th>Product Name</th>
              <th>Company</th>
              <th>Category</th>
              <th>Price (PKR)</th>
              <th>Base Stock</th>
              <th>Base Unit</th>
              <th>Parent Unit</th>
              <th>Units/Parent</th>
              <th>Parent Stock</th>
              <th>Stock Status</th>
              <th>Purchase Price</th>
              <th>Cost/Unit</th>
              <th>Profit/Unit</th>
            </tr>
          </thead>
          <tbody>
            ${products.map((p, index) => {
              const parentStock = p.parentUnit && p.unitsPerParent 
                ? Math.floor(p.stockQuantity / p.unitsPerParent)
                : '-';
              const status = getStockStatus(p.stockQuantity);
              const statusClass = status === 'out-of-stock' ? 'stock-out' : 
                status === 'low-stock' ? 'stock-low' :
                status === 'high-stock' ? 'stock-high' : 'stock-in';
              const profit = p.profitPerUnit || 0;
              const profitClass = profit > 0 ? 'profit-positive' : profit < 0 ? 'profit-negative' : '';
              
              return `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td><b>${p.productName}</b></td>
                  <td>${p.companyName}</td>
                  <td>${p.category}</td>
                  <td class="text-right price">${p.price.toFixed(2)}</td>
                  <td class="text-center">${p.stockQuantity}</td>
                  <td class="text-center">${p.baseUnit}</td>
                  <td class="text-center">${p.parentUnit || '-'}</td>
                  <td class="text-center">${p.unitsPerParent || '-'}</td>
                  <td class="text-center">${parentStock}</td>
                  <td class="text-center ${statusClass}">${status}</td>
                  <td class="text-right">${p.purchasePrice ? p.purchasePrice.toFixed(2) : '-'}</td>
                  <td class="text-right">${p.costPerUnit ? p.costPerUnit.toFixed(2) : '-'}</td>
                  <td class="text-right ${profitClass}">${p.profitPerUnit ? p.profitPerUnit.toFixed(2) : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Create and download HTML file (opens in Excel)
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${products.length} ${filterLabel} products exported with formatting`);
  };

  return (
    <>
      <Navbar />
      <div className="p-4 sm:p-6 space-y-4">
        {/* Search + Actions bar */}
        {/* Search + Actions bar */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-[2rem] shadow-premium border border-white/20 dark:border-white/5 transition-all duration-300">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
            <div className="relative flex-1 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <Input
                placeholder="Search products, companies, categories..."
                className="pl-12 pr-4 py-6 bg-white/50 dark:bg-slate-950/50 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all duration-300 placeholder:text-slate-400 text-sm font-medium"
                value={search}
                onChange={(e) => updateParam('q', e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'secondary' : 'ghost'}
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "h-12 px-5 rounded-2xl gap-2 font-bold transition-all duration-300",
                  showFilters 
                    ? "bg-primary/10 text-primary hover:bg-primary/20" 
                    : "bg-white/50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
                {hasFilters && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
              </Button>

              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="h-12">
                <TabsList className="h-full bg-white/50 dark:bg-slate-950/50 rounded-2xl p-1 border-none shadow-sm">
                  <TabsTrigger value="table" className="rounded-xl px-4 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all duration-300">
                    <Table2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline font-bold">Table</span>
                  </TabsTrigger>
                  <TabsTrigger value="grid" className="rounded-xl px-4 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all duration-300">
                    <LayoutGrid className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline font-bold">Grid</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="h-12 px-6 rounded-2xl bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20 hover:shadow-success/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 border-none font-bold gap-2"
              onClick={exportToExcel}
              disabled={products.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden md:inline">Download Excel</span>
            </Button>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 border-none font-bold gap-2" onClick={() => { resetForm(); setDialogOpen(true); }}>
                  <Plus className="h-5 w-5" />
                  <span>Add Product</span>
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
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 dark:border-white/10 animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              
              {/* Stock Status Filter */}
              <div className="space-y-2.5 group/filter">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-2 transition-colors">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 transition-transform group-hover/filter:scale-110">
                    <Package className="h-3.5 w-3.5" />
                  </div>
                  Stock Status
                </label>
                <Select value={stockFilter} onValueChange={(v) => updateParam('stock', v)}>
                  <SelectTrigger className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl h-12 font-bold shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all focus:ring-2 focus:ring-blue-500/20">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2.5 group/filter">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-2 transition-colors">
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-500 transition-transform group-hover/filter:scale-110">
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </div>
                  Category
                </label>
                <Select value={categoryFilter} onValueChange={(v) => updateParam('category', v)}>
                  <SelectTrigger className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl h-12 font-bold shadow-sm hover:border-purple-500/50 hover:shadow-md transition-all focus:ring-2 focus:ring-purple-500/20">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Company Filter */}
              <div className="space-y-2.5 group/filter">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-2 transition-colors">
                  <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-500 transition-transform group-hover/filter:scale-110">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  Company
                </label>
                <Select value={companyFilter} onValueChange={(v) => updateParam('company', v)}>
                  <SelectTrigger className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl h-12 font-bold shadow-sm hover:border-orange-500/50 hover:shadow-md transition-all focus:ring-2 focus:ring-orange-500/20">
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2.5 lg:col-span-2 group/filter">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-2 transition-colors">
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 transition-transform group-hover/filter:scale-110">
                      <DollarSign className="h-3.5 w-3.5" />
                    </div>
                    Price Range (PKR)
                  </label>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors">
                      <RotateCcw className="h-3 w-3 mr-1" /> Clear All
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 group/input">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover/input:text-emerald-500 transition-colors" />
                    <Input 
                      type="number" 
                      placeholder="Min Price"
                      value={priceMin}
                      onChange={(e) => updateParam('priceMin', e.target.value)}
                      className="pl-10 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl h-12 font-medium text-sm shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="h-px w-4 bg-slate-300 dark:bg-slate-700" />
                  <div className="relative flex-1 group/input">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover/input:text-emerald-500 transition-colors" />
                    <Input 
                      type="number" 
                      placeholder="Max Price"
                      value={priceMax}
                      onChange={(e) => updateParam('priceMax', e.target.value)}
                      className="pl-10 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl h-12 font-medium text-sm shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
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
                color: 'blue',
                icon: Boxes,
                activeClass: 'text-blue-600 dark:text-blue-400',
                bgClass: 'bg-blue-500',
                shadowClass: 'shadow-blue-500/20',
                glowClass: 'bg-blue-400/10'
              },
              { 
                key: 'out-of-stock', 
                count: inventoryStats.outOfStock, 
                label: 'Out of Stock', 
                color: 'red',
                icon: PackageX,
                activeClass: 'text-red-600 dark:text-red-400',
                bgClass: 'bg-red-500',
                shadowClass: 'shadow-red-500/20',
                glowClass: 'bg-red-400/10'
              },
              { 
                key: 'low-stock', 
                count: inventoryStats.lowStock, 
                label: 'Low Stock', 
                color: 'amber',
                icon: AlertTriangle,
                activeClass: 'text-amber-600 dark:text-amber-400',
                bgClass: 'bg-amber-500',
                shadowClass: 'shadow-amber-500/20',
                glowClass: 'bg-amber-400/10'
              },
              { 
                key: 'in-stock', 
                count: inventoryStats.inStock, 
                label: 'In Stock', 
                color: 'emerald',
                icon: CheckCircle2,
                activeClass: 'text-emerald-600 dark:text-emerald-400',
                bgClass: 'bg-emerald-500',
                shadowClass: 'shadow-emerald-500/20',
                glowClass: 'bg-emerald-400/10'
              },
              { 
                key: 'high-stock', 
                count: inventoryStats.highStock, 
                label: 'High Stock', 
                color: 'indigo',
                icon: TrendingUp,
                activeClass: 'text-indigo-600 dark:text-indigo-400',
                bgClass: 'bg-indigo-500',
                shadowClass: 'shadow-indigo-500/20',
                glowClass: 'bg-indigo-400/10'
              },
            ];
            
            return (
              <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 w-full overflow-x-auto no-scrollbar scroll-smooth">
                {badges.map(badge => {
                  const isActive = stockFilter === badge.key;
                  return (
                    <button
                      key={badge.key}
                      onClick={() => updateParam('stock', badge.key)}
                      className={cn(
                        "relative flex items-center gap-3 px-4 py-3 rounded-[1.5rem] transition-all duration-300 group overflow-hidden flex-1 min-w-[150px]",
                        isActive 
                          ? "bg-white dark:bg-slate-800 shadow-premium-sm scale-100" 
                          : "hover:bg-white/40 dark:hover:bg-slate-800/40 hover:scale-105 hover:shadow-lg hover:z-10"
                      )}
                    >
                      {/* Active Background Glow */}
                      {isActive && (
                        <div className={cn(
                          "absolute inset-0 opacity-10 blur-xl transition-all duration-300",
                          badge.glowClass
                        )} />
                      )}
                      
                      <div className={cn(
                        "flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-300 flex-shrink-0",
                        isActive 
                          ? `${badge.bgClass} text-white shadow-lg ${badge.shadowClass} scale-100` 
                          : "bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 group-hover:scale-110"
                      )}>
                        <badge.icon className="h-5 w-5" />
                      </div>

                      <div className="flex flex-col items-start relative z-10 text-left">
                        <span className={cn(
                          "text-xl font-black leading-none transition-all duration-500",
                          isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                        )}>
                          {badge.count}
                        </span>
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider font-bold opacity-70 transition-all duration-500 whitespace-nowrap",
                          isActive ? badge.activeClass : "text-slate-400 dark:text-slate-500"
                        )}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Active Indicator Line */}
                      <div className={cn(
                        "absolute bottom-0 left-1/2 -translate-x-1/2 h-1 rounded-full transition-all duration-500",
                        isActive ? `w-8 ${badge.bgClass}` : "w-0 bg-transparent"
                      )} />

                      {/* Active Badge Label (Optional, replaced by design) */}
                      {isActive && (
                        <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
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
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] border border-white/20 dark:border-white/5 shadow-premium overflow-hidden">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-20 py-6 pl-8">Image</TableHead>
                    <TableHead className="min-w-[200px]">Product Info</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[150px]">Brand & Category</TableHead>
                    <TableHead className="text-right min-w-[120px]">Price (PKR)</TableHead>
                    <TableHead className="w-[140px]">Inventory</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[220px]">Unit & Bulk Details</TableHead>
                    <TableHead className="text-right pr-8 w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-800/50 h-24">
                      <TableCell className="pl-8">
                        <div className="h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                          <ProductImage src={product.imageUrl} alt={product.productName} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">{product.productName}</span>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">{product.baseUnit || 'piece'} based product</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{product.companyName}</span>
                          </div>
                          <Badge variant="secondary" className="w-fit py-0 px-2 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border-none">
                            {product.category}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-lg text-primary">{formatPKR(product.price)}</span>
                          <span className="text-[10px] text-slate-400 font-medium">Selling Price</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StockBadge stock={product.stockQuantity} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Base Unit</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">1 {product.baseUnit || 'pc'}</span>
                          </div>
                          {product.parentUnit && (
                            <div className="flex flex-col">
                              <span className="text-[10px] text-primary uppercase font-bold">Bulk Unit</span>
                              <span className="text-xs font-bold text-primary">1 {product.parentUnit} ({product.unitsPerParent})</span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">In Stock</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {product.stockQuantity} {product.baseUnit || 'pcs'}
                            </span>
                          </div>
                          {product.parentUnit && (
                            <div className="flex flex-col">
                              <span className="text-[10px] text-emerald-500 uppercase font-bold">Margin</span>
                              <span className="text-xs font-bold text-emerald-500">+{formatPKR(product.profitPerUnit || 0)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-2 transition-all duration-300">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-9 w-9 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
                                  onClick={() => handleSaleClick(product)}
                                  disabled={product.stockQuantity === 0}
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Quick Sale</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="secondary" 
                                  size="icon" 
                                  className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm" 
                                  onClick={() => handleEditClick(product)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
                                  onClick={() => handleDeleteClick(product)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove Product</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </div>

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
