import React, { useState, useEffect } from 'react';
import { Users, Package, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';
import StatCard from '../../components/StatCard';
import RecentTransactionsTable from '../../components/RecentTransactionsTable';
import StockStatusChart from '../../components/StockStatusChart';
import SalesChart from '../../components/SalesChart';
import { API_BASE_URL } from '../../../constants';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    totalSales: 0,
    pendingPayments: 0,
  });
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Array<{
    id: string;
    customer: string;
    total: number;
    status: string;
    date: string;
  }>>([]);
  const [salesData, setSalesData] = useState<Array<{ date: string; sales: number }>>([]);
  const [stockData, setStockData] = useState({ low: 0, normal: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchDashboardData();
    }
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
      // Fetch Total Customers
      const customersRes = await fetch(`${API_BASE_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!customersRes.ok) throw new Error('Failed to fetch customers');
      const customersData = await customersRes.json();
      const totalCustomers = Array.isArray(customersData) ? customersData.length : 0;

      // Fetch Total Products and Stock Status
      const productsRes = await fetch(`${API_BASE_URL}/api/medicines-cache`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      const productsData = await productsRes.json();
      const totalProducts = Array.isArray(productsData) ? productsData.length : 0;
      const lowStock = productsData.filter((p: any) => (p.current_quantity || 0) < 10).length;
      const expiringSoon = productsData.filter((p: any) => {
        const expiry = new Date(p.expiry_date || '9999-12-31');
        const daysLeft = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysLeft <= 30 && daysLeft >= 0;
      }).length;

      // Fetch Total Sales (completed transactions)
      const salesRes = await fetch(`${API_BASE_URL}/api/carts?status=paid`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!salesRes.ok) throw new Error('Failed to fetch sales');
      const salesDataRaw = await salesRes.json();
      const totalSales = Array.isArray(salesDataRaw)
        ? salesDataRaw.reduce((sum: number, tx: any) => sum + (parseFloat(tx.total_price) || 0), 0)
        : 0;

      // Fetch Pending Payments
      const pendingRes = await fetch(`${API_BASE_URL}/api/carts?status=sent_to_cashier`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!pendingRes.ok) throw new Error('Failed to fetch pending payments');
      const pendingData = await pendingRes.json();
      const pendingPayments = Array.isArray(pendingData)
        ? pendingData.reduce((sum: number, tx: any) => sum + (parseFloat(tx.total_price) || 0), 0)
        : 0;

      // Fetch Recent Transactions (latest 5)
      const transactionsRes = await fetch(`${API_BASE_URL}/api/carts`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!transactionsRes.ok) throw new Error('Failed to fetch transactions');
      const transactionsData = await transactionsRes.json();
      const recentTxs = Array.isArray(transactionsData)
        ? transactionsData
            .slice(0, 5)
            .map((tx: any) => ({
              id: tx.transaction_ID || tx.transaction_id || 'N/A',
              customer: tx.patient_ID || 'Unknown',
              total: parseFloat(tx.total_price) || 0,
              status: tx.status || 'Unknown',
              date: tx.created_at || new Date().toISOString(),
            }))
        : [];

      // Fetch Sales Data for Chart (hypothetical endpoint)
      const salesChartRes = await fetch(`${API_BASE_URL}/api/sales/daily`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!salesChartRes.ok) throw new Error('Failed to fetch sales chart data');
      const salesChartData = await salesChartRes.json();
      const salesDataFormatted = Array.isArray(salesChartData)
        ? salesChartData.map((d: any) => ({
            date: d.date || new Date().toISOString().split('T')[0],
            sales: parseFloat(d.total_sales) || 0,
          }))
        : [];

      // Update State
      setStats({ totalCustomers, totalProducts, totalSales, pendingPayments });
      setLowStockCount(lowStock);
      setExpiringSoonCount(expiringSoon);
      setRecentTransactions(recentTxs);
      setSalesData(salesDataFormatted);
      setStockData({ low: lowStock, normal: totalProducts - lowStock });
    } catch (err: any) {
      setError(`Failed to load dashboard data: ${err.message}`);
      console.error('Error in fetchDashboardData:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px', background: '#f5f7fa', minHeight: '100vh', width: '100%', maxWidth: '100vw', boxSizing: 'border-box' }}>
      <h1 className="text-2xl font-semibold text-[#2d3748]">Dashboard Overview</h1>

      {loading && <div className="text-center text-[#4a5568]">Loading dashboard data...</div>}
      {error && <div className="text-center text-red-500 bg-red-50 p-2 rounded-md">{error}</div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {!loading && !error ? (
          <>
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers.toLocaleString()}
              change={stats.totalCustomers > 0 ? '+0%' : 'N/A'}
              icon={<Users className="text-[#4c8bf5]" />}
            />
            <StatCard
              title="Total Products"
              value={stats.totalProducts.toLocaleString()}
              change={stats.totalProducts > 0 ? '+0%' : 'N/A'}
              icon={<Package className="text-[#38a169]" />}
            />
            <StatCard
              title="Total Sales"
              value={`Tsh ${stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              change={stats.totalSales > 0 ? '+0%' : 'N/A'}
              icon={<ShoppingCart className="text-[#805ad5]" />}
            />
            <StatCard
              title="Pending Payments"
              value={`Tsh ${stats.pendingPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              change={stats.pendingPayments > 0 ? '-0%' : 'N/A'}
              isNegative={stats.pendingPayments > 0}
              icon={<DollarSign className="text-red-500" />}
            />
          </>
        ) : (
          <>
            <StatCard title="Total Customers" value="..." change="N/A" icon={<Users className="text-[#4c8bf5]" />} />
            <StatCard title="Total Products" value="..." change="N/A" icon={<Package className="text-[#38a169]" />} />
            <StatCard title="Total Sales" value="..." change="N/A" icon={<ShoppingCart className="text-[#805ad5]" />} />
            <StatCard title="Pending Payments" value="..." change="N/A" icon={<DollarSign className="text-red-500" />} />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e2e8f0]">
          <h2 className="text-lg font-semibold text-[#2d3748] mb-4">Sales Overview</h2>
          {!loading && !error ? (
            <SalesChart data={salesData} />
          ) : (
            <p className="text-[#4a5568] text-sm text-center">
              {loading ? 'Loading sales data...' : 'Failed to load sales data'}
            </p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e2e8f0]">
          <h2 className="text-lg font-semibold text-[#2d3748] mb-4">Stock Status</h2>
          {!loading && !error ? (
            <StockStatusChart data={stockData} />
          ) : (
            <p className="text-[#4a5568] text-sm text-center">
              {loading ? 'Loading stock data...' : 'Failed to load stock data'}
            </p>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e2e8f0]">
        <h2 className="text-lg font-semibold text-[#2d3748] mb-4">Alerts</h2>
        {!loading && !error ? (
          <div className="space-y-4">
            {lowStockCount > 0 && (
              <div className="flex items-start p-4 bg-red-50 rounded-md">
                <AlertTriangle className="text-red-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800">Low Stock Alert</h3>
                  <p className="text-sm text-red-700">{`${lowStockCount} products are below minimum stock level`}</p>
                </div>
              </div>
            )}
            {expiringSoonCount > 0 && (
              <div className="flex items-start p-4 bg-yellow-50 rounded-md">
                <AlertTriangle className="text-yellow-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-yellow-800">Expiring Soon</h3>
                  <p className="text-sm text-yellow-700">{`${expiringSoonCount} products will expire within 30 days`}</p>
                </div>
              </div>
            )}
            {lowStockCount === 0 && expiringSoonCount === 0 && (
              <p className="text-[#4a5568] text-sm">No alerts at this time.</p>
            )}
          </div>
        ) : (
          <p className="text-[#4a5568] text-sm">
            {loading ? 'Loading alerts...' : 'Failed to load alerts'}
          </p>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e2e8f0]">
        <h2 className="text-lg font-semibold text-[#2d3748] mb-4">Recent Transactions</h2>
        {!loading && !error ? (
          <RecentTransactionsTable transactions={recentTransactions} />
        ) : (
          <p className="text-[#4a5568] text-sm text-center">
            {loading ? 'Loading transactions...' : 'Failed to load transactions'}
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;