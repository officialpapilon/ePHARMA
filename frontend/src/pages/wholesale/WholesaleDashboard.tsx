import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import StatusChip from '../../components/common/StatusChip/StatusChip';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  processing_orders: number;
  ready_for_delivery: number;
  delivered_orders: number;
  total_revenue: number;
  total_paid: number;
  total_outstanding: number;
  pending_payments: number;
  pending_deliveries: number;
  overdue_orders: number;
  total_customers: number;
  low_stock_items: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  customer: {
    business_name: string;
    contact_person: string;
  };
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
}

interface TopProduct {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  category: string;
}

const WholesaleDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, ordersResponse, productsResponse] = await Promise.all([
        apiCall('api/wholesale/reports/dashboard'),
        apiCall('api/wholesale/orders?per_page=5&sort_by=created_at&sort_order=desc'),
        apiCall('api/wholesale/reports/top-products')
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (ordersResponse.success) {
        setRecentOrders(ordersResponse.data);
      }

      if (productsResponse.success) {
        setTopProducts(productsResponse.data);
      }
    } catch (error) {
      showError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'warning';
      case 'confirmed': return 'info';
      case 'processing': return 'primary';
      case 'ready_for_delivery': return 'secondary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'paid': return 'success';
      case 'partial': return 'info';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner overlay message="Loading dashboard..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TrendingUpIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Wholesale Dashboard
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <OrderIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Orders
                    </Typography>
                    <Typography variant="h4">{stats.total_orders}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Revenue: {formatCurrency(stats.total_revenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PaymentIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Pending Payments
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {stats.pending_payments}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Outstanding: {formatCurrency(stats.total_outstanding)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DeliveryIcon sx={{ fontSize: 32, color: 'info.main' }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Pending Deliveries
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {stats.pending_deliveries}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Ready for delivery
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PeopleIcon sx={{ fontSize: 32, color: 'success.main' }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Customers
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.total_customers}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Active customers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Alerts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats && stats.overdue_orders > 0 && (
          <Grid item xs={12}>
            <Alert severity="warning" icon={<WarningIcon />}>
              {stats.overdue_orders} orders are overdue and require attention.
            </Alert>
          </Grid>
        )}

        {stats && stats.low_stock_items > 0 && (
          <Grid item xs={12}>
            <Alert severity="info" icon={<InventoryIcon />}>
              {stats.low_stock_items} items are running low on stock.
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Recent Orders and Top Products */}
      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Recent Orders
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => window.location.href = '/wholesale/orders'}
              >
                View All
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {order.order_number}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(order.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.customer.business_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {order.customer.contact_person}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <StatusChip status={order.status} size="small" />
                          <StatusChip status={order.payment_status} size="small" />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(order.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {recentOrders.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <OrderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  No recent orders
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Top Selling Products
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => window.location.href = '/wholesale/reports'}
              >
                View Reports
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {product.product_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={product.category} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {product.total_quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(product.total_revenue)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {topProducts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  No product data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<OrderIcon />}
              onClick={() => window.location.href = '/wholesale/pos'}
            >
              Create Order
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<PaymentIcon />}
              onClick={() => window.location.href = '/wholesale/payments'}
            >
              Process Payments
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<AssignmentIcon />}
              onClick={() => window.location.href = '/wholesale/delivery-management'}
            >
              Manage Deliveries
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<ReportIcon />}
              onClick={() => window.location.href = '/wholesale/reports'}
            >
              View Reports
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default WholesaleDashboard;