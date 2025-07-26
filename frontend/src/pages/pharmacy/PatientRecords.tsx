import React, { useState, useEffect, useMemo } from 'react';
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
  Pagination,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Print,
  Download,
  People,
  AttachMoney,
  Receipt,
  TrendingUp,
  Search,
  FilterList,
} from '@mui/icons-material';
import { API_BASE_URL } from '../../../constants';
import DataTable from '../../components/common/DataTable/DataTable';
import Modal from '../../components/common/Modal/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { Customer, FormField as FormFieldType } from '../../types';
import { formatName } from '../../utils/formatters';
import { useNotification } from '../../hooks/useNotification';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '@mui/material';

interface Transaction {
  Payment_ID: number;
  Patient_ID: string;
  transaction_ID: string;
  Product_ID: string;
  status: 'Pending' | 'Approved';
  approved_by: string;
  approved_at: string;
  approved_quantity: string;
  approved_amount: string;
  approved_payment_method: string;
  created_at: string;
  updated_at: string;
  product_name?: string;
  approved_by_name?: string;
  formatted_date?: string;
  formatted_amount?: string;
}

interface Product {
  id: string;
  name: string;
  price?: number;
}

interface PatientWithTransactions {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  age: number | null;
  transaction_count: number;
  last_transaction_date: string | null;
  total_amount: number;
}

