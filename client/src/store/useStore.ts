import { create } from 'zustand';
import { Product } from '@/types';
import { products as initialProducts, orders as initialOrders } from '@/data/mockData';
import type { Order } from '@/types';

interface AppStore {
  products: Product[];
  orders: Order[];
  sidebarOpen: boolean;
  lowStockThreshold: number;
  highStockThreshold: number;
  addProduct: (product: Omit<Product, 'id' | 'dateAdded'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLowStockThreshold: (value: number) => void;
  setHighStockThreshold: (value: number) => void;
}

export const useStore = create<AppStore>((set) => ({
  products: initialProducts,
  orders: initialOrders,
  sidebarOpen: true,
  lowStockThreshold: 20,
  highStockThreshold: 200,
  addProduct: (product) =>
    set((state) => ({
      products: [
        ...state.products,
        { ...product, id: Date.now().toString(), dateAdded: new Date().toISOString().split('T')[0] },
      ],
    })),
  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates, dateModified: new Date().toISOString().split('T')[0] } : p
      ),
    })),
  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setLowStockThreshold: (value) => set({ lowStockThreshold: value }),
  setHighStockThreshold: (value) => set({ highStockThreshold: value }),
}));
