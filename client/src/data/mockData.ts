import { Product, Order, Customer } from '@/types';

export const products: Product[] = [
  { id: '1', name: 'Wireless Headphones', image: '🎧', price: 79.99, stock: 124, category: 'Electronics', dateAdded: '2024-01-15', dateModified: '2024-03-01' },
  { id: '2', name: 'Smart Watch Pro', image: '⌚', price: 199.99, stock: 56, category: 'Electronics', dateAdded: '2024-02-10', dateModified: '2024-03-05' },
  { id: '3', name: 'Leather Backpack', image: '🎒', price: 89.99, stock: 203, category: 'Accessories', dateAdded: '2024-01-20', dateModified: '2024-02-15' },
  { id: '4', name: 'Running Shoes', image: '👟', price: 129.99, stock: 8, category: 'Footwear', dateAdded: '2024-03-01', dateModified: '2024-03-10' },
  { id: '5', name: 'Desk Lamp LED', image: '💡', price: 34.99, stock: 312, category: 'Home', dateAdded: '2023-12-01', dateModified: '2024-01-10' },
  { id: '6', name: 'Bluetooth Speaker', image: '🔊', price: 49.99, stock: 0, category: 'Electronics', dateAdded: '2024-02-20', dateModified: '2024-03-08' },
  { id: '7', name: 'Yoga Mat Premium', image: '🧘', price: 24.99, stock: 445, category: 'Fitness', dateAdded: '2024-01-05', dateModified: '2024-02-01' },
  { id: '8', name: 'Coffee Maker', image: '☕', price: 64.99, stock: 5, category: 'Home', dateAdded: '2024-03-10', dateModified: '2024-03-12' },
];

export const orders: Order[] = [
  { id: 'ORD-001', customer: 'Sarah Johnson', email: 'sarah@email.com', products: [{ productId: '1', name: 'Wireless Headphones', quantity: 1, price: 79.99 }], total: 79.99, status: 'completed', date: '2024-03-15' },
  { id: 'ORD-002', customer: 'Mike Chen', email: 'mike@email.com', products: [{ productId: '2', name: 'Smart Watch Pro', quantity: 1, price: 199.99 }], total: 199.99, status: 'pending', date: '2024-03-14' },
  { id: 'ORD-003', customer: 'Emily Davis', email: 'emily@email.com', products: [{ productId: '3', name: 'Leather Backpack', quantity: 2, price: 89.99 }], total: 179.98, status: 'completed', date: '2024-03-13' },
  { id: 'ORD-004', customer: 'Alex Wilson', email: 'alex@email.com', products: [{ productId: '4', name: 'Running Shoes', quantity: 1, price: 129.99 }], total: 129.99, status: 'cancelled', date: '2024-03-12' },
  { id: 'ORD-005', customer: 'Lisa Park', email: 'lisa@email.com', products: [{ productId: '5', name: 'Desk Lamp LED', quantity: 3, price: 34.99 }], total: 104.97, status: 'pending', date: '2024-03-11' },
  { id: 'ORD-006', customer: 'James Brown', email: 'james@email.com', products: [{ productId: '6', name: 'Bluetooth Speaker', quantity: 1, price: 49.99 }], total: 49.99, status: 'completed', date: '2024-03-10' },
];

export const customers: Customer[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '+1 555-0101', address: '123 Main St, NY', totalOrders: 12, totalSpent: 1249.99, joinedDate: '2023-06-15' },
  { id: '2', name: 'Mike Chen', email: 'mike@email.com', phone: '+1 555-0102', address: '456 Oak Ave, LA', totalOrders: 8, totalSpent: 879.50, joinedDate: '2023-08-22' },
  { id: '3', name: 'Emily Davis', email: 'emily@email.com', phone: '+1 555-0103', address: '789 Pine Rd, Chicago', totalOrders: 15, totalSpent: 2100.00, joinedDate: '2023-03-10' },
  { id: '4', name: 'Alex Wilson', email: 'alex@email.com', phone: '+1 555-0104', address: '321 Elm St, Houston', totalOrders: 5, totalSpent: 450.75, joinedDate: '2023-11-01' },
  { id: '5', name: 'Lisa Park', email: 'lisa@email.com', phone: '+1 555-0105', address: '654 Maple Dr, Phoenix', totalOrders: 20, totalSpent: 3200.00, joinedDate: '2023-01-05' },
  { id: '6', name: 'James Brown', email: 'james@email.com', phone: '+1 555-0106', address: '987 Cedar Ln, Denver', totalOrders: 3, totalSpent: 189.97, joinedDate: '2024-01-20' },
];

export const salesData = [
  { month: 'Jan', sales: 4200, orders: 120 },
  { month: 'Feb', sales: 5800, orders: 165 },
  { month: 'Mar', sales: 4900, orders: 140 },
  { month: 'Apr', sales: 6300, orders: 180 },
  { month: 'May', sales: 7100, orders: 210 },
  { month: 'Jun', sales: 6800, orders: 195 },
  { month: 'Jul', sales: 8200, orders: 240 },
  { month: 'Aug', sales: 7500, orders: 220 },
  { month: 'Sep', sales: 9100, orders: 265 },
  { month: 'Oct', sales: 8700, orders: 250 },
  { month: 'Nov', sales: 10200, orders: 300 },
  { month: 'Dec', sales: 11500, orders: 340 },
];
