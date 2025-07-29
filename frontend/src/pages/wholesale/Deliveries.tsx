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
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocalShipping as DeliveryIcon,
  CheckCircle as ApproveIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import Modal from '../../components/common/Modal/Modal';
import StatusChip from '../../components/common/StatusChip/StatusChip';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { API_BASE_URL } from '../../../constants';
import { wholesaleDeliveriesApi, wholesaleOrdersApi, wholesaleCustomersApi } from '../../services/wholesaleService';

interface WholesaleDelivery {
  id: number;
  delivery_number: string;
  order: {
    id: number;
    order_number: string;
    total_amount: number;
    payment_status: string;
    payment_terms: string;
  };
  customer: {
    id: number;
    business_name: string;
    contact_person: string;
    phone: string;
    address: string;
  };
  delivery_date: string;
  estimated_delivery: string;
  actual_delivery: string | null;
  status: 'scheduled' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled' | 'returned';
  tracking_number: string;
  delivery_method: string;
  delivery_cost: number;
  notes: string;
  is_delivery_note_generated: boolean;
  is_delivery_receipt_generated: boolean;
  delivery_note_number: string;
  delivery_receipt_number: string;
  delivery_notes: string;
  created_at: string;
  updated_at: string;
}

interface DeliverySummary {
  total_deliveries: number;
  pending_deliveries: number;
  in_transit_deliveries: number;
  delivered_deliveries: number;
  failed_deliveries: number;
  total_delivery_cost: number;
  average_delivery_time: number;
}

