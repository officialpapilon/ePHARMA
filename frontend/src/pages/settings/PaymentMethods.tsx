import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentMethod } from '../../types/settings';
import { fetchPaymentMethods } from '../../services/settingsService';

const PaymentMethods: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newMethod, setNewMethod] = useState({ name: '', description: '', is_active: false });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentMethods().then(setPaymentMethods).catch(console.error);
    }
  }, [isAuthenticated]);

  const handleAddMethod = async () => {
    if (!newMethod.name || !newMethod.description) {
      setError('Please provide a name and description');
      return;
    }

    const method: PaymentMethod = {
      id: crypto.randomUUID(),
      ...newMethod,
      is_active: newMethod.is_active,
    };

    try {
      // Simulate adding to backend (replace with actual API call)
      setPaymentMethods([...paymentMethods, method]);
      setNewMethod({ name: '', description: '', is_active: false });
      setSuccess('Payment method added successfully!');
      setTimeout(() => setSuccess(''), 3000); // Auto-hide success message
    } catch (err) {
      setError('Failed to add payment method');
    }
  };

  const handleToggleActive = (id: string) => {
    setPaymentMethods(paymentMethods.map(m => m.id === id ? { ...m, is_active: !m.is_active } : m));
    // Simulate updating backend (replace with actual API call)
  };

  if (!isAuthenticated) return <Typography>Unauthorized access</Typography>;

  return (
    <Box sx={{ padding: 3, maxWidth: '1200px', margin: '0 auto', bgcolor: 'white', borderRadius: 2, boxShadow: '0 0 15px rgba(0,0,0,0.1)' }}>
      <Typography variant="h5" sx={{ mb: 3, color: '#00BCD4' }}>Payment Methods</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
        <TextField
          label="Name"
          value={newMethod.name}
          onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Description"
          value={newMethod.description}
          onChange={(e) => setNewMethod({ ...newMethod, description: e.target.value })}
          fullWidth
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Active</InputLabel>
          <Select
            value={newMethod.is_active ? 'true' : 'false'}
            onChange={(e) => setNewMethod({ ...newMethod, is_active: e.target.value === 'true' })}
            label="Active"
          >
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          sx={{ bgcolor: '#4CAF50', color: 'white', '&:hover': { bgcolor: 'darkgreen' }, mt: 2, padding: '12px', borderRadius: 2 }}
          onClick={handleAddMethod}
        >
          Add Payment Method
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2, color: '#4CAF50' }}>{success}</Alert>}
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentMethods.map(method => (
              <TableRow key={method.id}>
                <TableCell>{method.name}</TableCell>
                <TableCell>{method.description}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: method.is_active ? '#4CAF50' : '#FF5722',
                      color: 'white',
                      '&:hover': { bgcolor: method.is_active ? 'darkgreen' : '#E64A19' },
                      padding: '6px 16px',
                      borderRadius: 2,
                    }}
                    onClick={() => handleToggleActive(method.id)}
                  >
                    {method.is_active ? 'Active' : 'Inactive'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button variant="contained" sx={{ bgcolor: '#FF5722', color: 'white', '&:hover': { bgcolor: '#E64A19' }, padding: '6px 16px', borderRadius: 2 }}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PaymentMethods;