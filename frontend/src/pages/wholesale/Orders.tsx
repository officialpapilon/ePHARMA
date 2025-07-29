import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  Fab,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ConfirmIcon,
  Cancel as CancelIcon,
  LocalShipping as DeliveryIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import Modal from '../../components/common/Modal/Modal';
import StatusChip from '../../components/common/StatusChip/StatusChip';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { API_BASE_URL } from '../../../constants';

interface WholesaleOrder {
  id: number;
  order_number: string;
  invoice_number: string;
  customer: {
    id: number;
    business_name: string;
    contact_person: string;
    phone: string;
  };
  order_date: string;
  delivery_date: string;
  status: 'draft' | 'confirmed' | 'processing' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue' | 'pay_later';
  payment_terms: 'pay_now' | 'pay_later' | 'partial_payment';
  delivery_type: 'delivery' | 'pickup';
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  items_count: number;
  is_payment_processed: boolean;
  is_delivery_scheduled: boolean;
  delivery_address?: string;
  delivery_contact_person?: string;
  delivery_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

interface OrderSummary {
  total_orders: number;
  total_revenue: number;
  total_paid: number;
  total_outstanding: number;
  orders_by_status: Array<{ status: string; count: number }>;
  orders_by_payment_status: Array<{ payment_status: string; count: number }>;
  overdue_orders: number;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<WholesaleOrder | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'delete' | 'confirm' | 'cancel' | 'create'>('view');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Order creation form state
  const [orderForm, setOrderForm] = useState({
    customer_id: '',
    payment_terms: 'pay_now' as 'pay_now' | 'pay_later' | 'partial_payment',
    delivery_type: 'delivery' as 'delivery' | 'pickup',
    delivery_address: '',
    delivery_contact_person: '',
    delivery_contact_phone: '',
    expected_delivery_date: null as Date | null,
    notes: '',
    delivery_instructions: '',
  });

  const [customers, setCustomers] = useState<Array<{id: number; business_name: string; contact_person: string}>>([]);
  const [products, setProducts] = useState<Array<{id: number; name: string; description: string; price: number}>>([]);
  const [selectedProducts, setSelectedProducts] = useState<Array<{id: number; name: string; price: number; quantity: number; total: number}>>([]);

  const { apiCall } = useApiCall();
  const { showNotification } = useNotification();

  // Fetch customers and products for order creation
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await apiCall('api/wholesale/customers');
        if (response.success) {
          setCustomers(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await apiCall('api/wholesale/products');
        if (response.success) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        per_page: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(paymentStatusFilter && { payment_status: paymentStatusFilter }),
        ...(startDate && { start_date: startDate.toISOString().split('T')[0] }),
        ...(endDate && { end_date: endDate.toISOString().split('T')[0] }),
      });

