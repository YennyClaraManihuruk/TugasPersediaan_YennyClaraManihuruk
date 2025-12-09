import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const salesData = [
  { name: 'Sen', revenue: 60000000, cost: 36000000 },
  { name: 'Sel', revenue: 45000000, cost: 21000000 },
  { name: 'Rab', revenue: 30000000, cost: 14700000 },
  { name: 'Kam', revenue: 41700000, cost: 25000000 },
  { name: 'Jum', revenue: 28350000, cost: 18000000 },
  { name: 'Sab', revenue: 35850000, cost: 22000000 },
  { name: 'Min', revenue: 52350000, cost: 31000000 },
];

const categoryData = [
  { name: 'HP', sales: 120 },
  { name: 'Laptop', sales: 80 },
  { name: 'Tablet', sales: 45 },
  { name: 'Aksesoris', sales: 200 },
];

const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* KPI Cards */}
        {[
          { title: "Total Pendapatan", value: "Rp 1.9 M", change: "+12%", color: "border-emerald-500" },
          { title: "Pesanan Aktif", value: "45", change: "+5%", color: "border-blue-500" },
          { title: "Stok Menipis", value: "8", change: "-2%", color: "border-amber-500" },
          { title: "Retur Pending", value: "3", change: "0%", color: "border-rose-500" },
        ].map((kpi, idx) => (
          <div key={idx} className={`bg-slate-800 p-6 rounded-xl border-l-4 ${kpi.color} shadow-lg`}>
            <p className="text-slate-400 text-sm uppercase tracking-wider">{kpi.title}</p>
            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="text-2xl font-bold text-white">{kpi.value}</h3>
              <span className={`text-sm ${kpi.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Performa Keuangan Mingguan</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatRupiah(value)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Penjualan per Kategori</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  cursor={{fill: '#334155'}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Legend />
                <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Unit Terjual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;