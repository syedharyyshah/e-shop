const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export type NotificationType = 
  | 'OUT_OF_STOCK' 
  | 'LOW_STOCK' 
  | 'HIGH_STOCK'
  | 'LOAN_OVERDUE' 
  | 'INVOICE_LOAN_OVERDUE' 
  | 'PENDING_RETURN' 
  | 'PARTIAL_PAYMENT';

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  createdAt: string;
  relatedEntity: {
    type: string;
    id: string;
    name: string;
  };
  metadata?: any;
}

export interface NotificationsSummary {
  totalActive: number;
  totalUnread: number;
  byType: Record<string, { total: number; unread: number }>;
}

export interface NotificationsResponse {
  notifications: Notification[];
  summary: NotificationsSummary;
}

const getUserId = (): string | null => {
  return localStorage.getItem('userId');
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
};

export const notificationApi = {
  // Get all notifications from backend
  getNotifications: async (params?: any): Promise<NotificationsResponse> => {
    const userId = getUserId();
    if (!userId) {
      return {
        notifications: [],
        summary: { totalActive: 0, totalUnread: 0, byType: {} }
      };
    }

    // Fire and forget generation to keep the fetch fast
    fetch(`${API_BASE_URL}/notifications/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }).catch(err => console.error('Background generation failed:', err));

    const searchParams = new URLSearchParams({ userId });
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }

    // Fetch notifications and counts in parallel
    const [notifRes, countsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/notifications?${searchParams.toString()}`).then(r => handleResponse<any>(r)),
      fetch(`${API_BASE_URL}/notifications/counts?userId=${userId}`).then(r => handleResponse<any>(r))
    ]);

    return {
      notifications: notifRes.data.notifications || [],
      summary: {
        totalActive: countsRes.data.totalActive || 0,
        totalUnread: countsRes.data.totalUnread || 0,
        byType: countsRes.data.byType || {}
      }
    };
  },

  // Mark a notification as read
  markAsRead: async (id: string): Promise<void> => {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read?userId=${userId}`, {
      method: 'PATCH'
    });
    await handleResponse(response);
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    await handleResponse(response);
  },

  // Delete a notification
  deleteNotification: async (id: string): Promise<void> => {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/notifications/${id}?userId=${userId}`, {
      method: 'DELETE'
    });
    await handleResponse(response);
  }
};

