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
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import CustomerModal from '../../components/CustomerModal';
import { formatCurrency } from '../../utils/formatters';

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
  country: string;
  customer_type: string;
  credit_limit: number;
  current_balance: number;
  payment_terms: string;
  status: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');

  const { apiCall } = useApiCall();
  const { showError } = useNotification();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/wholesale/customers?include_inactive=true');
      
      if (response.success) {
        setCustomers(response.data || []);
      } else {
        console.error('Failed to fetch customers:', response.message);
      }
    } catch (error) {
      console.error('Customers fetch error:', error);
      showError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalMode('view');
    setModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner overlay message="Loading customers..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Wholesale Customers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
        >
          Add Customer
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer Code</TableCell>
                <TableCell>Business Name</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Credit Limit</TableCell>
                <TableCell>Current Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {customer.customer_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {customer.business_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {customer.city}, {customer.country}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {customer.contact_person}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {customer.email || 'No email'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {customer.phone_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={customer.customer_type} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatCurrency(customer.credit_limit)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={customer.current_balance > 0 ? 'error' : 'success'}
                    >
                      {formatCurrency(customer.current_balance)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={customer.status} 
                      color={getStatusColor(customer.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Customer">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {customers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="textSecondary">
              No customers found
            </Typography>
          </Box>
        )}
      </Paper>

      <CustomerModal
        open={modalOpen}
        customer={selectedCustomer}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchCustomers}
      />
    </Box>
  );
};

export default Customers; 