const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<WholesaleDelivery[]>([]);
  const [summary, setSummary] = useState<DeliverySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedDelivery, setSelectedDelivery] = useState<WholesaleDelivery | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'delete' | 'track'>('view');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    order_id: '',
    customer_id: '',
    delivery_date: '',
    estimated_delivery: '',
    tracking_number: '',
    delivery_method: '',
    delivery_cost: '',
    notes: ''
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await wholesaleDeliveriesApi.getAll();
      
      if (response.data && Array.isArray(response.data)) {
        setDeliveries(response.data);
      } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
        setDeliveries(response.data.data);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      console.error('Fetch deliveries error:', error);
      setError('Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [page, rowsPerPage, searchTerm, statusFilter, startDate, endDate]);

  const handleStatusAction = async (deliveryId: number, action: string) => {
    try {
      const response = await wholesaleDeliveriesApi.updateDeliveryStatus(deliveryId, action);

      if (response.success) {
        showSuccess(`Delivery ${action}ed successfully`, 'success');
        fetchDeliveries();
        setOpenModal(false);
      }
    } catch (error) {
      showError(`Failed to ${action} delivery`, 'error');
    }
  };

  const handleDelete = async (deliveryId: number) => {
    try {
      const response = await wholesaleDeliveriesApi.deleteDelivery(deliveryId);

      if (response.success) {
        showSuccess('Delivery deleted successfully', 'success');
        fetchDeliveries();
        setOpenModal(false);
      }
    } catch (error) {
      showError('Failed to delete delivery', 'error');
    }
  };

  const handleApproveDelivery = async (deliveryId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/wholesale/deliveries/${deliveryId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          actual_delivery_date: new Date().toISOString().split('T')[0],
          notes: 'Delivery approved and completed'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showSuccess('Delivery approved successfully! Workflow completed.');
          fetchDeliveries(); // Refresh the list
        } else {
          setError(result.message || 'Failed to approve delivery');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to approve delivery');
      }
    } catch (err) {
      console.error('Approve delivery error:', err);
      setError('Failed to approve delivery');
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccess(message);
    showSuccess(message);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'warning',
      in_transit: 'info',
      delivered: 'success',
      failed: 'error',
      returned: 'default',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <DeliveryIcon />;
      case 'in_transit':
        return <ScheduleIcon />;
      case 'delivered':
        return <ApproveIcon />;
      case 'failed':
        return <DeliveryIcon />; // Assuming FailedIcon is not used, using DeliveryIcon as a placeholder
      default:
        return <DeliveryIcon />;
    }
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
    setStartDate(null);
    setEndDate(null);
    setPage(0);
  };

  const fetchOrders = async () => {
    try {
      const response = await wholesaleOrdersApi.getOrders({ per_page: 100 });
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await wholesaleCustomersApi.getCustomers({ per_page: 100 });
      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const createDelivery = async () => {
    try {
      const response = await wholesaleDeliveriesApi.createDelivery({
        ...formData,
        order_id: parseInt(formData.order_id),
        customer_id: parseInt(formData.customer_id),
        delivery_cost: parseFloat(formData.delivery_cost)
      });

      if (response.success) {
        showSuccess('Delivery created successfully', 'success');
        setOpenModal(false);
        setFormData({
          order_id: '',
          customer_id: '',
          delivery_date: '',
          estimated_delivery: '',
          tracking_number: '',
          delivery_method: '',
          delivery_cost: '',
          notes: ''
        });
        fetchDeliveries();
      }
    } catch (error) {
      showError('Failed to create delivery', 'error');
    }
  };

  useEffect(() => {
    if (modalType === 'edit' && !selectedDelivery) {
      fetchOrders();
      fetchCustomers();
    }
  }, [modalType, selectedDelivery]);

  if (loading && deliveries.length === 0) {
    return <LoadingSpinner overlay message="Loading deliveries..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Wholesale Deliveries
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setModalType('edit');
            setSelectedDelivery(null);
            setOpenModal(true);
          }}
        >
          New Delivery
        </Button>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Deliveries
                </Typography>
                <Typography variant="h4">{summary.total_deliveries}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  In Transit
                </Typography>
                <Typography variant="h4" color="info.main">
                  {summary.in_transit_deliveries}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Delivered
                </Typography>
                <Typography variant="h4" color="success.main">
                  {summary.delivered_deliveries}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Cost
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(summary.total_delivery_cost)}
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
            placeholder="Search deliveries..."
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
                    <MenuItem value="in_transit">In Transit</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="returned">Returned</MenuItem>
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

      {/* Deliveries Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Delivery #</TableCell>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Delivery Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tracking #</TableCell>
                <TableCell align="right">Delivery Cost</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow key={delivery.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {delivery.delivery_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {delivery.order.order_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {delivery.customer.business_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {delivery.customer.contact_person}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {formatDate(delivery.delivery_date)}
                    </Typography>
                    {delivery.actual_delivery && (
                      <Typography variant="caption" color="success.main">
                        Delivered: {formatDate(delivery.actual_delivery)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      label={delivery.status.replace('_', ' ')}
                      color={getStatusColor(delivery.status)}
                      icon={getStatusIcon(delivery.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontFamily="monospace">
                      {delivery.tracking_number}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2">
                      {formatCurrency(delivery.delivery_cost)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setModalType('view');
                            setOpenModal(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Track Delivery">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setModalType('track');
                            setOpenModal(true);
                          }}
                        >
                          <TimelineIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Delivery">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setModalType('edit');
                            setOpenModal(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {delivery.status === 'pending' && (
                        <>
                          <Tooltip title="Mark In Transit">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                handleStatusAction(delivery.id, 'in-transit');
                              }}
                            >
                              <TimelineIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {delivery.status === 'in_transit' && (
                        <>
                          <Tooltip title="Mark Delivered">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                handleStatusAction(delivery.id, 'delivered');
                              }}
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Mark Failed">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                handleStatusAction(delivery.id, 'failed');
                              }}
                            >
                              <DeliveryIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete Delivery">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedDelivery(delivery);
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

      {/* Create/Edit Delivery Modal */}
      <Dialog open={openModal && modalType === 'edit'} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedDelivery ? 'Edit Delivery' : 'New Delivery'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Order</InputLabel>
                <Select
                  value={formData.order_id}
                  onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                  label="Order"
                >
                  {orders.map((order) => (
                    <MenuItem key={order.id} value={order.id}>
                      {order.order_number} - {order.customer?.business_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  label="Customer"
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.business_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Delivery Date"
                  value={formData.delivery_date ? new Date(formData.delivery_date) : null}
                  onChange={(date) => setFormData({ ...formData, delivery_date: date ? date.toISOString().split('T')[0] : '' })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Estimated Delivery"
                  value={formData.estimated_delivery ? new Date(formData.estimated_delivery) : null}
                  onChange={(date) => setFormData({ ...formData, estimated_delivery: date ? date.toISOString().split('T')[0] : '' })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tracking Number"
                value={formData.tracking_number}
                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Method"
                value={formData.delivery_method}
                onChange={(e) => setFormData({ ...formData, delivery_method: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Cost"
                type="number"
                value={formData.delivery_cost}
                onChange={(e) => setFormData({ ...formData, delivery_cost: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button onClick={createDelivery} variant="contained" color="primary">
            {selectedDelivery ? 'Update' : 'Create'} Delivery
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialogs */}
      <Dialog open={openModal && modalType === 'delete'} onClose={() => setOpenModal(false)}>
        <DialogTitle>Delete Delivery</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete delivery <strong>{selectedDelivery?.delivery_number}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button
            onClick={() => selectedDelivery && handleDelete(selectedDelivery.id)}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Details Modal */}
      <Modal
        open={openModal && modalType === 'view'}
        onClose={() => setOpenModal(false)}
        title={`Delivery Details - ${selectedDelivery?.delivery_number}`}
        maxWidth="md"
      >
        {selectedDelivery && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Delivery Information
                </Typography>
                <Typography><strong>Delivery Number:</strong> {selectedDelivery.delivery_number}</Typography>
                <Typography><strong>Order Number:</strong> {selectedDelivery.order.order_number}</Typography>
                <Typography><strong>Delivery Date:</strong> {formatDate(selectedDelivery.delivery_date)}</Typography>
                <Typography><strong>Estimated Delivery:</strong> {formatDate(selectedDelivery.estimated_delivery)}</Typography>
                {selectedDelivery.actual_delivery && (
                  <Typography><strong>Actual Delivery:</strong> {formatDate(selectedDelivery.actual_delivery)}</Typography>
                )}
                <Typography><strong>Status:</strong> 
                  <StatusChip
                    label={selectedDelivery.status.replace('_', ' ')}
                    color={getStatusColor(selectedDelivery.status)}
                    icon={getStatusIcon(selectedDelivery.status)}
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography><strong>Tracking Number:</strong> {selectedDelivery.tracking_number}</Typography>
                <Typography><strong>Delivery Method:</strong> {selectedDelivery.delivery_method}</Typography>
                <Typography><strong>Delivery Cost:</strong> {formatCurrency(selectedDelivery.delivery_cost)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                <Typography><strong>Business Name:</strong> {selectedDelivery.customer.business_name}</Typography>
                <Typography><strong>Contact Person:</strong> {selectedDelivery.customer.contact_person}</Typography>
                <Typography><strong>Phone:</strong> {selectedDelivery.customer.phone}</Typography>
                <Typography><strong>Address:</strong> {selectedDelivery.customer.address}</Typography>
              </Grid>
              {selectedDelivery.notes && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Notes
                  </Typography>
                  <Typography>{selectedDelivery.notes}</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Modal>

      {/* Delivery Tracking Modal */}
      <Modal
        open={openModal && modalType === 'track'}
        onClose={() => setOpenModal(false)}
        title={`Delivery Tracking - ${selectedDelivery?.delivery_number}`}
        maxWidth="sm"
      >
        {selectedDelivery && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Tracking Information
            </Typography>
            <Typography><strong>Tracking Number:</strong> {selectedDelivery.tracking_number}</Typography>
            <Typography><strong>Current Status:</strong> 
              <StatusChip
                label={selectedDelivery.status.replace('_', ' ')}
                color={getStatusColor(selectedDelivery.status)}
                icon={getStatusIcon(selectedDelivery.status)}
                sx={{ ml: 1 }}
              />
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Delivery Timeline
              </Typography>
              <Box sx={{ position: 'relative', pl: 3 }}>
                <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, bgcolor: 'grey.300' }} />
                
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Box sx={{ position: 'absolute', left: -6, top: 0, width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                  <Typography variant="subtitle2">Order Created</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatDateTime(selectedDelivery.created_at)}
                  </Typography>
                </Box>

                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: -6, 
                    top: 0, 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: selectedDelivery.status !== 'pending' ? 'info.main' : 'grey.300' 
                  }} />
                  <Typography variant="subtitle2">In Transit</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {selectedDelivery.status === 'in_transit' ? 'Currently in transit' : 'Pending'}
                  </Typography>
                </Box>

                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: -6, 
                    top: 0, 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: selectedDelivery.status === 'delivered' ? 'success.main' : 'grey.300' 
                  }} />
                  <Typography variant="subtitle2">Delivered</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {selectedDelivery.actual_delivery ? formatDateTime(selectedDelivery.actual_delivery) : 'Pending'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Modal>
    </Box>
  );
};

export default Deliveries; 