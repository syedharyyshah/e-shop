export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitType: 'single' | 'bulk';
  unitPrice: number;
  total: number;
  baseUnit: string;
  parentUnit: string | null;
}

export interface Order {
  _id: string;
  userId: string;
  shopName: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'digital';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFormData {
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: {
    productId: string;
    quantity: number;
    unitType: 'single' | 'bulk';
    price: number;
    total: number;
  }[];
  paymentMethod?: 'cash' | 'card' | 'digital';
  notes?: string;
}

export interface OrderFilters {
  search?: string;
  status?: 'all' | 'pending' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface OrdersResponse {
  success: boolean;
  count: number;
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  data: Order[];
}

export interface OrderStats {
  overall: {
    totalOrders: number;
    totalRevenue: number;
    totalTax: number;
    averageOrderValue: number;
  };
  today: {
    orders: number;
    revenue: number;
  };
  thisMonth: {
    orders: number;
    revenue: number;
  };
  byStatus: {
    _id: string;
    count: number;
  }[];
}
