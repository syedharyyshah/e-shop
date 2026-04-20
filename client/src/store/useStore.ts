import { create } from 'zustand';
import { Product } from '@/types/product';
import { orders as initialOrders } from '@/data/mockData';
import type { Order } from '@/types';
import { productApi } from '@/services/productApi';

interface AppStore {
  products: Product[];
  orders: Order[];
  sidebarOpen: boolean;
  lowStockThreshold: number;
  highStockThreshold: number;
  setProducts: (products: Product[]) => void;
  refreshProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLowStockThreshold: (value: number) => void;
  setHighStockThreshold: (value: number) => void;
}

export const useStore = create<AppStore>((set) => ({
  products: [],
  orders: initialOrders,
  sidebarOpen: true,
  lowStockThreshold: 20,
  highStockThreshold: 200,
  setProducts: (products) => set({ products }),
  refreshProducts: async () => {
    try {
      const response = await productApi.getProducts();
      if (response.success) {
        set({ products: response.data });
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  },
  addProduct: (product) =>
    set((state) => ({
      products: [
        ...state.products,
        { ...product, _id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
    })),
  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((p) =>
        p._id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    })),
  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p._id !== id),
    })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setLowStockThreshold: (value) => set({ lowStockThreshold: value }),
  setHighStockThreshold: (value) => set({ highStockThreshold: value }),
}));
