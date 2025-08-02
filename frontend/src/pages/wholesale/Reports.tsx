import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  People as PeopleIcon,
  Download as DownloadIcon,
  DateRange as DateRangeIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState('7_days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportsData, setReportsData] = useState<any>({});
  const [debtClearingModal, setDebtClearingModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
  const [debtAmount, setDebtAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [debtNotes, setDebtNotes] = useState('');

  const { apiCall } = useApiCall();
  const { showError, showSuccess } = useNotification();

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange === 'custom') {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        params.append('date_range', dateRange);
      }

      const response = await apiCall(`/api/wholesale/reports?${params.toString()}`);
      
      if (response.success) {
        setReportsData(response.data);
      } else {
        showError(response.message || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Reports fetch error:', error);
      showError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [dateRange, startDate, endDate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExportReport = (reportType: string) => {
    // TODO: Implement export functionality
    console.log(`Exporting ${reportType} report`);
  };

  const handleClearDebt = (debtor: any) => {
    setSelectedDebtor(debtor);
    setDebtAmount(debtor.current_balance.toString());
    setDebtClearingModal(true);
  };

  const handleClearDebtSubmit = async () => {
    try {
      const response = await apiCall(`/api/wholesale/customers/${selectedDebtor.id}/clear-debt`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data: {
          amount: parseFloat(debtAmount),
          payment_method: paymentMethod,
          notes: debtNotes
        }
      });

      if (response.success) {
        showSuccess('Debt cleared successfully!');
        setDebtClearingModal(false);
        setSelectedDebtor(null);
        setDebtAmount('');
        setPaymentMethod('cash');
        setDebtNotes('');
        fetchReportsData(); // Refresh data
      } else {
        showError(response.message || 'Failed to clear debt');
      }
    } catch (error) {
      console.error('Clear debt error:', error);
      showError('Failed to clear debt');
    }
  };

  if (loading) {
    return <LoadingSpinner overlay message="Loading reports..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Wholesale Reports
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small">
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              label="Date Range"
            >
              <MenuItem value="7_days">Last 7 Days</MenuItem>
              <MenuItem value="30_days">Last 30 Days</MenuItem>
              <MenuItem value="90_days">Last 90 Days</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>
          
          {dateRange === 'custom' && (
            <>
              <TextField
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
              />
              <TextField
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
              />
            </>
          )}
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportReport('all')}
          >
            Export All
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="reports tabs">
          <Tab label="Revenue Report" />
          <Tab label="Orders Report" />
          <Tab label="Customers Report" />
          <Tab label="Debtors Report" />
          <Tab label="Deliveries Report" />
        </Tabs>

        {/* Revenue Report */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(reportsData.total_revenue || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success">
                    Collected Revenue
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(reportsData.collected_revenue || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning">
                    Pending Revenue
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(reportsData.pending_revenue || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S/N</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Total Amount</TableCell>
                  <TableCell align="right">Paid Amount</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(reportsData.revenue_details || []).map((order: any, index: number) => (
                  <TableRow key={order.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>{order.customer?.business_name}</TableCell>
                    <TableCell align="right">{formatCurrency(order.total_amount)}</TableCell>
                    <TableCell align="right">{formatCurrency(order.paid_amount)}</TableCell>
                    <TableCell align="right">{formatCurrency(order.balance_amount)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.payment_status} 
                        color={order.payment_status === 'paid' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Orders Report */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    Total Orders
                  </Typography>
                  <Typography variant="h4">
                    {reportsData.total_orders || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success">
                    Completed
                  </Typography>
                  <Typography variant="h4">
                    {reportsData.completed_orders || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning">
                    Pending
                  </Typography>
                  <Typography variant="h4">
                    {reportsData.pending_orders || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error">
                    Cancelled
                  </Typography>
                  <Typography variant="h4">
                    {reportsData.cancelled_orders || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S/N</TableCell>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Total Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(reportsData.orders_details || []).map((order: any, index: number) => (
                  <TableRow key={order.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>{order.customer?.business_name}</TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell align="right">{formatCurrency(order.total_amount)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status} 
                        color={order.status === 'delivered' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.payment_status} 
                        color={order.payment_status === 'paid' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Customers Report */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    Total Customers
                  </Typography>
                  <Typography variant="h4">
                    {reportsData.total_customers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success">
                    Active Customers
                  </Typography>
                  <Typography variant="h4">
                    {reportsData.active_customers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning">
                    New Customers
                  </Typography>
                  <Typography variant="h4">
                    {reportsData.new_customers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S/N</TableCell>
                  <TableCell>Customer Code</TableCell>
                  <TableCell>Business Name</TableCell>
                  <TableCell>Contact Person</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Credit Limit</TableCell>
                  <TableCell align="right">Current Balance</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(reportsData.customers_details || []).map((customer: any, index: number) => (
                  <TableRow key={customer.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{customer.customer_code}</TableCell>
                    <TableCell>{customer.business_name}</TableCell>
                    <TableCell>{customer.contact_person}</TableCell>
                    <TableCell>{customer.customer_type}</TableCell>
                    <TableCell align="right">{formatCurrency(customer.credit_limit)}</TableCell>
                    <TableCell align="right">{formatCurrency(customer.current_balance)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.status} 
                        color={customer.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Debtors Report */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error">
                    Total Debt
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(reportsData.total_debt || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning">
                    Debtors Count
                  </Typography>
                  <Typography variant="h4">
                    {reportsData.debtors_count || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info">
                    Average Debt
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(reportsData.average_debt || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S/N</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact Person</TableCell>
                  <TableCell align="right">Credit Limit</TableCell>
                  <TableCell align="right">Current Balance</TableCell>
                  <TableCell align="right">Available Credit</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(reportsData.debtors_details || []).map((customer: any, index: number) => (
                  <TableRow key={customer.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{customer.business_name}</TableCell>
                    <TableCell>{customer.contact_person}</TableCell>
                    <TableCell align="right">{formatCurrency(customer.credit_limit)}</TableCell>
                    <TableCell align="right">{formatCurrency(customer.current_balance)}</TableCell>
                    <TableCell align="right">{formatCurrency(customer.credit_limit - customer.current_balance)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.current_balance > 0 ? 'In Debt' : 'Good Standing'} 
                        color={customer.current_balance > 0 ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {customer.current_balance > 0 && (
                        <Tooltip title="Clear Debt">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleClearDebt(customer)}
                          >
                            <PaymentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Deliveries Report */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    Total Deliveries
                  </Typography>
                  <Typography variant="h4">
                    {reportsData.total_deliveries || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success">
                    Completed
                  </Typography>
                  <Typography variant="h4">
                    {reportsData.completed_deliveries || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning">
                    Scheduled
                  </Typography>
                  <Typography variant="h4">
                    {reportsData.scheduled_deliveries || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info">
                    In Transit
                  </Typography>
                  <Typography variant="h4">
                    {reportsData.in_transit_deliveries || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S/N</TableCell>
                  <TableCell>Delivery Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Scheduled Date</TableCell>
                  <TableCell>Driver</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(reportsData.deliveries_details || []).map((delivery: any, index: number) => (
                  <TableRow key={delivery.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{delivery.delivery_number}</TableCell>
                    <TableCell>{delivery.customer?.business_name}</TableCell>
                    <TableCell>{delivery.order?.order_number}</TableCell>
                    <TableCell>
                      <Chip 
                        label={delivery.status} 
                        color={delivery.status === 'delivered' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(delivery.scheduled_date)}</TableCell>
                    <TableCell>{delivery.driver_name || 'Not assigned'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Clear Debt Modal */}
      <Dialog open={debtClearingModal} onClose={() => setDebtClearingModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Clear Customer Debt</DialogTitle>
        <DialogContent>
          {selectedDebtor && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{selectedDebtor.business_name}</Typography>
              <Typography variant="body2" color="textSecondary">
                Contact: {selectedDebtor.contact_person}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Current Balance: {formatCurrency(selectedDebtor.current_balance)}
              </Typography>
            </Box>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount to Clear"
                type="number"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Payment Method"
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="mobile_money">Mobile Money</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="credit_card">Credit Card</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={debtNotes}
                onChange={(e) => setDebtNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDebtClearingModal(false)}>Cancel</Button>
          <Button onClick={handleClearDebtSubmit} variant="contained" color="primary">
            Clear Debt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports; 