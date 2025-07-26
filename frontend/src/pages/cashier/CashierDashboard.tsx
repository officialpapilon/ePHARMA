import React, { useState, useEffect } from 'react';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle, RefreshCw, FileMinus2 } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { API_BASE_URL } from '../../../constants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CashierDashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    totalSales: 0,
    pendingPayments: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<{
    id: number;
    sn: number;
    patient_ID: string;
    customer_name: string;
    total_price: string;
    products_sold: string;
    status: string;
    created_at: string;
  }[]>([]);
  const [salesData, setSalesData] = useState<{ date: string; sales: number }[]>([]);
  const [financial, setFinancial] = useState({
    cashIn: 0,
    cashOut: 0,
    netBalance: 0,
    refunds: 0,
    expenses: 0,
  });

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchDashboardData();
    }
    // eslint-disable-next-line
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/cashier-dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const { data } = await res.json();
      setStats({
        totalCustomers: data.totalCustomers,
        totalProducts: data.totalProducts,
        totalSales: data.totalSales,
        pendingPayments: data.pendingPayments,
        lowStockCount: data.lowStockCount,
        expiringSoonCount: data.expiringSoonCount,
      });
      setRecentTransactions(data.recentTransactions || []);
      setSalesData(data.salesData || []);
      setFinancial(data.financialControl || {});
    } catch (err: any) {
      setError(`Failed to load dashboard data: ${err.message}`);
      console.error('Error in fetchDashboardData:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      icon: <Users className="text-[#4c8bf5]" />,
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toLocaleString(),
      icon: <Package className="text-[#38a169]" />,
    },
    {
      title: 'Total Sales',
      value: `Tsh ${stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: <ShoppingCart className="text-[#805ad5]" />,
    },
    {
      title: 'Pending Payments',
      value: `Tsh ${stats.pendingPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: <DollarSign className="text-red-500" />,
    },
  ];

  const financialCards = [
    {
      title: 'Cash In',
      value: `Tsh ${financial.cashIn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: <ArrowDownCircle className="text-green-500" />,
      color: theme.palette.success.main,
    },
    {
      title: 'Cash Out',
      value: `Tsh ${financial.cashOut.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: <ArrowUpCircle className="text-red-500" />,
      color: theme.palette.error.main,
    },
    {
      title: 'Net Balance',
      value: `Tsh ${financial.netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: <TrendingUp className="text-blue-500" />,
      color: financial.netBalance >= 0 ? theme.palette.success.main : theme.palette.error.main,
    },
    {
      title: 'Refunds',
      value: `Tsh ${financial.refunds.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: <RefreshCw className="text-blue-500" />,
      color: theme.palette.info.main,
    },
    {
      title: 'Expenses',
      value: `Tsh ${financial.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: <FileMinus2 className="text-gray-500" />,
      color: theme.palette.grey[700],
    },
  ];

  const chartData = {
    labels: salesData.map((d) => d.date),
    datasets: [
      {
        label: 'Sales',
        data: salesData.map((d) => d.sales),
        backgroundColor: theme.palette.primary.light,
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Sales Trends (Last 7 Days)',
        font: { size: 18 },
        padding: { bottom: 10 },
      },
      tooltip: {
        callbacks: {
          label: function(context: { raw: number | string }) {
            const value = typeof context.raw === 'string' ? parseFloat(context.raw) : context.raw;
            return `Tsh ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Date (YYYY-MM-DD)', font: { size: 14 } },
        ticks: { font: { size: 12 } },
      },
      y: {
        title: { display: true, text: 'Sales (Tsh)', font: { size: 14 } },
        beginAtZero: true,
        ticks: { font: { size: 12 } },
      },
    },
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.palette.background.default, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100vw', boxSizing: 'border-box', padding: '16px' }}>
      <div style={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 24 }}>Cashier Dashboard</h1>
        {loading && <div style={{ textAlign: 'center', color: theme.palette.text.secondary }}>Loading dashboard data...</div>}
        {error && <div style={{ textAlign: 'center', color: theme.palette.error.main, background: theme.palette.error.light, padding: 8, borderRadius: 8 }}>{error}</div>}
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 32 }}>
          {statCards.map((card, idx) => (
            <div key={idx} style={{ background: theme.palette.primary.main, color: '#fff', padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{card.title}</span>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{card.value}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: '50%' }}>
                {card.icon}
              </div>
            </div>
          ))}
        </div>
        {/* Financial Control Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 32 }}>
          {financialCards.map((card, idx) => (
            <div key={idx} style={{ background: card.color, color: '#fff', padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{card.title}</span>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{card.value}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: '50%' }}>
                {card.icon}
              </div>
            </div>
          ))}
        </div>
        {/* Charts Section */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], maxHeight: 400, minHeight: 300, marginBottom: 32 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
        {/* Alerts Section */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 16 }}>Alerts</h2>
          {!loading && !error ? (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {stats.lowStockCount > 0 && (
                <div style={{ flex: 1, minWidth: 220, background: theme.palette.error.main, color: '#fff', padding: 16, borderRadius: 8 }}>
                  <h3 style={{ fontWeight: 600, margin: 0, marginBottom: 8 }}>Low Stock Alert</h3>
                  <p style={{ margin: 0 }}>{`${stats.lowStockCount} products are below minimum stock level`}</p>
                </div>
              )}
              {stats.expiringSoonCount > 0 && (
                <div style={{ flex: 1, minWidth: 220, background: theme.palette.warning.main, color: '#fff', padding: 16, borderRadius: 8 }}>
                  <h3 style={{ fontWeight: 600, margin: 0, marginBottom: 8 }}>Expiring Soon</h3>
                  <p style={{ margin: 0 }}>{`${stats.expiringSoonCount} products will expire within 30 days`}</p>
                </div>
              )}
              {stats.lowStockCount === 0 && stats.expiringSoonCount === 0 && (
                <p style={{ color: theme.palette.text.secondary }}>No alerts at this time.</p>
              )}
            </div>
          ) : (
            <p style={{ color: theme.palette.text.secondary }}>{loading ? 'Loading alerts...' : 'Failed to load alerts'}</p>
          )}
        </div>
        {/* Recent Transactions */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1] }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 16 }}>Recent Transactions</h2>
          {!loading && !error ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: theme.palette.primary.light }}>
                  <th style={{ padding: 12, textAlign: 'left', color: theme.palette.primary.contrastText }}>S/N</th>
                  <th style={{ padding: 12, textAlign: 'left', color: theme.palette.primary.contrastText }}>ID</th>
                  <th style={{ padding: 12, textAlign: 'left', color: theme.palette.primary.contrastText }}>Customer Name</th>
                  <th style={{ padding: 12, textAlign: 'left', color: theme.palette.primary.contrastText }}>Products Sold</th>
                  <th style={{ padding: 12, textAlign: 'left', color: theme.palette.primary.contrastText }}>Total</th>
                  <th style={{ padding: 12, textAlign: 'left', color: theme.palette.primary.contrastText }}>Status</th>
                  <th style={{ padding: 12, textAlign: 'left', color: theme.palette.primary.contrastText }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} style={{ background: theme.palette.background.default }}>
                    <td style={{ padding: 12 }}>{tx.sn || 'N/A'}</td>
                    <td style={{ padding: 12 }}>{tx.id}</td>
                    <td style={{ padding: 12 }}>{tx.customer_name || tx.patient_ID || 'Unknown'}</td>
                    <td style={{ padding: 12 }}>{tx.products_sold || 'N/A'}</td>
                    <td style={{ padding: 12 }}>{`Tsh ${parseFloat(tx.total_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</td>
                    <td style={{ padding: 12 }}>{tx.status}</td>
                    <td style={{ padding: 12 }}>{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: theme.palette.text.secondary }}>{loading ? 'Loading transactions...' : 'Failed to load transactions'}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;