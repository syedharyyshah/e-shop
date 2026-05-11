import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { DollarSign, ShoppingCart, Package, Users, ArrowRight } from 'lucide-react';
import { SalesChart } from '@/components/SalesChart';
import { DashboardPieCharts } from '@/components/DashboardPieCharts';
import { orderApi } from '@/services/orderApi';
import { productApi } from '@/services/productApi';
import type { Order, OrderStats } from '@/types/order';
import type { InventoryStats } from '@/types/product';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [salesData, setSalesData] = useState<{ month: string; sales: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch recent orders
        const ordersResponse = await orderApi.getOrders({ limit: 5 });
        if (ordersResponse.success) {
          setRecentOrders(ordersResponse.data);

          // Calculate monthly sales data from orders
          const monthlyData = calculateMonthlySales(ordersResponse.data);
          setSalesData(monthlyData);
        }

        // Fetch order stats
        const statsResponse = await orderApi.getOrderStats();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }

        // Fetch inventory stats
        const inventoryResponse = await productApi.getInventoryStats();
        if (inventoryResponse.success) {
          setInventoryStats(inventoryResponse.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate monthly sales from orders
  const calculateMonthlySales = (orders: Order[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySales = new Array(12).fill(0);

    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const monthIndex = date.getMonth();
      monthlySales[monthIndex] += order.total;
    });

    return months.map((month, index) => ({
      month,
      sales: monthlySales[index],
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Navbar />
      <div className="p-8 space-y-8 bg-gradient-to-b from-background to-secondary/20 min-h-[calc(100vh-80px)]">
        {/* Header Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your shop today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-[2rem]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Sales</p>
                  <p className="text-3xl font-bold">PKR {stats?.overall?.totalRevenue?.toLocaleString() || '0'}</p>
                  <div className="flex items-center gap-1.5 mt-2 bg-success/10 px-2 py-0.5 rounded-full w-fit">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-[10px] font-bold text-success uppercase">Revenue</span>
                  </div>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                  <DollarSign className="h-7 w-7 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-[2rem]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</p>
                  <p className="text-3xl font-bold">{stats?.overall?.totalOrders?.toLocaleString() || '0'}</p>
                  <div className="flex items-center gap-1.5 mt-2 bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase">Orders</span>
                  </div>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/20">
                  <ShoppingCart className="h-7 w-7 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-[2rem]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">This Month</p>
                  <p className="text-3xl font-bold">PKR {stats?.thisMonth?.revenue?.toLocaleString() || '0'}</p>
                  <div className="flex items-center gap-1.5 mt-2 bg-purple-500/10 px-2 py-0.5 rounded-full w-fit">
                    <Package className="h-3 w-3 text-purple-500" />
                    <span className="text-[10px] font-bold text-purple-500 uppercase">{stats?.thisMonth?.orders || 0} orders</span>
                  </div>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500 shadow-lg shadow-purple-500/20">
                  <Package className="h-7 w-7 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-[2rem]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Orders</p>
                  <p className="text-3xl font-bold">{stats?.today?.orders?.toLocaleString() || '0'}</p>
                  <div className="flex items-center gap-1.5 mt-2 bg-orange-500/10 px-2 py-0.5 rounded-full w-fit">
                    <TrendingUp className="h-3 w-3 text-orange-500" />
                    <span className="text-[10px] font-bold text-orange-500 uppercase">PKR {stats?.today?.revenue?.toLocaleString() || '0'}</span>
                  </div>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/20">
                  <Users className="h-7 w-7 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-none shadow-premium rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-card/50 backdrop-blur-sm border-b border-border/50 px-8 py-6">
            <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sales Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <SalesChart data={salesData} />
          </CardContent>
        </Card>

        {/* Overview Charts */}
        <DashboardPieCharts orderStats={stats} inventoryStats={inventoryStats} />

        {/* Recent Orders */}
        <Card className="border-none shadow-premium rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-card/50 backdrop-blur-sm border-b border-border/50 px-8 py-6">
            <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30 text-muted-foreground">
                    <th className="text-left py-4 px-8 font-semibold uppercase tracking-wider text-[10px]">Order ID</th>
                    <th className="text-left py-4 px-8 font-semibold uppercase tracking-wider text-[10px]">Customer</th>
                    <th className="text-left py-4 px-8 font-semibold uppercase tracking-wider text-[10px]">Total</th>
                    <th className="text-left py-4 px-8 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                    <th className="text-left py-4 px-8 font-semibold uppercase tracking-wider text-[10px]">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-muted-foreground font-medium">Loading orders...</p>
                        </div>
                      </td>
                    </tr>
                  ) : recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-10 w-10 opacity-20" />
                          <p>No orders found. Create your first order from the Invoice page.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-primary/5 transition-colors group">
                        <td className="py-4 px-8 font-bold text-primary">#{order._id.slice(-6)}</td>
                        <td className="py-4 px-8 font-medium">{order.customerName}</td>
                        <td className="py-4 px-8 font-bold text-lg">PKR {order.total.toFixed(2)}</td>
                        <td className="py-4 px-8">
                          <Badge
                            variant={
                              order.status === 'completed'
                                ? 'default'
                                : order.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className={cn(
                              "capitalize px-3 py-1 rounded-full font-bold text-[10px] tracking-widest",
                              order.status === 'completed' ? "bg-success hover:bg-success/90" : ""
                            )}
                          >
                            {order.status === 'completed' && order.existingLoanId ? 'Completed as Loan' : order.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-8 text-muted-foreground font-medium">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {recentOrders.length > 0 && (
              <div className="p-6 bg-muted/20 border-t border-border/50 flex justify-center">
                <button
                  onClick={() => navigate('/orders')}
                  className="group relative flex items-center gap-3 px-10 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 overflow-hidden"
                >
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  
                  View All Orders
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

