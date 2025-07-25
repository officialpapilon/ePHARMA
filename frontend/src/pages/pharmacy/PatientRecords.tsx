import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import {
  Add,
  Print,
  Download,
} from '@mui/icons-material';
import { API_BASE_URL } from '../../../constants';
import DataTable from '../../components/common/DataTable/DataTable';
import SearchFilter from '../../components/common/SearchFilter/SearchFilter';
import Modal from '../../components/common/Modal/Modal';
import FormField from '../../components/common/FormField/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { Customer, TableColumn, FilterOptions, FormField as FormFieldType } from '../../types';
import { formatName, formatDate } from '../../utils/formatters';
import { usePaginatedApi } from '../../hooks/useApi';
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
}

const PatientRecords: React.FC = () => {
  const {
    data: patients,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    changePage,
    changePerPage,
    fetchData,
  } = usePaginatedApi<Customer>('/api/customers');
  
  const { showSuccess, showError, notification, hideNotification } = useNotification();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Customer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPatient, setNewPatient] = useState<Partial<Customer>>({});
  const [formLoading, setFormLoading] = useState(false);

  const patientFormFields: FormFieldType[] = [
    { name: 'first_name', label: 'First Name', type: 'text', required: true },
    { name: 'last_name', label: 'Last Name', type: 'text', required: true },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
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
      setError('No customer data available to export');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Customer Records', 14, 20);
    const tableData = filteredPatients.map((p, idx) => [
      ((currentPage - 1) * rowsPerPage + idx + 1).toString(),
      `${p.first_name} ${p.last_name}`,
      p.id,
      p.age ? p.age.toString() : 'N/A',
      p.gender || 'N/A',
      p.phone || 'N/A',
      p.email || 'N/A',
    ]);
    autoTable(doc, {
      startY: 30,
      head: [['S/N', 'Name', 'Customer ID', 'Age', 'Gender', 'Phone', 'Email']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }, // blue-500
    });
    doc.save('Customer_Records.pdf');
  };

  const handleModalExportPDF = () => {
    if (!transactions.length || !selectedPatient) {
      setError('No transaction data available to export');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${selectedPatient.first_name} ${selectedPatient.last_name} - Transaction History`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${selectedPatient.first_name} ${selectedPatient.last_name}`, 14, 30);
    doc.text(`Phone: ${selectedPatient.phone || 'N/A'}`, 14, 36);
    doc.text(`Age: ${selectedPatient.age || 'N/A'}`, 14, 42);
    const tableData = transactions.map((txn, idx) => [
      (idx + 1).toString(),
      getProductName(txn.Product_ID),
      parseQuantity(txn.approved_quantity),
      formatAmount(txn.approved_amount),
      txn.approved_payment_method,
      txn.status,
      txn.approved_by,
      formatDate(txn.approved_at),
    ]);
    autoTable(doc, {
      startY: 50,
      head: [['S/N', 'Product', 'Quantity', 'Amount (Tsh)', 'Payment Method', 'Status', 'Approved By', 'Approved At']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }, // blue-500
    });
    doc.save(`${selectedPatient.first_name}_${selectedPatient.last_name}_Transactions.pdf`);
  };

  const handleExportExcel = () => {
    if (!filteredPatients.length) {
      setError('No customer data available to export');
      return;
    }
    const exportData = filteredPatients.map((p, idx) => ({
      'S/N': (currentPage - 1) * rowsPerPage + idx + 1,
      Name: `${p.first_name} ${p.last_name}`,
      'Customer ID': p.id,
      Age: p.age || 'N/A',
      Gender: p.gender || 'N/A',
      Phone: p.phone || 'N/A',
      Email: p.email || 'N/A',
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, 'Customer_Records.xlsx');
  };

  const handleModalExportExcel = () => {
    if (!transactions.length || !selectedPatient) {
      setError('No transaction data available to export');
      return;
    }
    const exportData = transactions.map((txn, idx) => ({
      'S/N': idx + 1,
      Product: getProductName(txn.Product_ID),
      Quantity: parseQuantity(txn.approved_quantity),
      'Amount (Tsh)': formatAmount(txn.approved_amount),
      'Payment Method': txn.approved_payment_method,
      Status: txn.status,
      'Approved By': txn.approved_by,
      'Approved At': formatDate(txn.approved_at),
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, `${selectedPatient.first_name}_${selectedPatient.last_name}_Transactions.xlsx`);
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

  const parseQuantity = (quantity: string | number | undefined): string => {
    if (quantity == null) return 'N/A';
    const parsed = parseInt(quantity.toString(), 10);
    return isNaN(parsed) ? 'N/A' : parsed.toString();
  };

  const getProductName = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchPatients();
      fetchProducts();
    }
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(`Failed to fetch customers: ${response.status} - ${text}`);
      }
      const data = text ? JSON.parse(text) : [];
      if (!Array.isArray(data)) throw new Error('Invalid customer data');
      setPatients(data);
    } catch (err: any) {
      setError('Failed to fetch customer data');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (customerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/payment-approve`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to fetch transactions: ${response.status} - ${text}`);
      const data = text ? JSON.parse(text) : [];
      const filteredData = Array.isArray(data)
        ? data.filter((txn: Transaction) => String(txn.Patient_ID) === String(customerId))
        : [];
      setTransactions(filteredData);
    } catch (err: any) {
      showError('Failed to fetch transaction history');
      setTransactions([]);
    }
  };

  const handleSelectPatient = (patient: Customer) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
    fetchTransactions(patient.id);
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
      
      const newCustomer = JSON.parse(text);
      
      setShowAddPatientModal(false);
      setNewPatient({});
      fetchData(); // Refresh the data
      showSuccess('Customer added successfully!');
    } catch (err: any) {
      showError('Failed to add customer');
      console.error('Error in addNewPatient:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handlePatientFieldChange = (name: string, value: any) => {
    setNewPatient(prev => ({ ...prev, [name]: value }));
  };

  const theme = useTheme();

  const columns: TableColumn<Customer>[] = [
    {
      name: 'id',
      label: 'ID',
      options: {
        display: 'excluded',
      },
    },
    {
      name: 'first_name',
      label: 'First Name',
      options: {
        sort: true,
      },
    },
    {
      name: 'last_name',
      label: 'Last Name',
      options: {
        sort: true,
      },
    },
    {
      name: 'phone',
      label: 'Phone',
      options: {
        sort: true,
      },
    },
    {
      name: 'email',
      label: 'Email',
      options: {
        sort: true,
      },
    },
    {
      name: 'gender',
      label: 'Gender',
      options: {
        sort: true,
      },
    },
    {
      name: 'age',
      label: 'Age',
      options: {
        sort: true,
      },
    },
    {
      name: 'actions',
      label: 'Actions',
      options: {
        customBodyRender: (value, tableMeta, updateValue) => (
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleSelectPatient(tableMeta.rowData as Customer)}
          >
            View Details
          </Button>
        ),
      },
    },
  ];

  const filteredPatients = patients || [];
  const { currentPage, rowsPerPage } = pagination;

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
            disabled={!patients?.length}
            sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportExcel}
            disabled={!patients?.length}
            sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }}
          >
            Export Excel
          </Button>
        </Box>
      </Box>
      <SearchFilter
        filters={filters}
        onFiltersChange={updateFilters}
        filterFields={[
          { name: 'first_name', label: 'First Name', type: 'text' },
          { name: 'last_name', label: 'Last Name', type: 'text' },
          { name: 'phone', label: 'Phone', type: 'text' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'gender', label: 'Gender', type: 'select', options: [
            { value: '', label: 'All Genders' },
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
          ]},
        ]}
      />
      <DataTable
        columns={columns}
        data={patients || []}
        loading={loading}
        pagination={pagination}
        onPageChange={changePage}
        onPerPageChange={changePerPage}
        onRowClick={handleSelectPatient}
        emptyMessage="No patients found"
      />

      {/* Add Patient Modal */}
      <Modal
        open={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        title="Add New Patient"
        maxWidth="md"
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setShowAddPatientModal(false)}>
              Cancel
            </Button>
            <Button
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
            <Grid item xs={12} sm={field.name === 'address' ? 12 : 6} key={field.name}>
              <FormField
                field={field}
                value={newPatient[field.name as keyof Customer]}
                onChange={handlePatientFieldChange}
              />
            </Grid>
          ))}
        </Grid>
      </Modal>

      {/* Patient Details Modal */}
      <Modal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Patient Details"
        maxWidth="lg"
      >
        {selectedPatient && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Patient Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Name</Typography>
                <Typography variant="body1">{formatName(selectedPatient.first_name, selectedPatient.last_name)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Phone</Typography>
                <Typography variant="body1">{selectedPatient.phone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Email</Typography>
                <Typography variant="body1">{selectedPatient.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Age</Typography>
                <Typography variant="body1">{selectedPatient.age || 'N/A'}</Typography>
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom>
              Transaction History
            </Typography>
            {transactions.length > 0 ? (
              <Typography variant="body2">
                {transactions.length} transactions found
              </Typography>
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