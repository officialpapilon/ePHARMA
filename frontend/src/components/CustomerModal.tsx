import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useApiCall } from '../hooks/useApi';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/formatters';

interface Customer {
  id: number;
  customer_code: string;
  business_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  tax_number: string;
  business_license: string;
  customer_type: 'pharmacy' | 'hospital' | 'clinic' | 'distributor' | 'other';
  credit_limit_type: 'unlimited' | 'limited';
  credit_limit: number;
  current_balance: number;
  payment_terms: 'immediate' | '7_days' | '15_days' | '30_days' | '60_days';
  status: 'active' | 'inactive' | 'suspended';
  notes: string;
}

interface Transaction {
  id: number;
  order_number: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
}

interface CustomerModalProps {
  open: boolean;
  customer?: Customer | null;
  mode: 'add' | 'edit' | 'view';
  onClose: () => void;
  onSuccess: () => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ open, customer, mode, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    business_name: '',
    contact_person: '',
    phone_number: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Tanzania',
    tax_number: '',
    business_license: '',
    customer_type: 'pharmacy' as const,
    credit_limit_type: 'limited' as const,
    credit_limit: 0,
    payment_terms: 'immediate' as const,
    status: 'active' as const,
    notes: '',
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (customer && mode !== 'add') {
      setFormData({
        business_name: customer.business_name,
        contact_person: customer.contact_person,
        phone_number: customer.phone_number,
        email: customer.email || '',
        address: customer.address,
        city: customer.city,
        state: customer.state || '',
        postal_code: customer.postal_code || '',
        country: customer.country,
        tax_number: customer.tax_number || '',
        business_license: customer.business_license || '',
        customer_type: customer.customer_type,
        credit_limit_type: customer.credit_limit_type,
        credit_limit: customer.credit_limit,
        payment_terms: customer.payment_terms,
        status: customer.status,
        notes: customer.notes || '',
      });
    }
  }, [customer, mode]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (mode === 'add') {
        const response = await apiCall('/api/wholesale/customers', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          data: formData
        });

        if (response.success) {
          showSuccess('Customer added successfully!');
          onSuccess();
          onClose();
        } else {
          showError(response.message || 'Failed to add customer');
        }
      } else if (mode === 'edit' && customer) {
        const response = await apiCall(`/api/wholesale/customers/${customer.id}`, {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          data: formData
        });

        if (response.success) {
          showSuccess('Customer updated successfully!');
          onSuccess();
          onClose();
        } else {
          showError(response.message || 'Failed to update customer');
        }
      }
    } catch (error) {
      console.error('Customer operation error:', error);
      showError('Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!customer) return;

    try {
      setLoading(true);
      const response = await apiCall(`/api/wholesale/customers/${customer.id}/deactivate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.success) {
        showSuccess('Customer deactivated successfully!');
        onSuccess();
        onClose();
      } else {
        showError(response.message || 'Failed to deactivate customer');
      }
    } catch (error) {
      console.error('Deactivate customer error:', error);
      showError('Failed to deactivate customer');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!customer) return;

    try {
      const response = await apiCall(`/api/wholesale/customers/${customer.id}/transactions`);
      
      if (response.success) {
        setTransactions(response.data || []);
      }
    } catch (error) {
      console.error('Fetch transactions error:', error);
    }
  };

  useEffect(() => {
    if (open && customer && activeTab === 1) {
      fetchTransactions();
    }
  }, [open, customer, activeTab]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'partial': return 'info';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add New Customer' : 
         mode === 'edit' ? 'Edit Customer' : 'Customer Details'}
      </DialogTitle>
      <DialogContent>
        {mode === 'view' && customer ? (
          <Box>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Details" />
              <Tab label="Transactions" />
              <Tab label="Debt Summary" />
            </Tabs>

            {activeTab === 0 && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Business Information</Typography>
                    <Typography><strong>Code:</strong> {customer.customer_code}</Typography>
                    <Typography><strong>Business Name:</strong> {customer.business_name}</Typography>
                    <Typography><strong>Contact Person:</strong> {customer.contact_person}</Typography>
                    <Typography><strong>Phone:</strong> {customer.phone_number}</Typography>
                    <Typography><strong>Email:</strong> {customer.email || 'N/A'}</Typography>
                    <Typography><strong>Type:</strong> {customer.customer_type}</Typography>
                    <Typography><strong>Status:</strong> 
                      <Chip 
                        label={customer.status} 
                        color={getStatusColor(customer.status) as any}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Address & Financial</Typography>
                    <Typography><strong>Address:</strong> {customer.address}</Typography>
                    <Typography><strong>City:</strong> {customer.city}</Typography>
                    <Typography><strong>State:</strong> {customer.state || 'N/A'}</Typography>
                    <Typography><strong>Country:</strong> {customer.country}</Typography>
                    <Typography><strong>Credit Limit:</strong> {formatCurrency(customer.credit_limit)}</Typography>
                    <Typography><strong>Current Balance:</strong> {formatCurrency(customer.current_balance)}</Typography>
                    <Typography><strong>Payment Terms:</strong> {customer.payment_terms}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>Transaction History</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Order #</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Total Amount</TableCell>
                        <TableCell align="right">Paid Amount</TableCell>
                        <TableCell align="right">Balance</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.order_number}</TableCell>
                          <TableCell>{formatDate(transaction.created_at)}</TableCell>
                          <TableCell align="right">{formatCurrency(transaction.total_amount)}</TableCell>
                          <TableCell align="right">{formatCurrency(transaction.paid_amount)}</TableCell>
                          <TableCell align="right">{formatCurrency(transaction.balance_amount)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.payment_status} 
                              color={getPaymentStatusColor(transaction.payment_status) as any}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {transactions.length === 0 && (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                    No transactions found
                  </Typography>
                )}
              </Box>
            )}

            {activeTab === 2 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>Debt Summary</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Credit Limit:</strong> {formatCurrency(customer.credit_limit)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Current Balance:</strong> {formatCurrency(customer.current_balance)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Available Credit:</strong> {formatCurrency(customer.credit_limit - customer.current_balance)}
                  </Typography>
                </Alert>
                
                {customer.current_balance > 0 && (
                  <Alert severity="warning">
                    This customer has outstanding balance of {formatCurrency(customer.current_balance)}
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Business Name"
                value={formData.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax Number"
                value={formData.tax_number}
                onChange={(e) => handleInputChange('tax_number', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Business License"
                value={formData.business_license}
                onChange={(e) => handleInputChange('business_license', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Customer Type</InputLabel>
                <Select
                  value={formData.customer_type}
                  onChange={(e) => handleInputChange('customer_type', e.target.value)}
                  label="Customer Type"
                >
                  <MenuItem value="pharmacy">Pharmacy</MenuItem>
                  <MenuItem value="hospital">Hospital</MenuItem>
                  <MenuItem value="clinic">Clinic</MenuItem>
                  <MenuItem value="distributor">Distributor</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Terms</InputLabel>
                <Select
                  value={formData.payment_terms}
                  onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                  label="Payment Terms"
                >
                  <MenuItem value="immediate">Immediate</MenuItem>
                  <MenuItem value="7_days">7 Days</MenuItem>
                  <MenuItem value="15_days">15 Days</MenuItem>
                  <MenuItem value="30_days">30 Days</MenuItem>
                  <MenuItem value="60_days">60 Days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Credit Limit Type</InputLabel>
                <Select
                  value={formData.credit_limit_type}
                  onChange={(e) => handleInputChange('credit_limit_type', e.target.value)}
                  label="Credit Limit Type"
                >
                  <MenuItem value="limited">Limited</MenuItem>
                  <MenuItem value="unlimited">Unlimited</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Credit Limit"
                type="number"
                value={formData.credit_limit}
                onChange={(e) => handleInputChange('credit_limit', parseFloat(e.target.value) || 0)}
                disabled={formData.credit_limit_type === 'unlimited'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        {mode === 'view' && customer && (
          <>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleDeactivate}
              disabled={loading}
            >
              {customer.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
          </>
        )}
        {mode !== 'view' && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Add Customer' : 'Update Customer'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CustomerModal; 