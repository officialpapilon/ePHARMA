import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  PlayArrow as ProcessIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import StatusChip from '../../components/common/StatusChip/StatusChip';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface WorkflowOrder {
  id: number;
  order_number: string;
  customer: {
    id: number;
    business_name: string;
    contact_person: string;
    phone: string;
  };
  status: string;
  payment_status: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  delivery_address?: string;
  delivery_contact_person?: string;
  delivery_contact_phone?: string;
  created_at: string;
  items: Array<{
    id: number;
    product_name: string;
    quantity_ordered: number;
    unit_price: number;
    total: number;
  }>;
  payment?: {
    id: number;
    payment_number: string;
    status: string;
    amount: number;
    payment_type: string;
  };
  delivery?: {
    id: number;
    delivery_number: string;
    status: string;
    delivery_date: string;
  };
}

interface WorkflowStep {
  label: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'error';
  action?: string;
}

const Workflow: React.FC = () => {
  const [orders, setOrders] = useState<WorkflowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<WorkflowOrder | null>(null);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [openFulfillmentModal, setOpenFulfillmentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_method: 'cash',
    amount: 0,
    reference_number: '',
    notes: '',
  });
  const [fulfillmentData, setFulfillmentData] = useState({
    delivery_address: '',
    contact_person: '',
    contact_phone: '',
    delivery_fee: 0,
    expected_delivery_date: '',
    delivery_instructions: '',
    notes: '',
  });

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  const fetchWorkflowOrders = async () => {
    try {
      setLoading(true);
      const response = await apiCall('api/wholesale/orders?status=pending_payment,confirmed,ready_for_delivery');
      
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      showError('Failed to fetch workflow orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflowOrders();
  }, []);

  const getWorkflowSteps = (order: WorkflowOrder): WorkflowStep[] => {
    return [
      {
        label: 'Order Created',
        description: 'Order created at POS',
        icon: <OrderIcon />,
        status: 'completed',
      },
      {
        label: 'Payment Processing',
        description: 'Payment being processed',
        icon: <PaymentIcon />,
        status: order.status === 'pending_payment' ? 'active' : 
                order.payment_status === 'paid' ? 'completed' : 'pending',
        action: order.status === 'pending_payment' ? 'Process Payment' : undefined,
      },
      {
        label: 'Order Fulfillment',
        description: 'Capture delivery details',
        icon: <DeliveryIcon />,
        status: order.status === 'confirmed' ? 'active' : 
                order.status === 'ready_for_delivery' ? 'completed' : 'pending',
        action: order.status === 'confirmed' ? 'Capture Delivery Details' : undefined,
      },
      {
        label: 'Delivery Management',
        description: 'Track and approve delivery',
        icon: <CompletedIcon />,
        status: order.delivery ? 'active' : 'pending',
        action: order.delivery ? 'Approve Delivery' : undefined,
      },
    ];
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder) return;
    
    try {
      const response = await apiCall(`api/wholesale/orders/${selectedOrder.id}/process-payment`, {
        method: 'POST',
        data: paymentData,
      });

      if (response.success) {
        showSuccess('Payment processed successfully');
        setOpenPaymentModal(false);
        fetchWorkflowOrders();
      }
    } catch (error) {
      showError('Failed to process payment');
    }
  };

  const handleFulfillOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      const response = await apiCall(`api/wholesale/orders/${selectedOrder.id}/fulfill`, {
        method: 'POST',
        data: fulfillmentData,
      });

      if (response.success) {
        showSuccess('Order fulfilled successfully');
        setOpenFulfillmentModal(false);
        fetchWorkflowOrders();
      }
    } catch (error) {
      showError('Failed to fulfill order');
    }
  };

  const handleApproveDelivery = async (deliveryId: number) => {
    try {
      const response = await apiCall(`api/wholesale/deliveries/${deliveryId}/approve`, {
        method: 'POST',
        data: {
          actual_delivery_date: new Date().toISOString().split('T')[0],
          notes: 'Delivery approved',
        },
      });

      if (response.success) {
        showSuccess('Delivery approved successfully');
        fetchWorkflowOrders();
      }
    } catch (error) {
      showError('Failed to approve delivery');
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner overlay message="Loading workflow..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TimelineIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Wholesale Workflow
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Track orders through the complete workflow: POS → Payment → Fulfillment → Delivery
      </Alert>

      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} key={order.id}>
            <Paper sx={{ p: 3, position: 'relative' }}>
              {/* Order Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {order.order_number}
                  </Typography>
                  <Typography variant="body1" color="textSecondary" gutterBottom>
                    Customer: {order.customer.business_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Contact: {order.customer.contact_person} • {order.customer.phone}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <StatusChip status={order.status} size="medium" />
                  <StatusChip status={order.payment_status} size="medium" />
                </Box>
              </Box>

              {/* Workflow Steps */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Workflow Progress
                </Typography>
                <Grid container spacing={2}>
                  {getWorkflowSteps(order).map((step, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderColor: getStepColor(step.status),
                          bgcolor: step.status === 'active' ? 'primary.50' : 'transparent'
                        }}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: getStepColor(step.status) === 'success' ? 'success.main' : 
                                      getStepColor(step.status) === 'primary' ? 'primary.main' : 'grey.300',
                              mx: 'auto', mb: 1
                            }}
                          >
                            {step.icon}
                          </Avatar>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            {step.label}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block">
                            {step.description}
                          </Typography>
                          {step.action && (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<ProcessIcon />}
                              sx={{ mt: 1 }}
                              onClick={() => {
                                setSelectedOrder(order);
                                if (step.label === 'Payment Processing') {
                                  setPaymentData({
                                    payment_method: 'cash',
                                    amount: order.total_amount,
                                    reference_number: `REF-${Date.now()}`,
                                    notes: 'Payment processed from workflow',
                                  });
                                  setOpenPaymentModal(true);
                                } else if (step.label === 'Order Fulfillment') {
                                  setFulfillmentData({
                                    delivery_address: order.customer.address || '',
                                    contact_person: order.customer.contact_person,
                                    contact_phone: order.customer.phone,
                                    delivery_fee: 0,
                                    expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                    delivery_instructions: '',
                                    notes: 'Fulfillment from workflow',
                                  });
                                  setOpenFulfillmentModal(true);
                                } else if (step.label === 'Delivery Management' && order.delivery) {
                                  handleApproveDelivery(order.delivery.id);
                                }
                              }}
                            >
                              {step.action}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />
              
              {/* Order Details */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Total Amount: <strong>{formatCurrency(order.total_amount)}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Paid Amount: <strong>{formatCurrency(order.paid_amount)}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Balance: <strong>{formatCurrency(order.balance_amount)}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Created: {formatDate(order.created_at)}
                    </Typography>
                    {order.payment && (
                      <Typography variant="body2" color="textSecondary">
                        Payment: {order.payment.payment_number}
                      </Typography>
                    )}
                    {order.delivery && (
                      <Typography variant="body2" color="textSecondary">
                        Delivery: {order.delivery.delivery_number}
                      </Typography>
                    )}
                  </Grid>
                </Grid>

                {/* Order Items */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Order Items
                  </Typography>
                  <Grid container spacing={1}>
                    {order.items.map((item) => (
                      <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <Card variant="outlined" sx={{ p: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {item.product_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Qty: {item.quantity_ordered} × {formatCurrency(item.unit_price)}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(item.total)}
                          </Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {orders.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No orders in workflow
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Orders will appear here when they are created at POS
          </Typography>
        </Paper>
      )}

      {/* Payment Processing Modal */}
      <Dialog open={openPaymentModal} onClose={() => setOpenPaymentModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
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
                label="Amount"
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reference Number"
                value={paymentData.reference_number}
                onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentModal(false)}>Cancel</Button>
          <Button onClick={handleProcessPayment} variant="contained">
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Fulfillment Modal */}
      <Dialog open={openFulfillmentModal} onClose={() => setOpenFulfillmentModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Fulfillment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Delivery Address"
                value={fulfillmentData.delivery_address}
                onChange={(e) => setFulfillmentData({ ...fulfillmentData, delivery_address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={fulfillmentData.contact_person}
                onChange={(e) => setFulfillmentData({ ...fulfillmentData, contact_person: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={fulfillmentData.contact_phone}
                onChange={(e) => setFulfillmentData({ ...fulfillmentData, contact_phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Delivery Fee"
                type="number"
                value={fulfillmentData.delivery_fee}
                onChange={(e) => setFulfillmentData({ ...fulfillmentData, delivery_fee: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expected Delivery Date"
                type="date"
                value={fulfillmentData.expected_delivery_date}
                onChange={(e) => setFulfillmentData({ ...fulfillmentData, expected_delivery_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Delivery Instructions"
                multiline
                rows={3}
                value={fulfillmentData.delivery_instructions}
                onChange={(e) => setFulfillmentData({ ...fulfillmentData, delivery_instructions: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={fulfillmentData.notes}
                onChange={(e) => setFulfillmentData({ ...fulfillmentData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFulfillmentModal(false)}>Cancel</Button>
          <Button onClick={handleFulfillOrder} variant="contained">
            Complete Fulfillment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Workflow; 