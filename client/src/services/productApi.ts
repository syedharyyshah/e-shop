import { Product, ProductFilters, ProductsResponse, ProductFormData, InventoryStats } from '@/types/product';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Get userId from localStorage
const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId');
  }
  return null;
};

class ProductApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ProductApiError';
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API Error:', response.url, response.status, errorData);
    throw new ProductApiError(
      errorData.message || `HTTP error! status: ${response.status} - ${response.url}`,
      response.status
    );
  }
  return response.json();
};

export const productApi = {
  // Get all products with filters (automatically includes userId)
  getProducts: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    
    // Always include userId to get user-specific products
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

    const url = `${API_BASE_URL}/products?${params.toString()}`;
    const response = await fetch(url);
    return handleResponse<ProductsResponse>(response);
  },

  // Get single product (includes userId for ownership verification)
  getProduct: async (id: string): Promise<{ success: boolean; data: Product }> => {
    const userId = getUserId();
    const params = userId ? `?userId=${userId}` : '';
    const response = await fetch(`${API_BASE_URL}/products/${id}${params}`);
    return handleResponse<{ success: boolean; data: Product }>(response);
  },

  // Create product (includes userId automatically)
  createProduct: async (productData: ProductFormData): Promise<{ success: boolean; message: string; data: Product }> => {
    const url = `${API_BASE_URL}/products`;
    
    // Add userId to product data
    const userId = getUserId();
    const dataWithUserId = userId ? { ...productData, userId } : productData;
    
    console.log('Creating product at:', url, 'Data:', dataWithUserId);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithUserId),
    });
    return handleResponse<{ success: boolean; message: string; data: Product }>(response);
  },

  // Update product (includes userId for ownership verification)
  updateProduct: async (id: string, productData: Partial<ProductFormData>): Promise<{ success: boolean; message: string; data: Product }> => {
    const userId = getUserId();
    const dataWithUserId = userId ? { ...productData, userId } : productData;
    
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithUserId),
    });
    return handleResponse<{ success: boolean; message: string; data: Product }>(response);
  },

  // Delete product (includes userId for ownership verification)
  deleteProduct: async (id: string): Promise<{ success: boolean; message: string }> => {
    const userId = getUserId();
    const params = userId ? `?userId=${userId}` : '';
    
    const response = await fetch(`${API_BASE_URL}/products/${id}${params}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // Get low stock products (filtered by userId)
  getLowStockProducts: async (threshold?: number): Promise<{ success: boolean; count: number; data: Product[] }> => {
    const userId = getUserId();
    const params = new URLSearchParams();
    if (threshold) params.append('threshold', String(threshold));
    if (userId) params.append('userId', userId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/products/low-stock${queryString}`);
    return handleResponse<{ success: boolean; count: number; data: Product[] }>(response);
  },

  // Get inventory stats (filtered by userId)
  getInventoryStats: async (): Promise<{ success: boolean; data: InventoryStats }> => {
    const userId = getUserId();
    const params = userId ? `?userId=${userId}` : '';
    const response = await fetch(`${API_BASE_URL}/products/stats/inventory${params}`);
    return handleResponse<{ success: boolean; data: InventoryStats }>(response);
  },
};

export { ProductApiError };
