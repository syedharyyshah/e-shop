import { Return, ReturnFormData, ReturnFilters, ReturnsResponse, ReturnStats } from '@/types/return';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Get userId from localStorage
const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId');
  }
  return null;
};

class ReturnApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ReturnApiError';
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API Error:', response.url, response.status, errorData);
    throw new ReturnApiError(
      errorData.message || `HTTP error! status: ${response.status} - ${response.url}`,
      response.status
    );
  }
  return response.json();
};

export const returnApi = {
  // Get all returns with filters (automatically includes userId)
  getReturns: async (filters?: ReturnFilters): Promise<ReturnsResponse> => {
    const params = new URLSearchParams();
    
    // Always include userId to get user-specific returns
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

    const url = `${API_BASE_URL}/returns?${params.toString()}`;
    const response = await fetch(url);
    return handleResponse<ReturnsResponse>(response);
  },

  // Get single return (includes userId for ownership verification)
  getReturn: async (id: string): Promise<{ success: boolean; data: Return }> => {
    const userId = getUserId();
    const params = userId ? `?userId=${userId}` : '';
    const response = await fetch(`${API_BASE_URL}/returns/${id}${params}`);
    return handleResponse<{ success: boolean; data: Return }>(response);
  },

  // Create return (includes userId automatically)
  createReturn: async (returnData: ReturnFormData): Promise<{ success: boolean; message: string; data: Return }> => {
    const url = `${API_BASE_URL}/returns`;
    
    // Add userId to return data
    const userId = getUserId();
    const dataWithUserId = userId ? { ...returnData, userId } : returnData;
    
    console.log('Creating return at:', url, 'Data:', dataWithUserId);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithUserId),
    });
    return handleResponse<{ success: boolean; message: string; data: Return }>(response);
  },

  // Update return status (includes userId for ownership verification)
  updateReturn: async (id: string, updateData: { status?: string; refundStatus?: string; notes?: string }): Promise<{ success: boolean; message: string; data: Return }> => {
    const userId = getUserId();
    const dataWithUserId = userId ? { ...updateData, userId } : updateData;
    
    const response = await fetch(`${API_BASE_URL}/returns/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithUserId),
    });
    return handleResponse<{ success: boolean; message: string; data: Return }>(response);
  },

  // Delete return (includes userId for ownership verification)
  deleteReturn: async (id: string): Promise<{ success: boolean; message: string }> => {
    const userId = getUserId();
    const params = userId ? `?userId=${userId}` : '';
    
    const response = await fetch(`${API_BASE_URL}/returns/${id}${params}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // Get returns for a specific order
  getOrderReturns: async (orderId: string): Promise<{ success: boolean; count: number; data: Return[] }> => {
    const userId = getUserId();
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/returns/order/${orderId}${queryString}`);
    return handleResponse<{ success: boolean; count: number; data: Return[] }>(response);
  },

  // Get return statistics (filtered by userId)
  getReturnStats: async (): Promise<{ success: boolean; data: ReturnStats }> => {
    const userId = getUserId();
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/returns/stats/overview${queryString}`);
    return handleResponse<{ success: boolean; data: ReturnStats }>(response);
  },
};

export { ReturnApiError };
