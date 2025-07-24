import React from 'react';
import { Users, Package, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';
import StatCard from './StatCard';
import RecentTransactionsTable from './RecentTransactionsTable';
import StockStatusChart from './StockStatusChart';
import SalesChart from './SalesChart';
import { useTheme } from '@mui/material';

const Dashboard = () => {
  const theme = useTheme();
  return (
    <div style={{ padding: 24, background: theme.palette.background.default, minHeight: '100vh' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 24 }}>Dashboard Overview</h1>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 32 }}>
        <StatCard title="Total Customers" value="1,254" change="+12%" icon={<Users style={{ color: theme.palette.primary.main }} />} />
        <StatCard title="Total Products" value="3,872" change="+5%" icon={<Package style={{ color: theme.palette.success.main }} />} />
        <StatCard title="Total Sales" value="Tsh.24,568" change="+18%" icon={<ShoppingCart style={{ color: theme.palette.info.main }} />} />
        <StatCard title="Pending Payments" value="Tsh.3,428" change="-7%" isNegative={true} icon={<DollarSign style={{ color: theme.palette.error.main }} />} />
      </div>
      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1] }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: theme.palette.text.primary }}>Sales Overview</h2>
          <SalesChart />
        </div>
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1] }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: theme.palette.text.primary }}>Stock Status</h2>
          <StockStatusChart />
        </div>
      </div>
      {/* Alerts Section */}
      <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: theme.palette.text.primary }}>Alerts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'start', padding: 16, background: theme.palette.error.light, borderRadius: 8 }}>
            <AlertTriangle style={{ color: theme.palette.error.main, marginRight: 12 }} />
            <div>
              <h3 style={{ fontWeight: 600, color: theme.palette.error.dark }}>Low Stock Alert</h3>
              <p style={{ fontSize: 14, color: theme.palette.error.main }}>15 products are below minimum stock level</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'start', padding: 16, background: theme.palette.warning.light, borderRadius: 8 }}>
            <AlertTriangle style={{ color: theme.palette.warning.main, marginRight: 12 }} />
            <div>
              <h3 style={{ fontWeight: 600, color: theme.palette.warning.dark }}>Expiring Soon</h3>
              <p style={{ fontSize: 14, color: theme.palette.warning.main }}>23 products will expire within 30 days</p>
            </div>
          </div>
        </div>
      </div>
      {/* Recent Transactions */}
      <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1] }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: theme.palette.text.primary }}>Recent Transactions</h2>
        <RecentTransactionsTable />
      </div>
    </div>
  );
};

export default Dashboard;