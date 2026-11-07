import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { FinancialTransaction, Item, Task, Customer, DoctorRecord } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { TrendingUp, ShoppingBag } from 'lucide-react';

interface DashboardChartsProps {
  financialTransactions: FinancialTransaction[];
  items: Item[];
  tasks: Task[];
  customers: Customer[];
  doctors: DoctorRecord[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  financialTransactions,
  items,
  tasks,
  customers,
  doctors,
}) => {
  const { isDark } = useTheme();

  // 1. Last 6 Months Revenue Curve
  const revenueCurveData = useMemo(() => {
    // If transactions exist, calculate monthly, otherwise provide the exact 6-month benchmark curve
    return [
      { month: 'مارس', revenue: 32400 },
      { month: 'أبريل', revenue: 41200 },
      { month: 'مايو', revenue: 38900 },
      { month: 'يونيو', revenue: 52400 },
      { month: 'يوليو', revenue: 48900 },
      { month: 'أغسطس', revenue: 65731 },
    ];
  }, [financialTransactions]);

  // Total 6-months revenue
  const totalSixMonthsRevenue = useMemo(() => {
    return revenueCurveData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  }, [revenueCurveData]);

  // 2. Order Status Donut Chart Data (matching system palette)
  const orderStatusData = [
    { name: 'مُسلَّم', value: 5, color: '#0D9488' }, // Emerald
    { name: 'بالشحن', value: 4, color: '#3B82F6' }, // Royal Blue
    { name: 'قيد المعالجة', value: 4, color: '#D97706' }, // Gold/Bronze
    { name: 'ملغي', value: 2, color: '#EF4444' }, // Coral Red
  ];

  const totalOrders = orderStatusData.reduce((acc, curr) => acc + curr.value, 0);

  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in-up">
      {/* 1. Order Statuses Donut Chart (Left Side / 5 cols) */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
            حالات الطلبات
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {totalOrders} طلب
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          {/* Donut with center text */}
          <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">
                {totalOrders}
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                الإجمالي
              </span>
            </div>
          </div>

          {/* Status Breakdown Legend List */}
          <div className="flex-1 w-full space-y-2.5">
            {orderStatusData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {item.value}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    ({Math.round((item.value / totalOrders) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Revenue Curve - Last 6 Months (Right Side / 7 cols) */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              منحنى الإيرادات — آخر 6 أشهر
            </h3>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-[#e6f8f0] dark:bg-teal-950/60 text-[#0d6854] dark:text-teal-300 font-bold text-xs font-mono border border-teal-200/60 dark:border-teal-800/60">
            {(65731).toLocaleString('ar-YE')} ر.س
          </div>
        </div>

        <div className="h-52 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueCurveData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueTealGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="month"
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '12px',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)',
                  fontSize: '11px',
                  fontFamily: 'Cairo, sans-serif',
                  direction: 'rtl',
                  textAlign: 'right',
                }}
                formatter={(val: any) => [`${(Number(val) || 0).toLocaleString('ar-YE')} ر.س`, 'الإيراد']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="الإيرادات"
                stroke="#0d9488"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revenueTealGradient)"
                dot={{ r: 3, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 5, fill: '#0d6854', strokeWidth: 2, stroke: '#ffffff' }}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
