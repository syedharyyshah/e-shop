import { Order, OrderFormData, OrderFilters, OrdersResponse, OrderStats } from '@/types/order';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Get userId from localStorage
const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId');
  }
  return null;
};

class OrderApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OrderApiError';
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API Error:', response.url, response.status, errorData);
    throw new OrderApiError(
      errorData.message || `HTTP error! status: ${response.status} - ${response.url}`,
      response.status
    );
  }
  return response.json();
};

export const orderApi = {
  // Get all orders with filters (automatically includes userId)
  getOrders: async (filters?: OrderFilters): Promise<OrdersResponse> => {
    const params = new URLSearchParams();
    
    // Always include userId to get user-specific orders
    const userId = getUserId();
    if (userId) {
      params.append('userId', userId);
    }
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const url = `${API_BASE_URL}/orders?${params.toString()}`;
    const response = await fetch(url);
    return handleResponse<OrdersResponse>(response);
  },

  // Get single order (includes userId for ownership verification)
  getOrder: async (id: string): Promise<{ success: boolean; data: Order }> => {
    const userId = getUserId();
    const params = userId ? `?userId=${userId}` : '';
    const response = await fetch(`${API_BASE_URL}/orders/${id}${params}`);
    return handleResponse<{ success: boolean; data: Order }>(response);
  },

  // Create order (includes userId automatically)
  createOrder: async (orderData: OrderFormData): Promise<{ success: boolean; message: string; data: Order }> => {
    const url = `${API_BASE_URL}/orders`;
    
    // Add userId to order data
    const userId = getUserId();
    const dataWithUserId = userId ? { ...orderData, userId } : orderData;
    
    console.log('Creating order at:', url, 'Data:', dataWithUserId);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithUserId),
    });
    return handleResponse<{ success: boolean; message: string; data: Order }>(response);
  },

  // Update order status (includes userId for ownership verification)
  updateOrder: async (id: string, updateData: { status?: string; notes?: string }): Promise<{ success: boolean; message: string; data: Order }> => {
    const userId = getUserId();
    const dataWithUserId = userId ? { ...updateData, userId } : updateData;
    
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithUserId),
    });
    return handleResponse<{ success: boolean; message: string; data: Order }>(response);
  },

  // Delete order (includes userId for ownership verification)
  deleteOrder: async (id: string): Promise<{ success: boolean; message: string }> => {
    const userId = getUserId();
    const params = userId ? `?userId=${userId}` : '';
    
    const response = await fetch(`${API_BASE_URL}/orders/${id}${params}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // Get order statistics (filtered by userId)
  getOrderStats: async (): Promise<{ success: boolean; data: OrderStats }> => {
    const userId = getUserId();
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/orders/stats/overview${queryString}`);
    return handleResponse<{ success: boolean; data: OrderStats }>(response);
  },
};

export { OrderApiError };
