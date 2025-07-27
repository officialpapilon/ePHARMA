import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
  Description as InvoiceIcon,
} from '@mui/icons-material';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatusChip from '../../components/common/StatusChip/StatusChip';

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
}

interface WorkflowItem {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  payment_status: string;
  delivery_type: string;
  created_at: string;
  next_action: string;
}

const WholesaleDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [workflowItems, setWorkflowItems] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'deliveries'>('orders');

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, workflowResponse] = await Promise.all([
        apiCall('/wholesale/reports/dashboard'),
        apiCall('/wholesale/workflow/items')
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (workflowResponse.success) {
        setWorkflowItems(workflowResponse.data);
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

  const getWorkflowItemsByType = (type: string) => {
    return workflowItems.filter(item => {
      switch (type) {
        case 'orders':
          return ['draft', 'confirmed', 'processing'].includes(item.status);
        case 'payments':
          return ['confirmed', 'processing'].includes(item.status) &&
                 ['pending', 'partial'].includes(item.payment_status);
        case 'deliveries':
          return item.status === 'ready_for_delivery' &&
                 item.delivery_type === 'delivery';
        default:
          return false;
      }
    });
  };

  const handleAction = async (orderId: number, action: string) => {
    try {
      const response = await apiCall(`/wholesale/orders/${orderId}/${action}`, {
        method: 'POST'
      });

      if (response.success) {
        showSuccess(`Order ${action}ed successfully`);
        fetchDashboardData();
      }
    } catch (error) {
      showError(`Failed to ${action} order`);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Wholesale Dashboard
      </Typography>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Orders
                </Typography>
                <Typography variant="h4">{stats.total_orders}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Revenue: {formatCurrency(stats.total_revenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Orders
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pending_orders}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Ready for processing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Payments
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.pending_payments}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Outstanding: {formatCurrency(stats.total_outstanding)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Deliveries
                </Typography>
                <Typography variant="h4" color="info.main">
                  {stats.pending_deliveries}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Ready for delivery
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Workflow Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex' }}>
            <Button
              variant={activeTab === 'orders' ? 'contained' : 'text'}
              onClick={() => setActiveTab('orders')}
              startIcon={<OrderIcon />}
            >
              Orders ({getWorkflowItemsByType('orders').length})
            </Button>
            <Button
              variant={activeTab === 'payments' ? 'contained' : 'text'}
              onClick={() => setActiveTab('payments')}
              startIcon={<PaymentIcon />}
            >
              Payments ({getWorkflowItemsByType('payments').length})
            </Button>
            <Button
              variant={activeTab === 'deliveries' ? 'contained' : 'text'}
              onClick={() => setActiveTab('deliveries')}
              startIcon={<DeliveryIcon />}
            >
              Deliveries ({getWorkflowItemsByType('deliveries').length})
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Workflow Items */}
      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {activeTab === 'orders' && 'Orders Pending Confirmation'}
            {activeTab === 'payments' && 'Orders Pending Payment'}
            {activeTab === 'deliveries' && 'Orders Ready for Delivery'}
          </Typography>

          <List>
            {getWorkflowItemsByType(activeTab).map((item) => (
              <React.Fragment key={item.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.order_number}
                        </Typography>
                        <StatusChip status={item.status} size="small" />
                        <StatusChip status={item.payment_status} size="small" />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Customer: {item.customer_name}
                        </Typography>
                        <Typography variant="body2">
                          Amount: {formatCurrency(item.total_amount)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Next Action: {item.next_action}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small">
                        <ViewIcon />
                      </IconButton>
                      {activeTab === 'orders' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAction(item.id, 'confirm')}
                        >
                          Confirm
                        </Button>
                      )}
                      {activeTab === 'payments' && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PaymentIcon />}
                          onClick={() => handleAction(item.id, 'process-payment')}
                        >
                          Process Payment
                        </Button>
                      )}
                      {activeTab === 'deliveries' && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<DeliveryIcon />}
                          onClick={() => handleAction(item.id, 'schedule-delivery')}
                        >
                          Schedule Delivery
                        </Button>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>

          {getWorkflowItemsByType(activeTab).length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No items in this workflow stage.
            </Alert>
          )}
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ mt: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<OrderIcon />}
                onClick={() => window.location.href = '/wholesale/orders'}
              >
                Create New Order
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
                startIcon={<DeliveryIcon />}
                onClick={() => window.location.href = '/wholesale/deliveries'}
              >
                Manage Deliveries
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<ReceiptIcon />}
                onClick={() => window.location.href = '/wholesale/reports'}
              >
                View Reports
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default WholesaleDashboard;