      const response = await apiCall(`api/wholesale/orders?${params}`);
      if (response.success) {
        setOrders(response.data);
        setTotal(response.meta.total);
        setSummary(response.summary);
      }
    } catch (error) {
      showNotification.showError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, searchTerm, statusFilter, paymentStatusFilter, startDate, endDate]);

  const handleStatusAction = async (orderId: number, action: string) => {
    try {
      const response = await apiCall(`api/wholesale/orders/${orderId}/${action}`, {
        method: 'POST',
      });

      if (response.success) {
        showNotification.showSuccess(`Order ${action}ed successfully`);
        fetchOrders();
        setOpenModal(false);
      }
    } catch (error) {
      showNotification.showError(`Failed to ${action} order`);
    }
  };

  const handleDelete = async (orderId: number) => {
    try {
      const response = await apiCall(`api/wholesale/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        showNotification.showSuccess('Order deleted successfully');
        fetchOrders();
        setOpenModal(false);
      }
    } catch (error) {
      showNotification.showError('Failed to delete order');
    }
  };

  const handleUpdateDeliveryInfo = async (orderId: number, deliveryData: any) => {
    try {
      const response = await apiCall(`api/wholesale/orders/${orderId}`, {
        method: 'PUT',
        data: deliveryData
      });

      if (response.success) {
        showNotification.showSuccess('Delivery information updated successfully');
        fetchOrders();
        setOpenModal(false);
      }
    } catch (error) {
      showNotification.showError('Failed to update delivery information');
    }
  };

  const handleCreateOrder = async () => {
    try {
      const orderData = {
        customer_id: orderForm.customer_id,
        payment_terms: orderForm.payment_terms,
        delivery_type: orderForm.delivery_type,
        delivery_address: orderForm.delivery_type === 'delivery' ? orderForm.delivery_address : null,
        delivery_contact_person: orderForm.delivery_type === 'delivery' ? orderForm.delivery_contact_person : null,
        delivery_contact_phone: orderForm.delivery_type === 'delivery' ? orderForm.delivery_contact_phone : null,
        expected_delivery_date: orderForm.expected_delivery_date?.toISOString().split('T')[0],
        notes: orderForm.notes,
        delivery_instructions: orderForm.delivery_instructions,
        items: selectedProducts.map(product => ({
          product_id: product.id,
          quantity: product.quantity,
          unit_price: product.price,
          total_price: product.total
        }))
      };

      const response = await apiCall('api/wholesale/orders', {
        method: 'POST',
        data: orderData
      });

      if (response.success) {
        showNotification.showSuccess('Order created successfully');
        setOpenModal(false);
        setOrderForm({
          customer_id: '',
          payment_terms: 'pay_now',
          delivery_type: 'delivery',
          delivery_address: '',
          delivery_contact_person: '',
          delivery_contact_phone: '',
          expected_delivery_date: null,
          notes: '',
          delivery_instructions: '',
        });
        setSelectedProducts([]);
        fetchOrders();
      }
    } catch (error) {
      showNotification.showError('Failed to create order');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'primary',
      ready: 'secondary',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      pending: 'warning',
      partial: 'info',
      paid: 'success',
      overdue: 'error',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setStartDate(null);
    setEndDate(null);
    setPage(0);
  };

  if (loading && orders.length === 0) {
    return <LoadingSpinner overlay message="Loading orders..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Wholesale Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setModalType('create');
            setSelectedOrder(null);
            setOpenModal(true);
          }}
        >
          New Order
        </Button>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Orders
                </Typography>
                <Typography variant="h4">{summary.total_orders}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4">{formatCurrency(summary.total_revenue)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Paid
                </Typography>
                <Typography variant="h4">{formatCurrency(summary.total_paid)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Outstanding
                </Typography>
                <Typography variant="h4" color="error">
                  {formatCurrency(summary.total_outstanding)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ minWidth: 300 }}
          />
          <Button
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'contained' : 'outlined'}
          >
            Filters
          </Button>
          <Button startIcon={<RefreshIcon />} onClick={clearFilters}>
            Clear
          </Button>
        </Box>

        {showFilters && (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="ready">Ready</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    label="Payment Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="partial">Partial</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        )}
      </Paper>

      {/* Orders Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Delivery Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {order.order_number}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {order.invoice_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {order.customer.business_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {order.customer.contact_person}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell>{formatDate(order.delivery_date)}</TableCell>
                  <TableCell>
                    <StatusChip
                      status={order.status}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      status={order.payment_status}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {formatCurrency(order.total_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="subtitle2"
                      color={order.balance_amount > 0 ? 'error' : 'success'}
                    >
                      {formatCurrency(order.balance_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedOrder(order);
                            setModalType('view');
                            setOpenModal(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Order">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedOrder(order);
                            setModalType('edit');
                            setOpenModal(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {order.payment_status === 'paid' && !order.delivery_address && (
                        <Tooltip title="Fill Delivery Info">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => {
                              setSelectedOrder(order);
                              setModalType('edit');
                              setOpenModal(true);
                            }}
                          >
                            <DeliveryIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {order.status === 'pending' && (
                        <>
                          <Tooltip title="Confirm Order">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                setSelectedOrder(order);
                                setModalType('confirm');
                                setOpenModal(true);
                              }}
                            >
                              <ConfirmIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel Order">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedOrder(order);
                                setModalType('cancel');
                                setOpenModal(true);
                              }}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete Order">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedOrder(order);
                            setModalType('delete');
                            setOpenModal(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      {/* Confirmation Dialogs */}
      <Dialog open={openModal && modalType === 'confirm'} onClose={() => setOpenModal(false)}>
        <DialogTitle>Confirm Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to confirm order <strong>{selectedOrder?.order_number}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button
            onClick={() => selectedOrder && handleStatusAction(selectedOrder.id, 'confirm')}
            variant="contained"
            color="success"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openModal && modalType === 'cancel'} onClose={() => setOpenModal(false)}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel order <strong>{selectedOrder?.order_number}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>No</Button>
          <Button
            onClick={() => selectedOrder && handleStatusAction(selectedOrder.id, 'cancel')}
            variant="contained"
            color="error"
          >
            Cancel Order
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openModal && modalType === 'delete'} onClose={() => setOpenModal(false)}>
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete order <strong>{selectedOrder?.order_number}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button
            onClick={() => selectedOrder && handleDelete(selectedOrder.id)}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Modal */}
      <Modal
        open={openModal && modalType === 'view'}
        onClose={() => setOpenModal(false)}
        title={`Order Details - ${selectedOrder?.order_number}`}
        maxWidth="md"
      >
        {selectedOrder && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Order Information
                </Typography>
                <Typography><strong>Order Number:</strong> {selectedOrder.order_number}</Typography>
                <Typography><strong>Invoice Number:</strong> {selectedOrder.invoice_number}</Typography>
                <Typography><strong>Order Date:</strong> {formatDate(selectedOrder.order_date)}</Typography>
                <Typography><strong>Delivery Date:</strong> {formatDate(selectedOrder.delivery_date)}</Typography>
                <Typography><strong>Status:</strong> 
                  <StatusChip
                    status={selectedOrder.status}
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                <Typography><strong>Business Name:</strong> {selectedOrder.customer.business_name}</Typography>
                <Typography><strong>Contact Person:</strong> {selectedOrder.customer.contact_person}</Typography>
                <Typography><strong>Phone:</strong> {selectedOrder.customer.phone}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Financial Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography><strong>Total Amount:</strong> {formatCurrency(selectedOrder.total_amount)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography><strong>Paid Amount:</strong> {formatCurrency(selectedOrder.paid_amount)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography color="error">
                      <strong>Balance:</strong> {formatCurrency(selectedOrder.balance_amount)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}
      </Modal>

      {/* Order Creation Modal */}
      <Modal
        open={openModal && modalType === 'create'}
        onClose={() => setOpenModal(false)}
        title="Create New Wholesale Order"
        maxWidth="lg"
      >
        <Box sx={{ p: 2 }}>
          <Grid container spacing={3}>
            {/* Customer Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={orderForm.customer_id}
                  onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })}
                  label="Customer"
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.business_name} - {customer.contact_person}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Payment Terms */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Terms</InputLabel>
                <Select
                  value={orderForm.payment_terms}
                  onChange={(e) => setOrderForm({ ...orderForm, payment_terms: e.target.value })}
                  label="Payment Terms"
                >
                  <MenuItem value="pay_now">Pay Now</MenuItem>
                  <MenuItem value="pay_later">Pay Later (Debt)</MenuItem>
                  <MenuItem value="partial_payment">Partial Payment</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Delivery Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Delivery Type</InputLabel>
                <Select
                  value={orderForm.delivery_type}
                  onChange={(e) => setOrderForm({ ...orderForm, delivery_type: e.target.value })}
                  label="Delivery Type"
                >
                  <MenuItem value="delivery">Delivery</MenuItem>
                  <MenuItem value="pickup">Customer Pickup</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Expected Delivery Date */}
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Expected Delivery Date"
                  value={orderForm.expected_delivery_date}
                  onChange={(date) => setOrderForm({ ...orderForm, expected_delivery_date: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Delivery Address (if delivery type) */}
            {orderForm.delivery_type === 'delivery' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Delivery Address"
                    value={orderForm.delivery_address}
                    onChange={(e) => setOrderForm({ ...orderForm, delivery_address: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Delivery Contact Person"
                    value={orderForm.delivery_contact_person}
                    onChange={(e) => setOrderForm({ ...orderForm, delivery_contact_person: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Delivery Contact Phone"
                    value={orderForm.delivery_contact_phone}
                    onChange={(e) => setOrderForm({ ...orderForm, delivery_contact_phone: e.target.value })}
                  />
                </Grid>
              </>
            )}

            {/* Product Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                <Grid container spacing={2}>
                  {products.map((product) => (
                    <Grid item xs={12} key={product.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Grid container alignItems="center" spacing={2}>
                            <Grid item xs={8}>
                              <Typography variant="subtitle1">{product.name}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                {product.description}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                Price: {formatCurrency(product.price)}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <TextField
                                type="number"
                                label="Quantity"
                                value={selectedProducts.find(p => p.id === product.id)?.quantity || 0}
                                onChange={(e) => {
                                  const quantity = parseInt(e.target.value) || 0;
                                  if (quantity > 0) {
                                    setSelectedProducts(prev => 
                                      prev.filter(p => p.id !== product.id).concat({
                                        ...product,
                                        quantity,
                                        total: product.price * quantity
                                      })
                                    );
                                  } else {
                                    setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
                                  }
                                }}
                                InputProps={{ inputProps: { min: 0 } }}
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* Order Summary */}
            {selectedProducts.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Order Summary
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Product</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>{product.name}</TableCell>
                              <TableCell align="right">{formatCurrency(product.price)}</TableCell>
                              <TableCell align="right">{product.quantity}</TableCell>
                              <TableCell align="right">{formatCurrency(product.total)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} align="right">
                              <Typography variant="subtitle1" fontWeight="bold">
                                Total:
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle1" fontWeight="bold">
                                {formatCurrency(selectedProducts.reduce((sum, p) => sum + p.total, 0))}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Order Notes"
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>

            {orderForm.delivery_type === 'delivery' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Delivery Instructions"
                  value={orderForm.delivery_instructions}
                  onChange={(e) => setOrderForm({ ...orderForm, delivery_instructions: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            )}
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateOrder}
              disabled={!orderForm.customer_id || selectedProducts.length === 0}
            >
              Create Order
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Orders; 