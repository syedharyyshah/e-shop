export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitType: 'single' | 'bulk';
  unitPrice: number;
  total: number;
  returnReason?: string;
}

export interface Return {
  _id: string;
  userId: string;
  orderId: string;
  returnNumber: string;
  customerName: string;
  customerPhone: string;
  items: ReturnItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  returnType: 'full' | 'partial';
  refundMethod: 'cash' | 'original_payment' | 'store_credit';
  refundStatus: 'pending' | 'completed';
  refundDate: string | null;
  notes: string | null;
  processedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnFormData {
  orderId: string;
  items: {
    productId: string;
    quantity: number;
    unitType: 'single' | 'bulk';
    returnReason?: string;
  }[];
  returnType: 'full' | 'partial';
  refundMethod?: 'cash' | 'original_payment' | 'store_credit';
  notes?: string;
  processedBy?: string;
}

export interface ReturnFilters {
  search?: string;
  status?: 'all' | 'pending' | 'approved' | 'rejected' | 'completed';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ReturnsResponse {
  success: boolean;
  count: number;
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  data: Return[];
}

export interface ReturnStats {
  overall: {
    totalReturns: number;
    totalRefundAmount: number;
    averageReturnValue: number;
  };
  today: {
    returns: number;
    refundAmount: number;
  };
  thisMonth: {
    returns: number;
    refundAmount: number;
  };
  byStatus: {
    _id: string;
    count: number;
  }[];
  byType: {
    _id: string;
    count: number;
  }[];
}
