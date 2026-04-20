const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId');
  }
  return null;
};

class LoanApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'LoanApiError';
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new LoanApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status
    );
  }
  return response.json();
};

export interface Loan {
  _id: string;
  userId: string;
  borrowerName: string;
  amount: number;
  dateGiven: string;
  dueDate?: string;
  status: 'Pending' | 'Paid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LoanFormData = Omit<Loan, '_id' | 'userId' | 'createdAt' | 'updatedAt'>;

export const loanApi = {
  getLoans: async (): Promise<{ success: boolean; count: number; data: Loan[] }> => {
    const userId = getUserId();
    const params = userId ? `?userId=${userId}` : '';
    const response = await fetch(`${API_BASE_URL}/loans${params}`);
    return handleResponse(response);
  },

  createLoan: async (loanData: LoanFormData): Promise<{ success: boolean; data: Loan }> => {
    const userId = getUserId();
    const dataWithUserId = userId ? { ...loanData, userId } : loanData;
    
    const response = await fetch(`${API_BASE_URL}/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithUserId),
    });
    return handleResponse(response);
  },

  updateLoan: async (id: string, loanData: Partial<LoanFormData>): Promise<{ success: boolean; data: Loan }> => {
    const userId = getUserId();
    const dataWithUserId = userId ? { ...loanData, userId } : loanData;
    
    const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithUserId),
    });
    return handleResponse(response);
  },

  deleteLoan: async (id: string): Promise<{ success: boolean; message: string }> => {
    const userId = getUserId();
    const params = userId ? `?userId=${userId}` : '';
    
    const response = await fetch(`${API_BASE_URL}/loans/${id}${params}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};