const PatientRecords: React.FC = () => {
  const theme = useTheme();
  const [patients, setPatients] = useState<PatientWithTransactions[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [selectedPatient, setSelectedPatient] = useState<PatientWithTransactions | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [editPatient, setEditPatient] = useState<PatientWithTransactions | null>(null);
  const [newPatient, setNewPatient] = useState<Partial<Customer>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch all patients with transaction summary
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }
        const response = await fetch(`${API_BASE_URL}/api/customers-with-transactions`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });
        const data = await response.json();
        if (data.success) {
          setPatients(data.data || []);
          setTotalItems(data.data?.length || 0);
        } else {
          setPatients([]);
          setTotalItems(0);
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
        setPatients([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Client-side filtering and pagination
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!filters || Object.keys(filters).length === 0) return patients;
    
    return patients.filter((patient) => {
      let match = true;
      if (filters.first_name && !patient.first_name?.toLowerCase().includes(filters.first_name.toLowerCase())) match = false;
      if (filters.last_name && !patient.last_name?.toLowerCase().includes(filters.last_name.toLowerCase())) match = false;
      if (filters.phone && !patient.phone?.toLowerCase().includes(filters.phone.toLowerCase())) match = false;
      if (filters.email && !patient.email?.toLowerCase().includes(filters.email.toLowerCase())) match = false;
      if (filters.gender && filters.gender !== '' && patient.gender !== filters.gender) match = false;
      return match;
    });
  }, [patients, filters]);

  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPatients.slice(startIndex, endIndex);
  }, [filteredPatients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  // Analytical summary calculations
  const analytics = useMemo(() => {
    const totalPatients = patients.length;
    const totalTransactions = patients.reduce((sum, p) => sum + p.transaction_count, 0);
    const totalRevenue = patients.reduce((sum, p) => sum + p.total_amount, 0);
    const activePatients = patients.filter(p => p.transaction_count > 0).length;
    const avgTransactionsPerPatient = totalPatients > 0 ? (totalTransactions / totalPatients).toFixed(1) : '0';
    const avgRevenuePerPatient = totalPatients > 0 ? (totalRevenue / totalPatients).toFixed(2) : '0';

    return {
      totalPatients,
      totalTransactions,
      totalRevenue,
      activePatients,
      avgTransactionsPerPatient,
      avgRevenuePerPatient,
    };
  }, [patients]);

  const patientFormFields: FormFieldType[] = [
    { name: 'first_name', label: 'First Name', type: 'text', required: true },
    { name: 'last_name', label: 'Last Name', type: 'text', required: true },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'age', label: 'Age', type: 'number' },
    { 
      name: 'gender', 
      label: 'Gender', 
      type: 'select',
      options: [
        { value: '', label: 'Select Gender' },
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
      ]
    },
  ];

  const handleExportPDF = () => {
    if (!filteredPatients.length) {
      showError('No patient data available to export');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Patient Records', 14, 20);
    const tableData = filteredPatients.map((p, idx) => [
      (idx + 1).toString(),
      `${p.first_name} ${p.last_name}`,
      p.phone || 'N/A',
      p.email || 'N/A',
      p.gender || 'N/A',
      p.age?.toString() || 'N/A',
      p.transaction_count.toString(),
      p.total_amount.toFixed(2),
    ]);
    autoTable(doc, {
      startY: 30,
      head: [['S/N', 'Name', 'Phone', 'Email', 'Gender', 'Age', 'Transactions', 'Total Amount']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    doc.save('Patient_Records.pdf');
  };

  const handleExportExcel = () => {
    if (!filteredPatients.length) {
      showError('No patient data available to export');
      return;
    }
    const exportData = filteredPatients.map((p, idx) => ({
      'S/N': idx + 1,
      'Name': `${p.first_name} ${p.last_name}`,
      'Phone': p.phone || 'N/A',
      'Email': p.email || 'N/A',
      'Gender': p.gender || 'N/A',
      'Age': p.age || 'N/A',
      'Transactions': p.transaction_count,
      'Total Amount': p.total_amount.toFixed(2),
      'Last Transaction': p.last_transaction_date ? new Date(p.last_transaction_date).toLocaleDateString() : 'N/A',
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');
    XLSX.writeFile(workbook, 'Patient_Records.xlsx');
  };

  const formatDate = (date: string | null): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatAmount = (amount: string | number | undefined): string => {
    if (amount == null) return 'N/A';
    const parsed = parseFloat(amount.toString());
    return isNaN(parsed) ? 'N/A' : parsed.toFixed(2);
  };

  const fetchTransactions = async (customerId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to fetch transactions: ${response.status} - ${text}`);
      const data = text ? JSON.parse(text) : {};
      
      if (data.success && Array.isArray(data.data)) {
        setTransactions(data.data);
      } else {
        setTransactions([]);
      }
    } catch (err: unknown) {
      showError('Failed to fetch transaction history');
      setTransactions([]);
    }
  };

  const handleSelectPatient = (patient: PatientWithTransactions) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
    fetchTransactions(patient.id.toString());
  };

  const addNewPatient = async () => {
    if (!newPatient.first_name?.trim() || !newPatient.last_name?.trim()) {
      showError('First name and last name are required');
      return;
    }
    
    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(newPatient),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to add customer: ${response.status} - ${text}`);
      
      setShowAddPatientModal(false);
      setNewPatient({});
      // Refresh the data
      window.location.reload();
      showSuccess('Customer added successfully!');
    } catch (err: unknown) {
      showError('Failed to add customer');
      console.error('Error in addNewPatient:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveEditPatient = async () => {
    if (!editPatient) return;
    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/customers/${editPatient.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(editPatient),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to update customer: ${response.status} - ${text}`);
      showSuccess('Customer updated successfully!');
      setShowEditPatientModal(false);
      // Update the patient in the table without reload
      setPatients(prev => prev.map(p => p.id === editPatient.id ? { ...p, ...editPatient } : p));
    } catch (err: unknown) {
      showError('Failed to update customer');
      console.error('Error in handleSaveEditPatient:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handlePatientFieldChange = (name: string, value: string | number) => {
    setNewPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleEditPatientFieldChange = (name: string, value: string | number) => {
    setEditPatient(prev => prev ? { ...prev, [name]: value } : prev);
  };

  // Define columns for the DataTable
  const columns: TableColumn[] = [
    {
      key: 'first_name',
      header: 'First Name',
      sortable: true,
    },
    {
      key: 'last_name',
      header: 'Last Name',
      sortable: true,
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'gender',
      header: 'Gender',
      sortable: true,
    },
    {
      key: 'age',
      header: 'Age',
      sortable: true,
    },
    {
      key: 'transaction_count',
      header: 'Transactions',
      sortable: true,
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      sortable: true,
      render: (row: PatientWithTransactions) => row.total_amount ? `Tsh ${row.total_amount.toFixed(2)}` : 'Tsh 0.00',
    },
    {
      key: 'last_transaction_date',
      header: 'Last Transaction',
      sortable: true,
      render: (row: PatientWithTransactions) => row.last_transaction_date ? formatDate(row.last_transaction_date) : 'N/A',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: PatientWithTransactions) => (
        <Button
          variant="outlined"
          size="small"
          onClick={e => {
            e.stopPropagation();
            setEditPatient(row);
            setShowEditPatientModal(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  const handleModalExportPDF = () => {
    if (!transactions.length || !selectedPatient) {
      showError('No transaction data available to export');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${selectedPatient.first_name} ${selectedPatient.last_name} - Transaction History`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${selectedPatient.first_name} ${selectedPatient.last_name}`, 14, 30);
    doc.text(`Phone: ${selectedPatient.phone || 'N/A'}`, 14, 36);
    doc.text(`Age: ${selectedPatient.age || 'N/A'}`, 14, 42);
    doc.text(`Total Transactions: ${transactions.length}`, 14, 48);
    
    const tableData = transactions.map((txn, idx) => [
      (idx + 1).toString(),
      txn.product_name || 'Unknown Product',
      txn.approved_quantity || '0',
      txn.formatted_amount || formatAmount(txn.approved_amount),
      txn.approved_payment_method || 'N/A',
      txn.status || 'N/A',
      txn.approved_by_name || 'N/A',
      txn.formatted_date || formatDate(txn.created_at),
    ]);
    
    autoTable(doc, {
      startY: 60,
      head: [['S/N', 'Product', 'Quantity', 'Amount', 'Payment Method', 'Status', 'Approved By', 'Date']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Add summary at the bottom
    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.approved_amount || '0'), 0);
    const approvedCount = transactions.filter(t => t.status === 'Approved').length;
    const pendingCount = transactions.filter(t => t.status === 'Pending').length;
    
    const summaryY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text('Summary:', 14, summaryY);
    doc.setFontSize(8);
    doc.text(`Total Amount: ${formatAmount(totalAmount)}`, 14, summaryY + 8);
    doc.text(`Approved Transactions: ${approvedCount}`, 14, summaryY + 16);
    doc.text(`Pending Transactions: ${pendingCount}`, 14, summaryY + 24);
    
    doc.save(`${selectedPatient.first_name}_${selectedPatient.last_name}_Transactions.pdf`);
  };

  const handleModalExportExcel = () => {
    if (!transactions.length || !selectedPatient) {
      showError('No transaction data available to export');
      return;
    }
    const exportData = transactions.map((txn, idx) => ({
      'S/N': idx + 1,
      'Product': txn.product_name || 'Unknown Product',
      'Quantity': txn.approved_quantity || '0',
      'Amount': txn.formatted_amount || formatAmount(txn.approved_amount),
      'Payment Method': txn.approved_payment_method || 'N/A',
      'Status': txn.status || 'N/A',
      'Approved By': txn.approved_by_name || 'N/A',
      'Date': txn.formatted_date || formatDate(txn.created_at),
    }));
    
    // Add summary row
    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.approved_amount || '0'), 0);
    const approvedCount = transactions.filter(t => t.status === 'Approved').length;
    const pendingCount = transactions.filter(t => t.status === 'Pending').length;
    
    exportData.push({
      'S/N': '',
      'Product': '',
      'Quantity': '',
      'Amount': '',
      'Payment Method': '',
      'Status': '',
      'Approved By': '',
      'Date': '',
    });
    
    exportData.push({
      'S/N': 'SUMMARY',
      'Product': '',
      'Quantity': '',
      'Amount': `Total Amount: ${formatAmount(totalAmount)}`,
      'Payment Method': `Approved: ${approvedCount}`,
      'Status': `Pending: ${pendingCount}`,
      'Approved By': '',
      'Date': '',
    });
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, `${selectedPatient.first_name}_${selectedPatient.last_name}_Transactions.xlsx`);
  };

  return (
    <main style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', background: theme.palette.background.default, boxSizing: 'border-box', padding: '16px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          Patient Records
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowAddPatientModal(true)}
            sx={{ background: theme.palette.primary.main, color: theme.palette.primary.contrastText }}
          >
            Add Patient
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handleExportPDF}
            disabled={!filteredPatients?.length}
            sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportExcel}
            disabled={!filteredPatients?.length}
            sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }}
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      {/* Analytical Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: theme.palette.primary.main, color: theme.palette.primary.contrastText }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {analytics.totalPatients}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Patients
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: theme.palette.success.main, color: theme.palette.success.contrastText }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {analytics.activePatients}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Active Patients
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: theme.palette.info.main, color: theme.palette.info.contrastText }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {analytics.totalTransactions}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Transactions
                  </Typography>
                </Box>
                <Receipt sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: theme.palette.warning.main, color: theme.palette.warning.contrastText }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Tsh {analytics.totalRevenue.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Revenue
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Section */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name..."
              value={filters.first_name || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, first_name: e.target.value }))}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by phone..."
              value={filters.phone || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, phone: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Gender</InputLabel>
              <Select
                value={filters.gender || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                label="Gender"
              >
                <MenuItem value="">All Genders</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFilters({})}
              size="small"
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Card>
      
      <DataTable
        columns={columns}
        data={paginatedPatients}
        loading={loading}
        onRowClick={handleSelectPatient}
        emptyMessage="No patients found"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <MenuItem value={5}>5 per page</MenuItem>
                <MenuItem value={10}>10 per page</MenuItem>
                <MenuItem value={25}>25 per page</MenuItem>
                <MenuItem value={50}>50 per page</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Add Patient Modal */}
      <Modal
        open={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        title="Add New Patient"
        maxWidth="md"
        actions={
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => setShowAddPatientModal(false)}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={addNewPatient}
              disabled={formLoading}
            >
              {formLoading ? 'Adding...' : 'Add Patient'}
            </Button>
          </Box>
        }
      >
        <Grid container spacing={2}>
          {patientFormFields.map((field) => (
            <Grid
              item
              xs={field.name === 'address' ? 12 : 6}
              key={field.name}
            >
              {field.type === 'select' ? (
                <FormControl fullWidth size="small">
                  <InputLabel>{field.label}</InputLabel>
                  <Select
                    value={newPatient[field.name as keyof Customer] || ''}
                    onChange={(e) => handlePatientFieldChange(field.name, e.target.value)}
                    label={field.label}
                  >
                    {field.options?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : field.type === 'textarea' ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label={field.label}
                  value={newPatient[field.name as keyof Customer] || ''}
                  onChange={(e) => handlePatientFieldChange(field.name, e.target.value)}
                />
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  type={field.type}
                  label={field.label}
                  required={field.required}
                  value={newPatient[field.name as keyof Customer] || ''}
                  onChange={(e) => handlePatientFieldChange(field.name, e.target.value)}
                />
              )}
            </Grid>
          ))}
        </Grid>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        open={showEditPatientModal}
        onClose={() => setShowEditPatientModal(false)}
        title="Edit Patient"
        maxWidth="md"
        actions={
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => setShowEditPatientModal(false)}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSaveEditPatient}
              disabled={formLoading}
            >
              {formLoading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        }
      >
        {editPatient && (
          <Grid container spacing={2}>
            {patientFormFields.map((field) => (
              <Grid
                item
                xs={field.name === 'address' ? 12 : 6}
                key={field.name}
              >
                {field.type === 'select' ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>{field.label}</InputLabel>
                    <Select
                      value={editPatient[field.name as keyof PatientWithTransactions] || ''}
                      onChange={(e) => handleEditPatientFieldChange(field.name, e.target.value)}
                      label={field.label}
                    >
                      {field.options?.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : field.type === 'textarea' ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    label={field.label}
                    value={editPatient[field.name as keyof PatientWithTransactions] || ''}
                    onChange={(e) => handleEditPatientFieldChange(field.name, e.target.value)}
                  />
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    type={field.type}
                    label={field.label}
                    required={field.required}
                    value={editPatient[field.name as keyof PatientWithTransactions] || ''}
                    onChange={(e) => handleEditPatientFieldChange(field.name, e.target.value)}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        )}
      </Modal>

      {/* Patient Details Modal */}
      <Modal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Patient Details"
        maxWidth="lg"
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handleModalExportPDF}
              disabled={!transactions.length}
              sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleModalExportExcel}
              disabled={!transactions.length}
              sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }}
            >
              Export Excel
            </Button>
            <Button onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </Box>
        }
      >
        {selectedPatient && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Patient Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Typography variant="body2" color="textSecondary">Name</Typography>
                <Typography variant="body1">{formatName(selectedPatient.first_name, selectedPatient.last_name)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="textSecondary">Phone</Typography>
                <Typography variant="body1">{selectedPatient.phone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="textSecondary">Email</Typography>
                <Typography variant="body1">{selectedPatient.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="textSecondary">Age</Typography>
                <Typography variant="body1">{selectedPatient.age || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="textSecondary">Gender</Typography>
                <Typography variant="body1">{selectedPatient.gender || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="textSecondary">Total Transactions</Typography>
                <Typography variant="body1">{selectedPatient.transaction_count}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                <Typography variant="body1">Tsh {selectedPatient.total_amount.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="textSecondary">Last Transaction</Typography>
                <Typography variant="body1">{selectedPatient.last_transaction_date ? formatDate(selectedPatient.last_transaction_date) : 'N/A'}</Typography>
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom>
              Transaction History ({transactions.length} transactions)
            </Typography>
            {transactions.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                <div style={{ 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: 8, 
                  overflow: 'hidden',
                  maxHeight: 400,
                  overflowY: 'auto'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: theme.palette.primary.main }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', color: theme.palette.primary.contrastText, fontSize: 14 }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: theme.palette.primary.contrastText, fontSize: 14 }}>Product</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: theme.palette.primary.contrastText, fontSize: 14 }}>Quantity</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: theme.palette.primary.contrastText, fontSize: 14 }}>Amount</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: theme.palette.primary.contrastText, fontSize: 14 }}>Payment Method</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: theme.palette.primary.contrastText, fontSize: 14 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction, index) => (
                        <tr key={transaction.transaction_ID} style={{ 
                          background: index % 2 === 0 ? theme.palette.background.paper : theme.palette.action.hover 
                        }}>
                          <td style={{ padding: '12px', fontSize: 14 }}>
                            {transaction.formatted_date || formatDate(transaction.created_at)}
                          </td>
                          <td style={{ padding: '12px', fontSize: 14, fontWeight: 500 }}>
                            {transaction.product_name}
                          </td>
                          <td style={{ padding: '12px', fontSize: 14 }}>
                            {transaction.approved_quantity}
                          </td>
                          <td style={{ padding: '12px', fontSize: 14, fontWeight: 600 }}>
                            {transaction.formatted_amount || formatAmount(transaction.approved_amount)}
                          </td>
                          <td style={{ padding: '12px', fontSize: 14 }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: 4,
                              fontSize: 12,
                              background: theme.palette.info.light,
                              color: theme.palette.info.contrastText
                            }}>
                              {transaction.approved_payment_method}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: 14 }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: 4,
                              fontSize: 12,
                              background: transaction.status === 'Approved' ? 
                                theme.palette.success.light : theme.palette.warning.light,
                              color: transaction.status === 'Approved' ? 
                                theme.palette.success.contrastText : theme.palette.warning.contrastText
                            }}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {/* Summary Row */}
                      <tr style={{ background: theme.palette.grey[100] }}>
                        <td colSpan={2} style={{ fontWeight: 600, fontSize: 14, padding: '10px 12px' }}>Summary</td>
                        <td style={{ fontWeight: 600, fontSize: 14, padding: '10px 12px' }}>{transactions.length}</td>
                        <td style={{ fontWeight: 600, fontSize: 14, padding: '10px 12px' }}>{formatAmount(transactions.reduce((sum, t) => sum + parseFloat(t.approved_amount || '0'), 0))}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No transaction history found
              </Typography>
            )}
          </Box>
        )}
      </Modal>

      <LoadingSpinner loading={formLoading} overlay />
    </main>
  );
};

export default PatientRecords;