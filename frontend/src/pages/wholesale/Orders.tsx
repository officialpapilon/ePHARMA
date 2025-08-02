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
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import StatusChip from '../../components/common/StatusChip/StatusChip';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface Order {
  id: number;
  order_number: string;
  customer: {
    business_name: string;
    contact_person: string;
  };
  status: string;
  payment_status: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  created_at: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

interface PaymentModalProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ open, order, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (order) {
      setAmount(order.balance_amount.toString());
      setDiscount('0');
    }
  }, [order]);

  const handleSubmit = async () => {
    if (!order) return;

    const amountPaid = parseFloat(amount) || 0;
    const discountAmount = parseFloat(discount) || 0;
    const totalToPay = order.balance_amount - discountAmount;

    if (amountPaid <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiCall(`/api/wholesale/orders/${order.id}/process-payment`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data: {
          amount_paid: amountPaid,
          discount_amount: discountAmount,
          payment_method: paymentMethod,
          notes: notes
        }
      });

      if (response.success) {
        showSuccess('Payment processed successfully');
        onSuccess();
        onClose();
      } else {
        showError(response.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showError('Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  const balanceAmount = order.balance_amount;
  const discountAmount = parseFloat(discount) || 0;
  const amountToPay = balanceAmount - discountAmount;
  const amountPaid = parseFloat(amount) || 0;
  const remainingBalance = amountToPay - amountPaid;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Process Payment - {order.order_number}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Order Summary</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Total Amount:</Typography>
              <Typography variant="h6">{formatCurrency(order.total_amount)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Balance Due:</Typography>
              <Typography variant="h6" color="error">{formatCurrency(balanceAmount)}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Discount Amount"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              InputProps={{
                startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>TZS</Typography>,
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Amount to Pay"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>TZS</Typography>,
              }}
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
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">Payment Summary:</Typography>
          <Typography variant="body2">Amount to Pay: {formatCurrency(amountToPay)}</Typography>
          <Typography variant="body2">Amount Paid: {formatCurrency(amountPaid)}</Typography>
          <Typography variant="body2" color={remainingBalance > 0 ? 'error' : 'success'}>
            Remaining Balance: {formatCurrency(remainingBalance)}
          </Typography>
          {remainingBalance > 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              This will be marked as a partial payment. Remaining balance: {formatCurrency(remainingBalance)}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || amountPaid <= 0}
        >
          {submitting ? 'Processing...' : 'Process Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface OrderDetailsModalProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ open, order, onClose, onPaymentSuccess }) => {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  if (!order) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Order Details - {order.order_number}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Customer Information</Typography>
            <Typography variant="body2"><strong>Business:</strong> {order.customer.business_name}</Typography>
            <Typography variant="body2"><strong>Contact:</strong> {order.customer.contact_person}</Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Order Summary</Typography>
            <Typography variant="body2"><strong>Total Amount:</strong> {formatCurrency(order.total_amount)}</Typography>
            <Typography variant="body2"><strong>Paid Amount:</strong> {formatCurrency(order.paid_amount)}</Typography>
            <Typography variant="body2"><strong>Balance:</strong> {formatCurrency(order.balance_amount)}</Typography>
            <Typography variant="body2"><strong>Status:</strong> <StatusChip status={order.status} /></Typography>
            <Typography variant="body2"><strong>Payment Status:</strong> <StatusChip status={order.payment_status} /></Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Order Items</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell align="right">{item.quantity_ordered}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {order.payment_status === 'partial' && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setPaymentModalOpen(true)}
          >
            Complete Payment
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
      
      <PaymentModal
        open={paymentModalOpen}
        order={order}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          onPaymentSuccess();
          setPaymentModalOpen(false);
          onClose();
        }}
      />
    </Dialog>
  );
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/wholesale/orders');
      
      if (response.success) {
        setOrders(response.data || []);
      } else {
        console.error('Failed to fetch orders:', response.message);
      }
    } catch (error) {
      console.error('Orders fetch error:', error);
      showError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleProcessPayment = (order: Order) => {
    setSelectedOrder(order);
    setPaymentModalOpen(true);
  };

  const handleScheduleDelivery = async (order: Order) => {
    try {
      const response = await apiCall(`/api/wholesale/orders/${order.id}/schedule-delivery`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.success) {
        showSuccess('Delivery scheduled successfully');
        fetchOrders();
      } else {
        showError(response.message || 'Failed to schedule delivery');
      }
    } catch (error) {
      console.error('Schedule delivery error:', error);
      showError('Failed to schedule delivery');
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailsModalOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return order.status !== 'delivered';
    return order.status === statusFilter && order.status !== 'delivered';
  });

  if (loading) {
    return <LoadingSpinner overlay message="Loading orders..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Process Orders
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filter by Status"
            >
              <MenuItem value="all">All Orders</MenuItem>
              <MenuItem value="pending_payment">Pending Payment</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="ready_for_delivery">Ready for Delivery</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell align="right">Paid Amount</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
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
                    <StatusChip status={order.status} />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={order.payment_status} />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(order.total_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(order.paid_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="error">
                      {formatCurrency(order.balance_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => handleViewDetails(order)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {order.payment_status === 'pending' && (
                        <Tooltip title="Process Payment">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleProcessPayment(order)}
                          >
                            <PaymentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {order.status === 'confirmed' && order.payment_status === 'paid' && (
                        <Tooltip title="Schedule Delivery">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleScheduleDelivery(order)}
                          >
                            <DeliveryIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredOrders.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="textSecondary">
              No orders found
            </Typography>
          </Box>
        )}
      </Paper>

      <PaymentModal
        open={paymentModalOpen}
        order={selectedOrder}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedOrder(null);
        }}
        onSuccess={fetchOrders}
      />

      <OrderDetailsModal
        open={orderDetailsModalOpen}
        order={selectedOrder}
        onClose={() => {
          setOrderDetailsModalOpen(false);
          setSelectedOrder(null);
        }}
        onPaymentSuccess={fetchOrders}
      />
    </Box>
  );
};

export default Orders; 