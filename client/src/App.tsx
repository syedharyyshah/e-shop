import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import OrdersPage from "@/pages/OrdersPage";
import CustomersPage from "@/pages/CustomersPage";
import InvoicePage from "@/pages/InvoicePage";
import SettingsPage from "@/pages/SettingsPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import UserManagementPage from "@/pages/UserManagementPage";
import UserLoginPage from "@/pages/UserLoginPage";
import UserSignupPage from "@/pages/UserSignupPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes - No Authentication Required */}
          <Route path="/login" element={<UserLoginPage />} />
          <Route path="/signup" element={<UserSignupPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          
          {/* Protected User Routes - Require User Login */}
          <Route element={<MainLayout />}>
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <ProductsPage />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <OrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <CustomersPage />
              </ProtectedRoute>
            } />
            <Route path="/invoices" element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <InvoicePage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            
            {/* Protected Admin Routes - Require Admin Login */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagementPage />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Catch All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
