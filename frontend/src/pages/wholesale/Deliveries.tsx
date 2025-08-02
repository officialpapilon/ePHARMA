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
  Grid,
  Chip,
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  CheckCircle as CompleteIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import StatusChip from '../../components/common/StatusChip/StatusChip';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface Delivery {
  id: number;
  delivery_number: string;
  order: {
    id: number;
    order_number: string;
    customer: {
      business_name: string;
      contact_person: string;
      address: string;
      phone_number: string;
    };
    items: Array<{
      product_name: string;
      quantity_ordered: number;
      unit_price: number;
      total: number;
    }>;
    total_amount: number;
  };
  status: string;
  scheduled_date: string;
  actual_delivery_date: string | null;
  delivery_address: string;
  contact_person: string;
  contact_phone: string;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_number: string | null;
  delivery_fee: number;
  notes: string;
}

interface CompleteDeliveryModalProps {
  open: boolean;
  delivery: Delivery | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CompleteDeliveryModal: React.FC<CompleteDeliveryModalProps> = ({ open, delivery, onClose, onSuccess }) => {
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [actualDeliveryDate, setActualDeliveryDate] = useState<Date | null>(new Date());
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (delivery) {
      setDriverName(delivery.driver_name || '');
      setDriverPhone(delivery.driver_phone || '');
      setVehicleNumber(delivery.vehicle_number || '');
      setDeliveryFee(delivery.delivery_fee?.toString() || '0');
      setDeliveryNotes(delivery.notes || '');
    }
  }, [delivery]);

  const handleCompleteDelivery = async () => {
    if (!delivery) return;

    try {
      setSubmitting(true);
      const response = await apiCall(`/api/wholesale/deliveries/${delivery.id}/complete`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data: {
          driver_name: driverName,
          driver_phone: driverPhone,
          vehicle_number: vehicleNumber,
          delivery_fee: parseFloat(deliveryFee) || 0,
          actual_delivery_date: actualDeliveryDate?.toISOString().split('T')[0],
          delivery_notes: deliveryNotes
        }
      });

      if (response.success) {
        showSuccess('Delivery completed successfully!');
        onSuccess();
        onClose();
      } else {
        showError(response.message || 'Failed to complete delivery');
      }
    } catch (error) {
      console.error('Complete delivery error:', error);
      showError('Failed to complete delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateDeliveryNote = async () => {
    if (!delivery) return;

    try {
      // Generate PDF using jsPDF
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(20);
      doc.text('DELIVERY NOTE', 105, 20, { align: 'center' });
      
      // Add delivery information
      doc.setFontSize(12);
      doc.text(`Delivery Number: ${delivery.delivery_number}`, 20, 40);
      doc.text(`Order Number: ${delivery.order.order_number}`, 20, 50);
      doc.text(`Customer: ${delivery.order.customer.business_name}`, 20, 60);
      doc.text(`Contact: ${delivery.order.customer.contact_person}`, 20, 70);
      doc.text(`Address: ${delivery.delivery_address}`, 20, 80);
      doc.text(`Phone: ${delivery.contact_phone}`, 20, 90);
      doc.text(`Scheduled Date: ${formatDate(delivery.scheduled_date)}`, 20, 100);
      
      if (delivery.driver_name) {
        doc.text(`Driver: ${delivery.driver_name}`, 20, 110);
        doc.text(`Vehicle: ${delivery.vehicle_number}`, 20, 120);
      }
      
      // Add items table
      const tableData = delivery.order.items.map((item, index) => [
        index + 1,
        item.product_name,
        item.quantity_ordered,
        formatCurrency(item.unit_price),
        formatCurrency(item.total)
      ]);
      
      autoTable(doc, {
        startY: 140,
        head: [['S/N', 'Product', 'Quantity', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 }
      });
      
      // Calculate totals
      const subtotal = delivery.order.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
      const taxAmount = delivery.order.items.reduce((sum, item) => sum + parseFloat(item.tax_amount), 0);
      const totalAmount = subtotal + taxAmount;

      // Add totals
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Subtotal: ${formatCurrency(subtotal)}`, 150, finalY);
      doc.text(`Tax: ${formatCurrency(taxAmount)}`, 150, finalY + 10);
      doc.text(`Total: ${formatCurrency(totalAmount)}`, 150, finalY + 20);
      
      // Add footer
      doc.setFontSize(10);
      doc.text('Generated on: ' + new Date().toLocaleDateString(), 20, finalY + 40);
      
      // Save the PDF
      doc.save(`delivery-note-${delivery.delivery_number}.pdf`);
      showSuccess('Delivery note generated successfully!');
    } catch (error) {
      console.error('Generate delivery note error:', error);
      showError('Failed to generate delivery note');
    }
  };

  if (!delivery) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Complete Delivery - {delivery.delivery_number}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Order Information</Typography>
            <Typography variant="body2"><strong>Order #:</strong> {delivery.order.order_number}</Typography>
            <Typography variant="body2"><strong>Customer:</strong> {delivery.order.customer.business_name}</Typography>
            <Typography variant="body2"><strong>Contact:</strong> {delivery.order.customer.contact_person}</Typography>
            <Typography variant="body2"><strong>Address:</strong> {delivery.delivery_address}</Typography>
            <Typography variant="body2"><strong>Total Amount:</strong> {formatCurrency(delivery.order.total_amount)}</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Driver Name"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Driver Phone"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Vehicle Number"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Delivery Fee"
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              InputProps={{
                startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>TZS</Typography>,
              }}
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Actual Delivery Date"
                value={actualDeliveryDate}
                onChange={setActualDeliveryDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Delivery Notes"
              multiline
              rows={3}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
            />
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
                  {delivery.order.items.map((item, index) => (
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
        <Button
          variant="outlined"
          startIcon={<PdfIcon />}
          onClick={handleGenerateDeliveryNote}
        >
          Generate Delivery Note
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleCompleteDelivery}
          variant="contained"
          disabled={submitting}
        >
          {submitting ? 'Completing...' : 'Complete Delivery'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface ViewDeliveryModalProps {
  open: boolean;
  delivery: Delivery | null;
  onClose: () => void;
}

const ViewDeliveryModal: React.FC<ViewDeliveryModalProps> = ({ open, delivery, onClose }) => {
  if (!delivery) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Delivery Details - {delivery.delivery_number}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Delivery Information</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Delivery Number</Typography>
              <Typography variant="body1" fontWeight="bold">{delivery.delivery_number}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Status</Typography>
              <StatusChip status={delivery.status} />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Scheduled Date</Typography>
              <Typography variant="body1">{formatDate(delivery.scheduled_date)}</Typography>
            </Box>
            {delivery.actual_delivery_date && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Actual Delivery Date</Typography>
                <Typography variant="body1">{formatDate(delivery.actual_delivery_date)}</Typography>
              </Box>
            )}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Delivery Address</Typography>
              <Typography variant="body1">{delivery.delivery_address}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Contact Person</Typography>
              <Typography variant="body1">{delivery.contact_person}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Contact Phone</Typography>
              <Typography variant="body1">{delivery.contact_phone}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Driver Information</Typography>
            {delivery.driver_name ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Driver Name</Typography>
                  <Typography variant="body1">{delivery.driver_name}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Driver Phone</Typography>
                  <Typography variant="body1">{delivery.driver_phone}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Vehicle Number</Typography>
                  <Typography variant="body1">{delivery.vehicle_number}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Delivery Fee</Typography>
                  <Typography variant="body1">{formatCurrency(delivery.delivery_fee)}</Typography>
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="textSecondary">No driver assigned yet</Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Order Information</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Order Number</Typography>
              <Typography variant="body1" fontWeight="bold">{delivery.order.order_number}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Customer</Typography>
              <Typography variant="body1">{delivery.order.customer.business_name}</Typography>
              <Typography variant="body2" color="textSecondary">{delivery.order.customer.contact_person}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Total Amount</Typography>
              <Typography variant="body1" fontWeight="bold">{formatCurrency(delivery.order.total_amount)}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Order Items</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>S/N</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {delivery.order.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
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

          {delivery.notes && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Notes</Typography>
              <Typography variant="body1">{delivery.notes}</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      console.log('Fetching deliveries...');
      const response = await apiCall('/api/wholesale/deliveries');
      
      console.log('Deliveries response:', response);
      
      if (response.success) {
        setDeliveries(response.data || []);
      } else {
        console.error('Failed to fetch deliveries:', response.message);
      }
    } catch (error) {
      console.error('Deliveries fetch error:', error);
      showError('Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleCompleteDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setCompleteModalOpen(true);
  };

  const handleViewDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setViewModalOpen(true);
  };

  const handleCompleteDeliveryClick = (delivery: Delivery) => {
    handleCompleteDelivery(delivery);
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    if (statusFilter === 'all') return true;
    return delivery.status === statusFilter;
  });

  if (loading) {
    return <LoadingSpinner overlay message="Loading deliveries..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Delivery Management
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
              <MenuItem value="all">All Deliveries</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="in_transit">In Transit</MenuItem>
              <MenuItem value="out_for_delivery">Out for Delivery</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Delivery #</TableCell>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Scheduled Date</TableCell>
                <TableCell>Delivery Address</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDeliveries.map((delivery) => (
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
                      {delivery.order.customer.business_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {delivery.order.customer.contact_person}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={delivery.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(delivery.scheduled_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200 }}>
                      {delivery.delivery_address}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {delivery.driver_name ? (
                      <Box>
                        <Typography variant="body2">{delivery.driver_name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {delivery.driver_phone}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip label="Not Assigned" size="small" color="warning" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDelivery(delivery)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {delivery.status === 'scheduled' && (
                        <Tooltip title="Complete Delivery">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleCompleteDeliveryClick(delivery)}
                          >
                            <CompleteIcon />
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

        {filteredDeliveries.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <DeliveryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="textSecondary">
              No deliveries found
            </Typography>
          </Box>
        )}
      </Paper>

      <CompleteDeliveryModal
        open={completeModalOpen}
        delivery={selectedDelivery}
        onClose={() => {
          setCompleteModalOpen(false);
          setSelectedDelivery(null);
        }}
        onSuccess={fetchDeliveries}
      />

      <ViewDeliveryModal
        open={viewModalOpen}
        delivery={selectedDelivery}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedDelivery(null);
        }}
      />
    </Box>
  );
};

export default Deliveries; 