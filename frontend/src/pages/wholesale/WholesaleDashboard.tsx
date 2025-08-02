import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  completed_orders: number;
  total_customers: number;
  overdue_orders: number;
  low_stock_items: number;
  weekly_stats: {
    dates: string[];
    orders: number[];
    revenue: number[];
  };
}

const WholesaleDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  const { apiCall } = useApiCall();
  const { showError } = useNotification();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, ordersResponse] = await Promise.all([
        apiCall('/api/wholesale/dashboard'),
        apiCall('/api/wholesale/orders?per_page=5')
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (ordersResponse.success) {
        setRecentOrders(ordersResponse.data || []);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      showError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const chartData = {
    labels: stats?.weekly_stats?.dates || [],
    datasets: [
      {
        label: 'Orders',
        data: stats?.weekly_stats?.orders || [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Revenue (TZS)',
        data: stats?.weekly_stats?.revenue || [],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Weekly Operations (Last 7 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return <LoadingSpinner overlay message="Loading dashboard..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Wholesale Dashboard
      </Typography>

      {/* Alerts */}
      {stats && stats.overdue_orders > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
          {stats.overdue_orders} orders are overdue and require attention.
        </Alert>
      )}

      {stats && stats.low_stock_items > 0 && (
        <Alert severity="info" icon={<InventoryIcon />} sx={{ mb: 2 }}>
          {stats.low_stock_items} items are running low on stock.
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{stats?.total_orders || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{formatCurrency(stats?.total_revenue || 0)}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalShippingIcon color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{stats?.pending_orders || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="secondary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{stats?.total_customers || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Customers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Bar data={chartData} options={chartOptions} />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Orders
            </Typography>
            {recentOrders.length > 0 ? (
              recentOrders.map((order: any, index: number) => (
                <Box key={order.id} sx={{ mb: 2, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="subtitle2">{order.order_number}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {order.customer?.business_name} - {formatCurrency(order.total_amount)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(order.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No recent orders
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WholesaleDashboard; 