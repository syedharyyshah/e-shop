export type { Product } from './product';

export interface Order {
  id: string;
  customer: string;
  email: string;
  products: { productId: string; name: string; quantity: number; price: number }[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  joinedDate: string;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  date: string;
}

export interface StatsCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
}

export type StockStatus = 'out-of-stock' | 'low-stock' | 'in-stock' | 'high-stock';
export type SortOption =
  | 'name-asc' | 'name-desc'
  | 'date-added-desc' | 'date-added-asc'
  | 'date-modified-desc'
  | 'price-asc' | 'price-desc'
  | 'stock-asc' | 'stock-desc';
