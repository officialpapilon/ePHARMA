import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
} from '@mui/icons-material';
import { API_BASE_URL } from '../../../constants';

// Inline notification functions to avoid import issues
const showSuccess = (message: string) => {
  console.log('Success:', message);
  alert(`Success: ${message}`);
};

const showError = (message: string) => {
  console.error('Error:', message);
  alert(`Error: ${message}`);
};

interface FinancialActivity {
  id: number;
  transaction_id: string;
  type: 'income' | 'expense' | 'refund' | 'adjustment';
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  transaction_date: string;
  notes?: string;
  status: string;
  created_by: number;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  approver?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface Summary {
  total_income: number;
  total_expenses: number;
  total_refunds: number;
  net_profit: number;
  profit_margin: number;
  transaction_count: number;
}

const FinancialActivities: React.FC = () => {
  const theme = useTheme();
  
  // State
  const [activities, setActivities] = useState<FinancialActivity[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_income: 0,
    total_expenses: 0,
    total_refunds: 0,
    net_profit: 0,
    profit_margin: 0,
    transaction_count: 0,
  });
  const [categories, setCategories] = useState<Record<string, Record<string, string>>>({});
  
  // Filters
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    status: '',
    start_date: '',
    end_date: '',
    search: '',
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<FinancialActivity | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    description: '',
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchActivities();
  }, [currentPage, filters]);

  // Fallback: Calculate summary from activities if API summary is empty
  useEffect(() => {
    if (activities.length > 0 && summary.total_expenses === 0 && summary.total_income === 0) {
      const calculatedSummary = {
        total_income: activities.filter(a => a.type === 'income').reduce((sum, a) => sum + a.amount, 0),
        total_expenses: activities.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.amount, 0),
        total_refunds: activities.filter(a => a.type === 'refund').reduce((sum, a) => sum + a.amount, 0),
        net_profit: 0,
        profit_margin: 0,
        transaction_count: activities.length,
      };
      calculatedSummary.net_profit = calculatedSummary.total_income - calculatedSummary.total_expenses + calculatedSummary.total_refunds;
      calculatedSummary.profit_margin = calculatedSummary.total_income > 0 ? 
        (calculatedSummary.net_profit / calculatedSummary.total_income) * 100 : 0;
      
      setSummary(calculatedSummary);
      console.log('Fallback summary calculated:', calculatedSummary);
    }
  }, [activities, summary.total_expenses, summary.total_income]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...filters,
      });
      
      const response = await fetch(`${API_BASE_URL}/api/financial-activities?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Financial Activities API Response:', data); // Debug log
      if (data.success) {
        setActivities(data.data);
        setSummary(data.summary);
        setTotalPages(data.meta.last_page);
        console.log('Summary set to:', data.summary); // Debug log
        console.log('Activities count:', data.data.length); // Debug log
      }
    } catch {
      showError('Failed to fetch financial activities');
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/financial-activities/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const addNewCategory = async (type: string, categoryName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/financial-activities/categories`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          category: categoryName,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        showSuccess('Category added successfully');
        fetchCategories(); // Refresh categories
        return true;
      } else {
        showError(data.message || 'Failed to add category');
        return false;
      }
    } catch (error) {
      showError('Failed to add category');
      return false;
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingActivity 
        ? `${API_BASE_URL}/api/financial-activities/${editingActivity.id}`
        : `${API_BASE_URL}/api/financial-activities`;
      
      const method = editingActivity ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (data.success) {
        showSuccess(editingActivity ? 'Activity updated successfully' : 'Activity created successfully');
        setShowModal(false);
        setEditingActivity(null);
        resetForm();
        fetchActivities();
      } else {
        showError(data.message || 'Operation failed');
      }
    } catch {
      showError('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/financial-activities/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      const data = await response.json();
      if (data.success) {
        showSuccess('Activity deleted successfully');
        fetchActivities();
      } else {
        showError(data.message || 'Delete failed');
      }
    } catch {
      showError('Delete failed');
    }
  };

  const handleEdit = (activity: FinancialActivity) => {
    setEditingActivity(activity);
    setFormData({
      type: activity.type,
      category: activity.category,
      description: activity.description,
      amount: activity.amount.toString(),
      payment_method: activity.payment_method,
      reference_number: activity.reference_number || '',
      transaction_date: activity.transaction_date,
      notes: activity.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'income',
      category: '',
      description: '',
      amount: '',
      payment_method: 'cash',
      reference_number: '',
      transaction_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Tsh ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income': return theme.palette.success.main;
      case 'expense': return theme.palette.error.main;
      case 'refund': return theme.palette.warning.main;
      default: return theme.palette.info.main;
    }
  };

  const summaryCards = [
    {
      title: 'Total Income',
      value: formatAmount(summary.total_income),
      icon: <TrendingUp />,
      color: theme.palette.success.main,
    },
    {
      title: 'Total Expenses',
      value: formatAmount(summary.total_expenses),
      icon: <TrendingDown />,
      color: theme.palette.error.main,
    },
    {
      title: 'Net Profit',
      value: formatAmount(summary.net_profit),
      icon: <AccountBalance />,
      color: summary.net_profit >= 0 ? theme.palette.success.main : theme.palette.error.main,
    },
    {
      title: 'Profit Margin',
      value: `${summary.profit_margin.toFixed(2)}%`,
      icon: <Receipt />,
      color: summary.profit_margin >= 0 ? theme.palette.success.main : theme.palette.error.main,
    },
  ];

  const handleCategoryChange = async (value: string) => {
    if (value === '__ADD_NEW__') {
      setShowAddCategoryModal(true);
    } else {
      setFormData(prev => ({ ...prev, category: value }));
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showError('Category name is required');
      return;
    }

    const success = await addNewCategory(formData.type, newCategoryName.trim());
    if (success) {
      setFormData(prev => ({ ...prev, category: newCategoryName.trim() }));
      setNewCategoryName('');
      setShowAddCategoryModal(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          Financial Activities
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingActivity(null);
            resetForm();
            setShowModal(true);
          }}
        >
          Add Activity
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ background: card.color, color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {card.title}
                    </Typography>
                  </Box>
                  <Box sx={{ background: 'rgba(255,255,255,0.2)', p: 1, borderRadius: 1 }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  label="Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="refund">Refund</MenuItem>
                  <MenuItem value="adjustment">Adjustment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Category"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Enter category (e.g., Sales Revenue, Rent & Utilities, etc.)"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Start Date"
                value={filters.start_date}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="End Date"
                value={filters.end_date}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFilters({
                  type: '', category: '', status: '', start_date: '', end_date: '', search: ''
                })}
                fullWidth
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: theme.palette.primary.main }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Transaction ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.transaction_id}</TableCell>
                    <TableCell>
                      <Chip
                        label={activity.type}
                        size="small"
                        sx={{ background: getTypeColor(activity.type), color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>{activity.category}</TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {formatAmount(activity.amount)}
                    </TableCell>
                    <TableCell>{new Date(activity.transaction_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEdit(activity)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(activity.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingActivity ? 'Edit Financial Activity' : 'Add Financial Activity'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  label="Type"
                >
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="refund">Refund</MenuItem>
                  <MenuItem value="adjustment">Adjustment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">
                    <em>Select a category</em>
                  </MenuItem>
                  {categories[formData.type] && Object.entries(categories[formData.type]).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                  <MenuItem value="__ADD_NEW__" sx={{ color: 'primary.main', fontStyle: 'italic' }}>
                    + Add New Category
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Tsh</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                  label="Payment Method"
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="mobile_money">Mobile Money</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reference Number"
                value={formData.reference_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Transaction Date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingActivity ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={showAddCategoryModal} onClose={() => setShowAddCategoryModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={`Enter new ${formData.type} category name`}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddCategoryModal(false)}>Cancel</Button>
          <Button onClick={handleAddCategory} variant="contained">
            Add Category
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinancialActivities; 