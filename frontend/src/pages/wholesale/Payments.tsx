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
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Payment as PaymentIcon,
  CheckCircle as CompletedIcon,
  Cancel as FailedIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
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

interface WholesalePayment {
  id: number;
  payment_number: string;
  order: {
    id: number;
    order_number: string;
    total_amount: number;
    balance_amount: number;
    payment_terms: string;
  };
  customer: {
    id: number;
    business_name: string;
    contact_person: string;
    phone: string;
  };
  payment_date: string;
  due_date: string;
  amount: number;
  payment_method: string;
  payment_category: 'full_payment' | 'partial_payment' | 'debt_mark' | 'debt_payment';
  reference_number: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  notes: string;
  is_receipt_generated: boolean;
  is_invoice_generated: boolean;
  invoice_number: string;
  created_at: string;
  updated_at: string;
}

interface PaymentSummary {
  total_payments: number;
  total_amount: number;
  pending_payments: number;
  completed_payments: number;
  failed_payments: number;
  overdue_payments: number;
  payments_by_method: Array<{ payment_method: string; count: number; amount: number }>;
  average_payment_time: number;
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<WholesalePayment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<WholesalePayment | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'delete' | 'receipt'>('view');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        per_page: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(paymentMethodFilter && { payment_method: paymentMethodFilter }),
        ...(startDate && { start_date: startDate.toISOString().split('T')[0] }),
        ...(endDate && { end_date: endDate.toISOString().split('T')[0] }),
      });

      const response = await apiCall(`api/wholesale/payments?${params}`);
      
      if (response.success) {
        setPayments(response.data);
        setTotal(response.meta.total);
        setSummary(response.summary);
      }
    } catch (error) {
      showError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, rowsPerPage, searchTerm, statusFilter, paymentMethodFilter, startDate, endDate]);

  const handleStatusAction = async (paymentId: number, action: string) => {
    try {
      const response = await apiCall(`api/wholesale/payments/${paymentId}/${action}`, {
        method: 'POST',
      });

      if (response.success) {
        showSuccess(`Payment ${action}ed successfully`);
        fetchPayments();
        setOpenModal(false);
      }
    } catch (error) {
      showError(`Failed to ${action} payment`);
    }
  };

  const handleDelete = async (paymentId: number) => {
    try {
      const response = await apiCall(`api/wholesale/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        showSuccess('Payment deleted successfully');
        fetchPayments();
        setOpenModal(false);
      }
    } catch (error) {
      showError('Failed to delete payment');
    }
  };

  const generateReceipt = async (paymentId: number) => {
    try {
      const response = await apiCall(`api/wholesale/payments/${paymentId}/receipt`, {
        method: 'POST',
      });

      if (response.success) {
        showSuccess('Receipt generated successfully');
        // Handle receipt download or display
      }
    } catch (error) {
      showError('Failed to generate receipt');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'warning',
      completed: 'success',
      failed: 'error',
      refunded: 'info',
      cancelled: 'default',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PaymentIcon />;
      case 'completed':
        return <CompletedIcon />;
      case 'failed':
        return <FailedIcon />;
      case 'refunded':
        return <ReceiptIcon />;
      default:
        return <PaymentIcon />;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
    setPaymentMethodFilter('');
    setStartDate(null);
    setEndDate(null);
    setPage(0);
  };

  if (loading && payments.length === 0) {
    return <LoadingSpinner overlay message="Loading payments..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Wholesale Payments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setModalType('edit');
            setSelectedPayment(null);
            setOpenModal(true);
          }}
        >
          New Payment
        </Button>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Payments
                </Typography>
                <Typography variant="h4">{summary.total_payments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Amount
                </Typography>
                <Typography variant="h4">{formatCurrency(summary.total_amount)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4" color="success.main">
                  {summary.completed_payments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Overdue
                </Typography>
                <Typography variant="h4" color="error">
                  {summary.overdue_payments}
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
            placeholder="Search payments..."
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
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="refunded">Refunded</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    label="Payment Method"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                    <MenuItem value="mobile_money">Mobile Money</MenuItem>
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

      {/* Payments Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment #</TableCell>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Payment Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Method</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {payment.payment_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {payment.order?.order_number || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {payment.customer.business_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {payment.customer.contact_person}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {formatDate(payment.due_date)}
                    </Typography>
                    {isOverdue(payment.due_date) && payment.status === 'pending' && (
                      <Chip label="Overdue" color="error" size="small" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      status={payment.status}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={(payment.payment_method || 'Unknown').replace('_', ' ')} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {formatCurrency(payment.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setModalType('view');
                            setOpenModal(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Generate Receipt">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelectedPayment(payment);
                            generateReceipt(payment.id);
                          }}
                        >
                          <ReceiptIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Payment">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setModalType('edit');
                            setOpenModal(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {payment.status === 'pending' && (
                        <>
                          <Tooltip title="Mark Completed">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                setSelectedPayment(payment);
                                handleStatusAction(payment.id, 'complete');
                              }}
                            >
                              <CompletedIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Mark Failed">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedPayment(payment);
                                handleStatusAction(payment.id, 'fail');
                              }}
                            >
                              <FailedIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {payment.status === 'completed' && (
                        <Tooltip title="Mark Refunded">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => {
                              setSelectedPayment(payment);
                              handleStatusAction(payment.id, 'refund');
                            }}
                          >
                            <ReceiptIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete Payment">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedPayment(payment);
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
      <Dialog open={openModal && modalType === 'delete'} onClose={() => setOpenModal(false)}>
        <DialogTitle>Delete Payment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete payment <strong>{selectedPayment?.payment_number}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button
            onClick={() => selectedPayment && handleDelete(selectedPayment.id)}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Details Modal */}
      <Modal
        open={openModal && modalType === 'view'}
        onClose={() => setOpenModal(false)}
        title={`Payment Details - ${selectedPayment?.payment_number}`}
        maxWidth="md"
      >
        {selectedPayment && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Payment Information
                </Typography>
                <Typography><strong>Payment Number:</strong> {selectedPayment.payment_number}</Typography>
                <Typography><strong>Order Number:</strong> {selectedPayment.order?.order_number || 'N/A'}</Typography>
                <Typography><strong>Payment Date:</strong> {formatDate(selectedPayment.payment_date)}</Typography>
                <Typography><strong>Due Date:</strong> {formatDate(selectedPayment.due_date)}</Typography>
                <Typography><strong>Amount:</strong> {formatCurrency(selectedPayment.amount)}</Typography>
                <Typography><strong>Payment Method:</strong> {(selectedPayment.payment_method || 'Unknown').replace('_', ' ')}</Typography>
                <Typography><strong>Reference Number:</strong> {selectedPayment.reference_number}</Typography>
                <Typography><strong>Status:</strong> 
                  <StatusChip
                    status={selectedPayment.status}
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                <Typography><strong>Business Name:</strong> {selectedPayment.customer.business_name}</Typography>
                <Typography><strong>Contact Person:</strong> {selectedPayment.customer.contact_person}</Typography>
                <Typography><strong>Phone:</strong> {selectedPayment.customer.phone}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Order Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography><strong>Total Amount:</strong> {formatCurrency(selectedPayment.order.total_amount)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography><strong>Payment Amount:</strong> {formatCurrency(selectedPayment.amount)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography color="error">
                      <strong>Balance:</strong> {formatCurrency(selectedPayment.order.balance_amount)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              {selectedPayment.notes && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Notes
                  </Typography>
                  <Typography>{selectedPayment.notes}</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Modal>
    </Box>
  );
};

export default Payments; 