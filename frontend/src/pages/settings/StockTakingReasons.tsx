import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button, TextField, Alert, TableContainer } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Reason } from '../../types/settings';
import { fetchStockTakingReasons } from '../../services/settingsService';

const StockTakingReasons: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [newReason, setNewReason] = useState({ name: '', description: '' });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchStockTakingReasons().then(setReasons).catch(console.error);
    }
  }, [isAuthenticated]);

  const handleAddReason = async () => {
    if (!newReason.name || !newReason.description) {
      setError('Please provide a name and description');
      return;
    }

    const reason: Reason = {
      id: crypto.randomUUID(),
      name: newReason.name,
      description: newReason.description,
      type: 'stock_taking',
    };

    try {
      // Simulate adding to backend (replace with actual API call)
      setReasons([...reasons, reason]);
      setNewReason({ name: '', description: '' });
      setSuccess('Stock taking reason added successfully!');
      setTimeout(() => setSuccess(''), 3000); // Auto-hide success message
    } catch (err) {
      setError('Failed to add stock taking reason');
    }
  };

  if (!isAuthenticated) return <Typography>Unauthorized access</Typography>;

  return (
    <Box sx={{ padding: 3, maxWidth: '1200px', margin: '0 auto', bgcolor: 'white', borderRadius: 2, boxShadow: '0 0 15px rgba(0,0,0,0.1)' }}>
      <Typography variant="h5" sx={{ mb: 3, color: '#00BCD4' }}>Stock Taking Reasons</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
        <TextField
          label="Reason Name"
          value={newReason.name}
          onChange={(e) => setNewReason({ ...newReason, name: e.target.value })}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Description"
          value={newReason.description}
          onChange={(e) => setNewReason({ ...newReason, description: e.target.value })}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          sx={{ bgcolor: '#4CAF50', color: 'white', '&:hover': { bgcolor: 'darkgreen' }, mt: 2, padding: '12px', borderRadius: 2 }}
          onClick={handleAddReason}
        >
          Add Reason
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
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reasons.map(reason => (
              <TableRow key={reason.id}>
                <TableCell>{reason.name}</TableCell>
                <TableCell>{reason.description}</TableCell>
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

export default StockTakingReasons;