import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon, Tag, Wallet, PackageCheck } from 'lucide-react';

interface DashboardPieChartsProps {
  orderStats: any;
  inventoryStats: any;
}

const COLORS = [
  'hsl(221, 83%, 53%)', // Primary Blue
  'hsl(142, 71%, 45%)', // Success Green
  'hsl(48, 96%, 53%)',  // Warning Yellow
  'hsl(0, 84%, 60%)',   // Destructive Red
  'hsl(262, 83%, 58%)', // Purple
  'hsl(199, 89%, 48%)', // Sky Blue
];

export function DashboardPieCharts({ orderStats, inventoryStats }: DashboardPieChartsProps) {
  // Data for Order Status Pie Chart
  const orderStatusData = orderStats?.byStatus?.map((item: any) => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count
  })) || [
    { name: 'Completed', value: 0 },
    { name: 'Pending', value: 0 },
    { name: 'Cancelled', value: 0 }
  ];

  // Data for Stock Health Pie Chart
  const stockHealthData = [
    { name: 'In Stock', value: inventoryStats?.overall?.inStock || 0 },
    { name: 'Low Stock', value: inventoryStats?.overall?.lowStock || 0 },
    { name: 'Out of Stock', value: inventoryStats?.overall?.outOfStock || 0 },
    { name: 'High Stock', value: inventoryStats?.overall?.highStock || 0 },
  ].filter(item => item.value > 0);

  // If no data, provide fallback for visualization
  if (stockHealthData.length === 0) {
    stockHealthData.push({ name: 'No Products', value: 1 });
  }

  // Data for Category Distribution (Top 5)
  const categoryData = inventoryStats?.byCategory?.slice(0, 5).map((item: any) => ({
    name: item._id || 'Uncategorized',
    value: item.count
  })) || [
    { name: 'General', value: 1 }
  ];

  // Data for Payment Methods
  const paymentMethodData = orderStats?.byPaymentMethod?.map((item: any) => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count
  })).filter((item: any) => item.value > 0) || [];

  if (paymentMethodData.length === 0) {
    paymentMethodData.push({ name: 'No Payments', value: 1 });
  }

  // Final check for order status data
  const finalOrderStatusData = orderStatusData.filter((item: any) => item.value > 0);
  if (finalOrderStatusData.length === 0) {
    finalOrderStatusData.push({ name: 'No Orders', value: 1 });
  }

  // Final check for category data
  const finalCategoryData = categoryData.filter((item: any) => item.value > 0);
  if (finalCategoryData.length === 0) {
    finalCategoryData.push({ name: 'No Products', value: 1 });
  }

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{payload[0].name}</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {payload[0].value.toLocaleString()}
            <span className="text-xs font-normal text-slate-500 ml-1">
              ({((payload[0].value / payload.reduce((acc: number, curr: any) => acc + curr.value, 0)) * 100).toFixed(1)}%)
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Chart 1: Order Status */}
      <Card className="border-none shadow-premium rounded-[2rem] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm group hover:shadow-premium-hover transition-all duration-500">
        <CardHeader className="px-6 py-4 border-b border-border/30">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Order Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={finalOrderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {finalOrderStatusData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart 2: Category Distribution */}
      <Card className="border-none shadow-premium rounded-[2rem] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm group hover:shadow-premium-hover transition-all duration-500">
        <CardHeader className="px-6 py-4 border-b border-border/30">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Tag className="h-4 w-4 text-success" />
            Top Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={finalCategoryData}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {finalCategoryData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart 3: Payment Methods */}
      <Card className="border-none shadow-premium rounded-[2rem] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm group hover:shadow-premium-hover transition-all duration-500">
        <CardHeader className="px-6 py-4 border-b border-border/30">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Wallet className="h-4 w-4 text-purple-500" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {paymentMethodData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart 4: Stock Health */}
      <Card className="border-none shadow-premium rounded-[2rem] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm group hover:shadow-premium-hover transition-all duration-500">
        <CardHeader className="px-6 py-4 border-b border-border/30">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <PackageCheck className="h-4 w-4 text-orange-500" />
            Inventory Health
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stockHealthData}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {stockHealthData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
