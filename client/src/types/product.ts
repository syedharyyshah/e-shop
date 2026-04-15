export type StockStatus = 'out-of-stock' | 'low-stock' | 'in-stock' | 'high-stock';

export interface Product {
  _id: string;
  userId: string;
  productName: string;
  companyName: string;
  category: string;
  price: number;
  currency: string;
  stockQuantity: number;
  piecesPerUnit: number;
  baseUnit: string;
  // Multi-unit product fields
  parentUnit?: string | null;
  unitsPerParent?: number | null;
  purchasePrice?: number | null;
  costPerUnit?: number | null;
  profitPerUnit?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  company?: string;
  minPrice?: string;
  maxPrice?: string;
  stockStatus?: 'all' | StockStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  success: boolean;
  count: number;
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    categories: string[];
    companies: string[];
  };
  data: Product[];
}

export interface ProductFormData {
  productName: string;
  companyName: string;
  category: string;
  price: number;
  stockQuantity: number;
  piecesPerUnit?: number;
  baseUnit?: string;
  // Multi-unit product fields
  parentUnit?: string | null;
  unitsPerParent?: number | null;
  purchasePrice?: number | null;
  costPerUnit?: number | null;
  profitPerUnit?: number | null;
  description?: string | null;
  imageUrl?: string | null;
}

// Sale Item Interface
export interface SaleItem {
  productId: string;
  productName: string;
  baseQuantity: number;  // Always in base units
  parentQuantity: number;  // In parent units (if applicable)
  unitPrice: number;
  totalAmount: number;
  costPerUnit: number;
  profitPerUnit: number;
  totalProfit: number;
}

// Sale Transaction Interface
export interface SaleTransaction {
  _id?: string;
  items: SaleItem[];
  totalAmount: number;
  totalProfit: number;
  customerName?: string;
  paymentMethod: 'cash' | 'card' | 'digital';
  createdAt?: string;
  updatedAt?: string;
}

// Helper: Check if product is multi-unit
export const isMultiUnitProduct = (product: Product | ProductFormData): boolean => {
  return !!(product.parentUnit || (product.unitsPerParent && product.unitsPerParent > 1));
};

// Helper: Calculate stock in parent units
export interface StockInParentUnits {
  full: number;
  remainder: number;
}

export const getStockInParentUnits = (product: Product): StockInParentUnits | null => {
  if (!product.parentUnit || !product.unitsPerParent || product.unitsPerParent < 1) return null;
  return {
    full: Math.floor(product.stockQuantity / product.unitsPerParent),
    remainder: product.stockQuantity % product.unitsPerParent
  };
};

// Helper: Convert quantity to base units
export const convertToBaseUnits = (
  quantity: number,
  unitType: 'base' | 'parent',
  unitsPerParent?: number | null
): number => {
  if (unitType === 'parent' && unitsPerParent) {
    return quantity * unitsPerParent;
  }
  return quantity;
};

// Helper: Calculate mixed sale total
export const calculateMixedSaleTotal = (
  baseQuantity: number,
  parentQuantity: number,
  unitsPerParent: number | null | undefined
): number => {
  if (!unitsPerParent) return baseQuantity;
  return baseQuantity + (parentQuantity * unitsPerParent);
};

// Helper: Format fraction display (e.g., "Carton (1/10)")
export const formatFractionDisplay = (product: Product | ProductFormData): string => {
  if (!isMultiUnitProduct(product) || !product.unitsPerParent) {
    return product.baseUnit || 'piece';
  }
  return `${product.parentUnit} (1/${product.unitsPerParent})`;
};

// Helper: Format unit display
export const formatUnitDisplay = (product: Product | ProductFormData): string => {
  if (isMultiUnitProduct(product)) {
    return `${product.parentUnit} (${product.unitsPerParent} ${product.baseUnit})`;
  }
  return product.baseUnit || 'piece';
};

// Helper: Format stock display
// Format: "400 packets (40 cartons)" - base unit first, parent in parentheses
export const formatStockDisplay = (product: Product): string => {
  const parentStock = getStockInParentUnits(product);
  if (!parentStock) {
    return `${product.stockQuantity} ${product.baseUnit}`;
  }
  if (parentStock.remainder === 0) {
    return `${product.stockQuantity} ${product.baseUnit} (${parentStock.full} ${product.parentUnit})`;
  }
  return `${product.stockQuantity} ${product.baseUnit} (${parentStock.full} ${product.parentUnit} + ${parentStock.remainder} ${product.baseUnit})`;
};

export type ViewMode = 'grid' | 'table';

export interface InventoryStats {
  overall: {
    totalProducts: number;
    totalValue: number;
    outOfStock: number;
    lowStock: number;
  };
  byCategory: {
    _id: string;
    count: number;
    totalValue: number;
  }[];
}
