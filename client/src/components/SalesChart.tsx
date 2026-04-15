import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { salesData } from '@/data/mockData';

export function SalesChart() {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={salesData}>
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
        <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(0, 0%, 100%)',
            border: '1px solid hsl(220, 13%, 91%)',
            borderRadius: '8px',
            fontSize: '13px',
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
        />
        <Area
          type="monotone"
          dataKey="sales"
          stroke="hsl(221, 83%, 53%)"
          strokeWidth={2}
          fill="url(#salesGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
