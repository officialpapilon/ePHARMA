import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Edit, Trash2, Printer, Download, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { NavigateNext } from '@mui/icons-material';
import { API_BASE_URL } from '../../../constants';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transition } from 'react-transition-group';
import Spinner from '../../components/UI/Spinner/index.tsx';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  age?: number;
  gender?: string;
  dateOfBirth?: string;
}

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

interface Product {
  id: string;
  name: string;
}

const PatientRecords: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Patient | null>(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    age: undefined as number | undefined,
    gender: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredPatients = patients.filter(
    (p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone && p.phone.includes(searchTerm)) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Auto-dismiss error after 1 second
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/medicines-cache`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to fetch products: ${response.status} - ${text}`);
      const data = text ? JSON.parse(text).data || [] : [];
      setProducts(Array.isArray(data) ? data.map((item: any) => ({
        id: String(item.product_id),
        name: item.product_name || 'Unknown Product',
      })) : []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
      setProducts([]);
    }
  };

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
      if (filteredData.length === 0) {
        setError('No transaction history found for this customer');
      }
    } catch (err: any) {
      setError('Failed to fetch transaction history');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
    setIsEditing(false);
    fetchTransactions(patient.id);
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditedPatient({ ...patient });
    setIsEditing(true);
    setShowDetailsModal(true);
    fetchTransactions(patient.id);
  };

  const handleSave = async () => {
    if (!editedPatient) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/customers/${editedPatient.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(editedPatient),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to update customer: ${response.status} - ${text}`);
      const updated = JSON.parse(text);
      setPatients(patients.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPatient(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError('Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/customers/${patientId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to delete customer: ${response.status} - ${text}`);
      setPatients(patients.filter((p) => p.id !== patientId));
      setShowDetailsModal(false);
      setSelectedPatient(null);
    } catch (err: any) {
      setError('Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editedPatient) return;
    const { name, value } = e.target;
    setEditedPatient({
      ...editedPatient,
      [name]: name === 'age' ? parseInt(value) || undefined : value,
    });
  };

  const addNewPatient = async () => {
    if (!newPatient.first_name.trim() || !newPatient.last_name.trim()) {
      setError('First name and last name are required');
      return;
    }
    setLoading(true);
    setError(null);
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
      if (!text.trim()) throw new Error('Empty response received');
      if (text.trim().startsWith('<')) {
        throw new Error(`Received HTML instead of JSON: ${text.substring(0, 100)}...`);
      }
      const newCustomer = JSON.parse(text);
      setPatients([...patients, { ...newCustomer, id: String(newCustomer.id) }]);
      setSelectedPatient({ ...newCustomer, id: String(newCustomer.id) });
      setShowAddPatientModal(false);
      setNewPatient({ first_name: '', last_name: '', phone: '', email: '', address: '', age: undefined, gender: '' });
      setShowDetailsModal(true);
      fetchTransactions(String(newCustomer.id));
    } catch (err: any) {
      setError('Failed to add customer');
      console.error('Error in addNewPatient:', err);
    } finally {
      setLoading(false);
    }
  };

  const transitionStyles = {
    entering: { opacity: 0, transform: 'translateY(-10px)' },
    entered: { opacity: 1, transform: 'translateY(0)' },
    exiting: { opacity: 0, transform: 'translateY(-10px)' },
    exited: { opacity: 0, transform: 'translateY(-10px)' },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="bg-white shadow-sm mb-6">
        <div className="mx-auto max-w-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center">
          <NavigateNext className="h-6 w-6 text-gray-500" />
          <h4 className="text-sm font-semibold text-gray-600">Pharmacy</h4>
          <NavigateNext className="h-6 w-6 text-gray-500" />
          <h1 className="text-sm font-semibold text-gray-600">Customer Records</h1>
        </div>
      </header>

      <main className="mx-auto max-w-auto">
        <Transition in={!!error} timeout={300} unmountOnExit>
          {(state) => (
            <div
              className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 flex justify-between items-center transition-all duration-300"
              style={{ ...transitionStyles[state] }}
            >
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <X size={20} />
              </button>
            </div>
          )}
        </Transition>

        {loading && !error && (
          <div className="text-center py-6">
            <Spinner />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
              <span className="text-sm text-gray-600">({filteredPatients.length} total)</span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-teal-300 hover:text-black transition-colors shadow-md"
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Customer
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-teal-300 hover:text-black transition-colors shadow-md"
                disabled={loading}
              >
                <Printer className="h-4 w-4 mr-2" />
                PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-teal-300 hover:text-black transition-colors shadow-md"
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </button>
            </div>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">S/N</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedPatients.length > 0 ? (
                  paginatedPatients.map((p, idx) => (
                    <tr
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className="hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{p.first_name} {p.last_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.age || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.gender || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.phone || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.email || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(p);
                            }}
                            className="flex items-center px-3 py-1 bg-indigo-900 text-white rounded-lg hover:bg-teal-300 hover:text-black transition-colors shadow-md"
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(p.id);
                            }}
                            className="flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-600">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row justify-between items-center mt-6">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
              disabled={loading}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showAddPatientModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Add New Customer</h2>
                <button
                  onClick={() => setShowAddPatientModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={newPatient.first_name}
                      onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={newPatient.last_name}
                      onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                    <input
                      type="text"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={newPatient.email}
                      onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                    <input
                      type="text"
                      value={newPatient.address}
                      onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Age</label>
                    <input
                      type="number"
                      value={newPatient.age || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, age: parseInt(e.target.value) || undefined })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                    <select
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                      disabled={loading}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddPatientModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-md"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addNewPatient}
                    className="px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-teal-300 hover:text-black transition-colors shadow-md"
                    disabled={loading}
                  >
                    Add Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDetailsModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Customer Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4 mb-8">
                  <h3 className="text-lg font-semibold text-gray-700">Edit Customer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">First Name *</label>
                      <input
                        name="first_name"
                        value={editedPatient?.first_name || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Last Name *</label>
                      <input
                        name="last_name"
                        value={editedPatient?.last_name || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                      <input
                        name="phone"
                        value={editedPatient?.phone || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                      <input
                        name="email"
                        value={editedPatient?.email || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                      <input
                        name="address"
                        value={editedPatient?.address || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Age</label>
                      <input
                        name="age"
                        type="number"
                        value={editedPatient?.age || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                      <select
                        name="gender"
                        value={editedPatient?.gender || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                        disabled={loading}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-md"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-teal-300 hover:text-black transition-colors shadow-md"
                      disabled={loading}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Customer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <p className="text-gray-700"><span className="font-medium">Name:</span> {selectedPatient.first_name} {selectedPatient.last_name}</p>
                      <p className="text-gray-700"><span className="font-medium">Phone:</span> {selectedPatient.phone || 'N/A'}</p>
                      <p className="text-gray-700"><span className="font-medium">Email:</span> {selectedPatient.email || 'N/A'}</p>
                      <p className="text-gray-700"><span className="font-medium">Address:</span> {selectedPatient.address || 'N/A'}</p>
                      <p className="text-gray-700"><span className="font-medium">Age:</span> {selectedPatient.age || 'N/A'}</p>
                      <p className="text-gray-700"><span className="font-medium">Gender:</span> {selectedPatient.gender || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mb-6">
                    <button
                      onClick={handleModalExportPDF}
                      className="flex items-center px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-teal-300 hover:text-black transition-colors shadow-md"
                      disabled={loading}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      PDF
                    </button>
                    <button
                      onClick={handleModalExportExcel}
                      className="flex items-center px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-teal-300 hover:text-black transition-colors shadow-md"
                      disabled={loading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Excel
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Transaction History</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-500 text-white">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">S/N</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount (Tsh)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Payment Method</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Approved By</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Approved At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {transactions.length ? (
                            transactions.map((txn, idx) => (
                              <tr key={txn.Payment_ID} className="hover:bg-indigo-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{idx + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{getProductName(txn.Product_ID)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{parseQuantity(txn.approved_quantity)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatAmount(txn.approved_amount)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{txn.approved_payment_method}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      txn.status === 'Approved' ? 'bg-indigo-100 text-indigo-600' : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {txn.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{txn.approved_by}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(txn.approved_at)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-600">
                                No transaction history found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientRecords;