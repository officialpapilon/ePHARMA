import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button, TextField, Alert, TableContainer } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { ExpenseCategory } from '../../types/settings';
import { fetchExpenseCategories } from '../../services/settingsService';

const ExpenseCategories: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchExpenseCategories().then(setCategories).catch(console.error);
    }
  }, [isAuthenticated]);

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.description) {
      setError('Please provide a name and description');
      return;
    }

    const category: ExpenseCategory = {
      id: crypto.randomUUID(),
      name: newCategory.name,
      description: newCategory.description,
    };

    try {
      // Simulate adding to backend (replace with actual API call)
      setCategories([...categories, category]);
      setNewCategory({ name: '', description: '' });
      setSuccess('Expense category added successfully!');
      setTimeout(() => setSuccess(''), 3000); // Auto-hide success message
    } catch (err) {
      setError('Failed to add expense category');
    }
  };

  if (!isAuthenticated) return <Typography>Unauthorized access</Typography>;

  return (
    <Box sx={{ padding: 3, maxWidth: '1200px', margin: '0 auto', bgcolor: 'white', borderRadius: 2, boxShadow: '0 0 15px rgba(0,0,0,0.1)' }}>
      <Typography variant="h5" sx={{ mb: 3, color: '#00BCD4' }}>Expense Categories</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
        <TextField
          label="Category Name"
          value={newCategory.name}
          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Description"
          value={newCategory.description}
          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          sx={{ bgcolor: '#4CAF50', color: 'white', '&:hover': { bgcolor: 'darkgreen' }, mt: 2, padding: '12px', borderRadius: 2 }}
          onClick={handleAddCategory}
        >
          Add Category
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
            {categories.map(category => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
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

export default ExpenseCategories;