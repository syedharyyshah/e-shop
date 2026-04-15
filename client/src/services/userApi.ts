const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  shopName: string;
  phoneNumber: string;
  address: string;
  role: string;
  isApproved: boolean;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
};

export const userApi = {
  getCurrentUser: async (userId: string): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE_URL}/users/me?userId=${userId}`);
    return handleResponse<UserProfile>(response);
  },
};
