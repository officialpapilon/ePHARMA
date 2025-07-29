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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import StatusChip from '../../components/common/StatusChip/StatusChip';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface DeliveryOrder {
  id: number;
  order_number: string;
  customer: {
    id: number;
    business_name: string;
    contact_person: string;
    phone: string;
  };
  status: string;
  delivery_type: string;
  delivery_address?: string;
  delivery_contact_person?: string;
  delivery_contact_phone?: string;
  expected_delivery_date: string;
  assigned_delivery_person_id?: number;
  delivery_note_number?: string;
  total_amount: number;
  items: Array<{
    id: number;
    product_name: string;
    quantity_ordered: number;
    unit_price: number;
    total: number;
  }>;
}

const DeliveryManagement: React.FC = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [openStatusModal, setOpenStatusModal] = useState(false);
  const [statusData, setStatusData] = useState({
    status: '',
    notes: '',
    actual_delivery_date: new Date().toISOString().split('T')[0],
  });

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  const fetchDeliveryOrders = async () => {
    try {
      setLoading(true);
      const response = await apiCall('api/wholesale/orders?status=ready_for_delivery,assigned_to_delivery,out_for_delivery');
      
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      showError('Failed to fetch delivery orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryOrders();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    try {
      const response = await apiCall(`api/wholesale/orders/${selectedOrder.id}/update-delivery-status`, {
        method: 'POST',
        data: statusData,
      });

      if (response.success) {
        showSuccess('Delivery status updated successfully');
        setOpenStatusModal(false);
        fetchDeliveryOrders();
      }
    } catch (error) {
      showError('Failed to update delivery status');
    }
  };

  const handlePrintDeliveryNote = (order: DeliveryOrder) => {
    if (order.delivery_note_number) {
      // Generate delivery note content
      const deliveryNote = `
        DELIVERY NOTE
        =============
        Note Number: ${order.delivery_note_number}
        Order Number: ${order.order_number}
        Date: ${formatDate(new Date().toISOString())}
        
        CUSTOMER DETAILS
        ================
        Business: ${order.customer.business_name}
        Contact: ${order.delivery_contact_person || order.customer.contact_person}
        Phone: ${order.delivery_contact_phone || order.customer.phone}
        Address: ${order.delivery_address || 'Pickup'}
        
        ITEMS
        =====
        ${order.items.map(item => 
          `${item.product_name} - Qty: ${item.quantity_ordered} - ${formatCurrency(item.total)}`
        ).join('\n')}
        
        TOTAL: ${formatCurrency(order.total_amount)}
        
        Delivery Person: ${localStorage.getItem('username') || 'Unknown'}
        Status: ${statusData.status}
        Notes: ${statusData.notes}
      `;
      
      // Print the delivery note
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Delivery Note - ${order.order_number}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .section { margin: 15px 0; }
                .item { margin: 5px 0; }
                .total { font-weight: bold; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>DELIVERY NOTE</h1>
                <p><strong>Note Number:</strong> ${order.delivery_note_number}</p>
                <p><strong>Order Number:</strong> ${order.order_number}</p>
                <p><strong>Date:</strong> ${formatDate(new Date().toISOString())}</p>
              </div>
              
              <div class="section">
                <h2>CUSTOMER DETAILS</h2>
                <p><strong>Business:</strong> ${order.customer.business_name}</p>
                <p><strong>Contact:</strong> ${order.delivery_contact_person || order.customer.contact_person}</p>
                <p><strong>Phone:</strong> ${order.delivery_contact_phone || order.customer.phone}</p>
                <p><strong>Address:</strong> ${order.delivery_address || 'Pickup'}</p>
              </div>
              
              <div class="section">
                <h2>ITEMS</h2>
                ${order.items.map(item => 
                  `<div class="item">
                    <strong>${item.product_name}</strong> - Qty: ${item.quantity_ordered} - ${formatCurrency(item.total)}
                  </div>`
                ).join('')}
                <div class="total">
                  <strong>TOTAL: ${formatCurrency(order.total_amount)}</strong>
                </div>
              </div>
              
              <div class="section">
                <h2>DELIVERY DETAILS</h2>
                <p><strong>Delivery Person:</strong> ${localStorage.getItem('username') || 'Unknown'}</p>
                <p><strong>Status:</strong> ${statusData.status}</p>
                <p><strong>Notes:</strong> ${statusData.notes}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_for_delivery': return 'warning';
      case 'assigned_to_delivery': return 'info';
      case 'out_for_delivery': return 'primary';
      case 'delivered': return 'success';
      case 'picked_by_customer': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner overlay message="Loading delivery orders..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <DeliveryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Delivery Management
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Manage delivery assignments and update delivery status. Print delivery notes after completion.
      </Alert>

      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} md={6} key={order.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {order.order_number}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Customer: {order.customer.business_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Contact: {order.delivery_contact_person || order.customer.contact_person}
                    </Typography>
                  </Box>
                  <StatusChip status={order.status} size="small" />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Delivery Type: <strong>{order.delivery_type}</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Expected Date: {formatDate(order.expected_delivery_date)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total: {formatCurrency(order.total_amount)}
                  </Typography>
                  {order.delivery_address && (
                    <Typography variant="body2" color="textSecondary">
                      Address: {order.delivery_address}
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>

                  {order.status === 'ready_for_delivery' && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AssignmentIcon />}
                      onClick={() => {
                        setSelectedOrder(order);
                        setStatusData({
                          status: 'assigned_to_delivery',
                          notes: 'Delivery assigned',
                          actual_delivery_date: new Date().toISOString().split('T')[0],
                        });
                        setOpenStatusModal(true);
                      }}
                    >
                      Assign to Me
                    </Button>
                  )}

                  {order.status === 'assigned_to_delivery' && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<DeliveryIcon />}
                      onClick={() => {
                        setSelectedOrder(order);
                        setStatusData({
                          status: 'out_for_delivery',
                          notes: 'Out for delivery',
                          actual_delivery_date: new Date().toISOString().split('T')[0],
                        });
                        setOpenStatusModal(true);
                      }}
                    >
                      Start Delivery
                    </Button>
                  )}

                  {order.status === 'out_for_delivery' && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CompletedIcon />}
                        onClick={() => {
                          setSelectedOrder(order);
                          setStatusData({
                            status: 'delivered',
                            notes: 'Delivered successfully',
                            actual_delivery_date: new Date().toISOString().split('T')[0],
                          });
                          setOpenStatusModal(true);
                        }}
                      >
                        Mark Delivered
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CompletedIcon />}
                        onClick={() => {
                          setSelectedOrder(order);
                          setStatusData({
                            status: 'picked_by_customer',
                            notes: 'Picked by customer',
                            actual_delivery_date: new Date().toISOString().split('T')[0],
                          });
                          setOpenStatusModal(true);
                        }}
                      >
                        Picked by Customer
                      </Button>
                    </>
                  )}

                  {(order.status === 'delivered' || order.status === 'picked_by_customer') && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={() => handlePrintDeliveryNote(order)}
                    >
                      Print Note
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {orders.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DeliveryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No delivery orders
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Orders will appear here when they are ready for delivery
          </Typography>
        </Paper>
      )}

      {/* Status Update Modal */}
      <Dialog open={openStatusModal} onClose={() => setOpenStatusModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Delivery Status</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusData.status}
                  onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                >
                  <MenuItem value="assigned_to_delivery">Assigned to Delivery</MenuItem>
                  <MenuItem value="out_for_delivery">Out for Delivery</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="picked_by_customer">Picked by Customer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Actual Delivery Date"
                type="date"
                value={statusData.actual_delivery_date}
                onChange={(e) => setStatusData({ ...statusData, actual_delivery_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={statusData.notes}
                onChange={(e) => setStatusData({ ...statusData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusModal(false)}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliveryManagement; 