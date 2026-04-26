const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId');
  }
  return null;
};

class InvoiceLoanApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'InvoiceLoanApiError';
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new InvoiceLoanApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status
    );
  }
  return response.json();
};

export interface InvoiceLoanItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  amount: number;
  date: string;
  note?: string;
}

export interface InvoiceLoan {
  _id: string;
  userId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerCNIC: string;
  customerAddress: string;
  items: InvoiceLoanItem[];
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  dateGiven: string;
  dueDate?: string;
  status: 'Pending' | 'Partial' | 'Paid';
  notes?: string;
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLoanFormData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerCNIC: string;
  customerAddress: string;
  items: InvoiceLoanItem[];
  totalAmount: number;
  dueDate?: string;
  notes?: string;
}

export interface PaymentFormData {
  amount: number;
  note?: string;
}

export const invoiceLoanApi = {
  getInvoiceLoans: async (status?: string, search?: string): Promise<{ success: boolean; count: number; data: InvoiceLoan[] }> => {
    const userId = getUserId();
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    
    const response = await fetch(`${API_BASE_URL}/invoice-loans?${params.toString()}`);
    return handleResponse(response);
  },

  getInvoiceLoan: async (id: string): Promise<{ success: boolean; data: InvoiceLoan }> => {
    const userId = getUserId();
    const params = userId ? `?userId=${userId}` : '';
    const response = await fetch(`${API_BASE_URL}/invoice-loans/${id}${params}`);
    return handleResponse(response);
  },

  createInvoiceLoan: async (loanData: InvoiceLoanFormData): Promise<{ success: boolean; data: InvoiceLoan }> => {
    const userId = getUserId();
    const dataWithUserId = userId ? { ...loanData, userId } : loanData;
    
    const response = await fetch(`${API_BASE_URL}/invoice-loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithUserId),
    });
    return handleResponse(response);
  },

  addPayment: async (id: string, paymentData: PaymentFormData): Promise<{ success: boolean; data: InvoiceLoan }> => {
    const userId = getUserId();
    const dataWithUserId = userId ? { ...paymentData, userId } : paymentData;
    
    const response = await fetch(`${API_BASE_URL}/invoice-loans/${id}/payment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithUserId),
    });
    return handleResponse(response);
  },

  updateInvoiceLoan: async (id: string, updateData: Partial<InvoiceLoanFormData> & { status?: string }): Promise<{ success: boolean; data: InvoiceLoan }> => {
    const userId = getUserId();
    const dataWithUserId = userId ? { ...updateData, userId } : updateData;
    
    const response = await fetch(`${API_BASE_URL}/invoice-loans/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithUserId),
    });
    return handleResponse(response);
  },

  deleteInvoiceLoan: async (id: string): Promise<{ success: boolean; message: string }> => {
    const userId = getUserId();
    const params = userId ? `?userId=${userId}` : '';
    
    const response = await fetch(`${API_BASE_URL}/invoice-loans/${id}${params}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  getInvoiceLoanStats: async (): Promise<{ success: boolean; data: any }> => {
    const userId = getUserId();
    const params = userId ? `?userId=${userId}` : '';
    const response = await fetch(`${API_BASE_URL}/invoice-loans/stats/overview${params}`);
    return handleResponse(response);
  },
};

export { InvoiceLoanApiError };
