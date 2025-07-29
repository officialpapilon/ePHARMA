import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import StatusChip from '../../components/common/StatusChip/StatusChip';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ReportData {
  orders: Array<{
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
  }>;
  payments: Array<{
    id: number;
    payment_number: string;
    order: {
      order_number: string;
    };
    customer: {
      business_name: string;
    };
    amount: number;
    payment_type: string;
    status: string;
    payment_date: string;
  }>;
  deliveries: Array<{
    id: number;
    delivery_number: string;
    order: {
      order_number: string;
    };
    customer: {
      business_name: string;
    };
    status: string;
    delivery_date: string;
    actual_delivery_date: string;
  }>;
  summary: {
    total_orders: number;
    total_revenue: number;
    total_payments: number;
    total_deliveries: number;
    average_order_value: number;
    top_customers: Array<{
      customer_name: string;
      total_orders: number;
      total_revenue: number;
    }>;
  };
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('orders');
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [statusFilter, setStatusFilter] = useState('');

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        report_type: reportType,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await apiCall(`api/wholesale/reports/${reportType}?${params}`);
      
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      showError('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange, statusFilter]);

  const handleExportReport = () => {
    // Generate CSV content
    let csvContent = '';
    
    if (reportData) {
      switch (reportType) {
        case 'orders':
          csvContent = 'Order Number,Customer,Status,Payment Status,Amount,Date\n';
          reportData.orders.forEach(order => {
            csvContent += `${order.order_number},${order.customer.business_name},${order.status},${order.payment_status},${order.total_amount},${formatDate(order.created_at)}\n`;
          });
          break;
        case 'payments':
          csvContent = 'Payment Number,Order Number,Customer,Amount,Type,Status,Date\n';
          reportData.payments.forEach(payment => {
            csvContent += `${payment.payment_number},${payment.order.order_number},${payment.customer.business_name},${payment.amount},${payment.payment_type},${payment.status},${formatDate(payment.payment_date)}\n`;
          });
          break;
        case 'deliveries':
          csvContent = 'Delivery Number,Order Number,Customer,Status,Expected Date,Actual Date\n';
          reportData.deliveries.forEach(delivery => {
            csvContent += `${delivery.delivery_number},${delivery.order.order_number},${delivery.customer.business_name},${delivery.status},${formatDate(delivery.delivery_date)},${formatDate(delivery.actual_delivery_date)}\n`;
          });
          break;
      }
    }

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${dateRange.start_date}_to_${dateRange.end_date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSuccess('Report exported successfully');
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'orders': return <TrendingUpIcon />;
      case 'payments': return <PaymentIcon />;
      case 'deliveries': return <DeliveryIcon />;
      default: return <ReportIcon />;
    }
  };

  const getReportTitle = (type: string) => {
    switch (type) {
      case 'orders': return 'Orders Report';
      case 'payments': return 'Payments Report';
      case 'deliveries': return 'Deliveries Report';
      default: return 'Report';
    }
  };

  if (loading) {
    return <LoadingSpinner overlay message="Generating report..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ReportIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Wholesale Reports
        </Typography>
      </Box>

      {/* Report Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Report Type"
              >
                <MenuItem value="orders">Orders Report</MenuItem>
                <MenuItem value="payments">Payments Report</MenuItem>
                <MenuItem value="deliveries">Deliveries Report</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status Filter"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={fetchReportData}
                startIcon={<ViewIcon />}
              >
                Generate Report
              </Button>
              <Button
                variant="outlined"
                onClick={handleExportReport}
                startIcon={<DownloadIcon />}
                disabled={!reportData}
              >
                Export
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Report Summary */}
      {reportData?.summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {getReportIcon(reportType)}
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total {reportType}
                    </Typography>
                    <Typography variant="h4">
                      {reportData.summary[`total_${reportType}` as keyof typeof reportData.summary] || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main' }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {formatCurrency(reportData.summary.total_revenue)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PeopleIcon sx={{ fontSize: 32, color: 'info.main' }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Average Order Value
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {formatCurrency(reportData.summary.average_order_value)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <InventoryIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Top Customers
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {reportData.summary.top_customers?.length || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Report Data Table */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            {getReportTitle(reportType)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {reportData?.orders?.length || reportData?.payments?.length || reportData?.deliveries?.length || 0} records
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {reportType === 'orders' && (
                  <>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment Status</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </>
                )}
                {reportType === 'payments' && (
                  <>
                    <TableCell>Payment Number</TableCell>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </>
                )}
                {reportType === 'deliveries' && (
                  <>
                    <TableCell>Delivery Number</TableCell>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Expected Date</TableCell>
                    <TableCell>Actual Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {reportType === 'orders' && reportData?.orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {order.order_number}
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
                    <StatusChip status={order.status} size="small" />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={order.payment_status} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(order.total_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(order.created_at)}
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

              {reportType === 'payments' && reportData?.payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {payment.payment_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {payment.order.order_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {payment.customer.business_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(payment.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={payment.payment_type} size="small" />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={payment.status} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(payment.payment_date)}
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

              {reportType === 'deliveries' && reportData?.deliveries?.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {delivery.delivery_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {delivery.order.order_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {delivery.customer.business_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={delivery.status} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(delivery.delivery_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(delivery.actual_delivery_date)}
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

        {(!reportData?.orders?.length && !reportData?.payments?.length && !reportData?.deliveries?.length) && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No data available
            </Typography>
            <Typography variant="body2" color="textSecondary">
              No records found for the selected criteria
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Reports; 