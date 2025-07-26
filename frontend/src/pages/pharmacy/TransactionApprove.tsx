import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { 
  Search, 
  Check, 
  Printer, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Filter,
  Calendar,
  User,
  Package,
  DollarSign,
  Clock
} from 'lucide-react';
import { NavigateNext } from '@mui/icons-material';
import { API_BASE_URL } from '../../../constants';
import Spinner from '../../components/UI/Spinner/index.tsx';
import CustomDatePicker from '../../components/UI/DatePicker/CustomDatePicker.tsx';
import { Transition } from 'react-transition-group';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface Item {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface ApprovedTransaction {
  id: string | null;
  Payment_ID?: string; // Add this field to match API response
  Patient_ID: string;
  patient_name: string;
  Product_ID: string;
  product_name: string;
  current_quantity: number;
  transaction_ID: string;
  status: string;
  approved_by: string;
  approved_by_name: string;
  approved_at: string;
  approved_quantity: string;
  approved_amount: string;
  approved_payment_method: string;
  dispense_id: string;
  created_at: string;
  updated_at: string;
}

interface DispenseResult {
  success: boolean;
  message: string;
  transaction_id?: string;
  payment_ID?: string;
  dispense_id?: string;
}

interface Medicine {
  id: number;
  product_id: string;
  product_name: string;
  current_quantity: number;
  batch_no: string;
  product_price: string;
  product_category: string;
  expire_date: string;
}

const DispenseApproval: React.FC = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [transactions, setTransactions] = useState<ApprovedTransaction[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dispenseResult, setDispenseResult] = useState<DispenseResult | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<ApprovedTransaction | null>(null);

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const [dateFrom, setDateFrom] = useState<Date | null>(startOfDay);
  const [dateTo, setDateTo] = useState<Date | null>(new Date());

  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid'>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'All' | 'cash' | 'mobile' | 'card'>('All');

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'All'>(10);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);

  const [customerCache, setCustomerCache] = useState<Map<string, Customer>>(new Map());
  const [cartCache, setCartCache] = useState<Map<string, Item[]>>(new Map());

  const [approvedTransactions, setApprovedTransactions] = useState<ApprovedTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<ApprovedTransaction | null>(null);

  // Add state for medicines/product lookup if not present
  const [productMap, setProductMap] = useState<Record<string, string>>({});
  const [dispensedRecords, setDispensedRecords] = useState<any[]>([]);

  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (date: Date | string | null): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Fetch all medicines and build a map
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/medicines-cache`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });
      const text = await response.text();
      if (!response.ok) return;
      const data = JSON.parse(text);
      const arr = Array.isArray(data.data) ? data.data : data;
      const map: Record<string, string> = {};
      arr.forEach((m: any) => { map[String(m.product_id)] = m.product_name; });
      setProductMap(map);
    } catch {}
  };

  // Fetch all dispensed records
  const fetchDispensedRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/dispensed`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });
      const text = await response.text();
      if (!response.ok) return;
      const data = JSON.parse(text);
      console.log('Dispensed records:', data);
      setDispensedRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching dispensed records:', error);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchApprovedTransactions();
      fetchProducts();
      fetchDispensedRecords();
    }
  }, []);

  // 2. Fetch approved transactions from /api/payment-approve
  const fetchApprovedTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const url = `${API_BASE_URL}/api/payment-approve`;
      console.log('Fetching approved transactions from:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });
      const text = await response.text();
      console.log('Raw response from payment-approve:', text);
      
      if (!response.ok) throw new Error(`Failed to fetch approved transactions: ${response.status}`);
      const data = JSON.parse(text);
      console.log('Parsed data from payment-approve:', data);
      
      if (!Array.isArray(data)) throw new Error('Expected an array of approved transactions');
      
      // Log each transaction to check for dispense_id
      data.forEach((transaction, index) => {
        console.log(`Transaction ${index}:`, {
          transaction_ID: transaction.transaction_ID,
          dispense_id: transaction.dispense_id,
          status: transaction.status
        });
      });
      
      setApprovedTransactions(data);
    } catch (err: any) {
      console.error('Error fetching approved transactions:', err);
      setError(err.message);
      setApprovedTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // 3. Dispense logic
  const handleDispense = async () => {
    if (!selectedTransaction) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('Selected transaction for dispensing:', selectedTransaction);
      console.log('Dispense ID from selected transaction:', selectedTransaction.dispense_id);
      
      // Check if dispense_id exists and is valid
      if (!selectedTransaction.dispense_id || selectedTransaction.dispense_id === 'null' || selectedTransaction.dispense_id === 'undefined') {
        console.error('Invalid dispense_id:', selectedTransaction.dispense_id);
        throw new Error('Dispense ID is missing or invalid. Please ensure payment was approved correctly. Contact administrator if issue persists.');
      }
      
      console.log('Dispensing with ID:', selectedTransaction.dispense_id);
      
      // Use dispense_id instead of product_id
      const response = await fetch(`${API_BASE_URL}/api/dispense/${selectedTransaction.dispense_id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          created_by: String(user.id || '1'),
        }),
      });
      
      const text = await response.text();
      console.log('Dispense response:', text);
      
      if (!response.ok) {
        let errorMsg = `Failed to dispense: ${response.status}`;
        try {
          const errData = JSON.parse(text);
          if (errData.message) errorMsg = errData.message;
        } catch {}
        throw new Error(errorMsg);
      }
      
      const result = JSON.parse(text);
      setDispenseResult({ 
        success: true, 
        message: 'Dispensed successfully!',
        transaction_id: result.data?.transaction_id,
        payment_ID: result.data?.payment_id,
        dispense_id: result.data?.dispense_id
      });
      
      // Remove dispensed transaction from list
      setApprovedTransactions((prev) => prev.filter(txn => txn.transaction_ID !== selectedTransaction.transaction_ID));
      setSelectedTransaction(null);
      
      // Refresh the list
      await fetchApprovedTransactions();
    } catch (err: any) {
      console.error('Dispense error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = (transaction: ApprovedTransaction) => {
    const receipt = `
      Transaction ID: ${transaction.transaction_ID}
      Payment ID: ${transaction.id}
      Patient: ${transaction.patient_name}
      Date: ${formatDateTime(transaction.created_at)}
      Items:
      ${transaction.product_name}: ${transaction.approved_quantity} x Tsh ${transaction.approved_amount}
      Total: Tsh ${transaction.approved_amount}
      Status: ${transaction.status}
      Payment Method: ${transaction.approved_payment_method}
      Approved By: ${transaction.approved_by_name}
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<pre>' + receipt + '</pre>');
      printWindow.document.close();
      printWindow.print();
    } else {
      alert('Please allow popups to print the receipt.');
    }
  };

  const filteredTransactions = useMemo(() => {
    return approvedTransactions.filter((transaction) => {
      const matchesSearch =
        `${transaction.patient_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.transaction_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.dispense_id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || transaction.status === statusFilter;

      const matchesPaymentMethod =
        paymentMethodFilter === 'All' || transaction.approved_payment_method === paymentMethodFilter;

      const transactionDate = new Date(transaction.created_at);
      const matchesDate =
        (!dateFrom || transactionDate >= dateFrom) &&
        (!dateTo || transactionDate <= dateTo);

      return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDate;
    });
  }, [approvedTransactions, searchTerm, statusFilter, paymentMethodFilter, dateFrom, dateTo]);

  const totalPages = pageSize === 'All' ? 1 : Math.ceil(filteredTransactions.length / (typeof pageSize === 'number' ? pageSize : 1));

  const transitionStyles = {
    entering: { opacity: 0, transform: 'translateY(-10px)' },
    entered: { opacity: 1, transform: 'translateY(0)' },
    exiting: { opacity: 0, transform: 'translateY(-10px)' },
    exited: { opacity: 0, transform: 'translateY(-10px)' },
  };

  // Filter out already-dispensed transactions
  const dispensedTransactionIds = new Set(dispensedRecords.map((d) => String(d.transaction_id)));
  const undispensedTransactions = filteredTransactions.filter(txn => {
    console.log('Checking transaction:', {
      transaction_ID: txn.transaction_ID,
      Payment_ID: txn.Payment_ID,
      id: txn.id,
      dispense_id: txn.dispense_id,
      isDispensedByTransactionId: dispensedTransactionIds.has(String(txn.transaction_ID))
    });
    return !dispensedTransactionIds.has(String(txn.transaction_ID));
  });

  return (
    <main style={{ 
      minHeight: '100vh', 
      width: '100%', 
      maxWidth: '100vw', 
      background: theme.palette.background.default, 
      boxSizing: 'border-box', 
      padding: '16px' 
    }}>
      {/* Header */}
      <header style={{ 
        background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`, 
        boxShadow: theme.shadows[2],
        borderRadius: 16,
        marginBottom: 24
      }}>
        <div style={{ 
          maxWidth: 1440, 
          margin: '0 auto', 
          padding: '16px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package style={{ color: theme.palette.primary.contrastText, width: 24, height: 24 }} />
            <span style={{ color: theme.palette.primary.contrastText, fontWeight: 600, fontSize: 20 }}>Dispense Approval</span>
            <NavigateNext className="h-6 w-6" style={{ color: theme.palette.primary.light, width: 20, height: 20 }} />
            <span style={{ color: theme.palette.primary.contrastText, fontWeight: 500 }}>Transaction Management</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={fetchApprovedTransactions}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.2)',
                color: theme.palette.primary.contrastText,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.2s'
              }}
              disabled={loading}
            >
              <RefreshCw style={{ width: 16, height: 16 }} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Error and Success Messages */}
      <Transition in={!!error} timeout={300} unmountOnExit>
        {(state) => (
          <div
            style={{
              background: theme.palette.error.light,
              border: `1px solid ${theme.palette.error.main}`,
              color: theme.palette.error.dark,
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.3s',
              opacity: transitionStyles[state].opacity,
              transform: transitionStyles[state].transform
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle style={{ width: 20, height: 20 }} />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError(null)} 
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                color: theme.palette.error.dark
              }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
        )}
      </Transition>

      <Transition in={!!dispenseResult} timeout={300} unmountOnExit>
        {(state) => (
          <div
            style={{
              background: theme.palette.success.light,
              border: `1px solid ${theme.palette.success.main}`,
              color: theme.palette.success.dark,
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
              transition: 'all 0.3s',
              opacity: transitionStyles[state].opacity,
              transform: transitionStyles[state].transform
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, margin: '0 0 8px 0' }}>Dispense Successful!</p>
                <p style={{ margin: '0 0 4px 0' }}>{dispenseResult?.message}</p>
                <p style={{ margin: '0 0 4px 0', fontSize: 14 }}>Transaction ID: {dispenseResult?.transaction_id || 'N/A'}</p>
                {dispenseResult?.payment_ID && <p style={{ margin: '0 0 4px 0', fontSize: 14 }}>Payment ID: {dispenseResult.payment_ID}</p>}
                {dispenseResult?.dispense_id && <p style={{ margin: '0 0 4px 0', fontSize: 14 }}>Dispense ID: {dispenseResult.dispense_id}</p>}
              </div>
              <button
                onClick={() => printReceipt(selectedTransaction || approvedTransactions.find((t) => t.transaction_ID === dispenseResult?.transaction_id) || {
                  id: dispenseResult?.transaction_id || 'N/A',
                  transaction_ID: dispenseResult?.transaction_id || 'N/A',
                  patient_name: 'Unknown Patient',
                  created_at: new Date().toISOString(),
                  approved_quantity: '0',
                  approved_amount: '0',
                  approved_payment_method: 'cash',
                  approved_by_name: 'Unknown',
                  Product_ID: '',
                  product_name: '',
                  current_quantity: 0,
                  approved_by: '',
                  approved_at: '',
                  dispense_id: '',
                  updated_at: '',
                })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  background: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <Printer style={{ width: 16, height: 16 }} />
                Print Receipt
              </button>
            </div>
          </div>
        )}
      </Transition>

      {loading && !error && !dispenseResult && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spinner />
        </div>
      )}

      {/* Filters Section */}
      <div style={{ 
        background: theme.palette.background.paper, 
        borderRadius: 16, 
        padding: 24, 
        marginBottom: 24,
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Filter style={{ width: 20, height: 20, color: theme.palette.primary.main }} />
          <h3 style={{ margin: 0, color: theme.palette.text.primary, fontWeight: 600 }}>Filters</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search style={{ 
              position: 'absolute', 
              left: 12, 
              top: '50%', 
              transform: 'translateY(-50%)', 
              width: 18, 
              height: 18, 
              color: theme.palette.text.secondary 
            }} />
            <input
              type="text"
              placeholder="Search transactions..."
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                background: theme.palette.background.default,
                color: theme.palette.text.primary,
                fontSize: 14
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Date Range */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Calendar style={{ width: 16, height: 16, color: theme.palette.text.secondary }} />
            <CustomDatePicker
              selected={dateFrom}
              onChange={(date: Date | null) => setDateFrom(date)}
              disabled={loading}
              placeholderText="From Date"
              style={{
                padding: '8px 12px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                background: theme.palette.background.default,
                color: theme.palette.text.primary,
                fontSize: 14
              }}
            />
            <span style={{ color: theme.palette.text.secondary }}>to</span>
            <CustomDatePicker
              selected={dateTo}
              onChange={(date: Date | null) => setDateTo(date)}
              disabled={loading}
              placeholderText="To Date"
              style={{
                padding: '8px 12px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                background: theme.palette.background.default,
                color: theme.palette.text.primary,
                fontSize: 14
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Paid')}
            style={{
              padding: '12px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
              background: theme.palette.background.default,
              color: theme.palette.text.primary,
              fontSize: 14,
              cursor: 'pointer'
            }}
            disabled={loading}
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value as 'All' | 'cash' | 'mobile' | 'card')}
            style={{
              padding: '12px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
              background: theme.palette.background.default,
              color: theme.palette.text.primary,
              fontSize: 14,
              cursor: 'pointer'
            }}
            disabled={loading}
          >
            <option value="All">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="mobile">Mobile</option>
            <option value="card">Card</option>
          </select>
        </div>

        {(dateFrom || dateTo) && (
          <div style={{ marginTop: 12, fontSize: 14, color: theme.palette.text.secondary }}>
            Showing transactions from {formatDate(dateFrom)} to {formatDate(dateTo)}
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div style={{ 
        background: theme.palette.background.paper, 
        borderRadius: 16, 
        overflow: 'hidden',
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`
      }}>
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: theme.palette.background.default
        }}>
          <h2 style={{ 
            margin: 0, 
            color: theme.palette.text.primary, 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Package style={{ width: 20, height: 20 }} />
            Approved Transactions ({undispensedTransactions.length})
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: theme.palette.background.default }}>
              <tr>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary, 
                  textTransform: 'uppercase', 
                  letterSpacing: 'wider',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>S/N</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary, 
                  textTransform: 'uppercase', 
                  letterSpacing: 'wider',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>Transaction ID</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary, 
                  textTransform: 'uppercase', 
                  letterSpacing: 'wider',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>Patient</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary, 
                  textTransform: 'uppercase', 
                  letterSpacing: 'wider',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>Product</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary, 
                  textTransform: 'uppercase', 
                  letterSpacing: 'wider',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>Quantity</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary, 
                  textTransform: 'uppercase', 
                  letterSpacing: 'wider',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>Amount</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary, 
                  textTransform: 'uppercase', 
                  letterSpacing: 'wider',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>Payment Method</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary, 
                  textTransform: 'uppercase', 
                  letterSpacing: 'wider',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>Approved By</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary, 
                  textTransform: 'uppercase', 
                  letterSpacing: 'wider',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>Date</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary, 
                  textTransform: 'uppercase', 
                  letterSpacing: 'wider',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ 
                    padding: '40px 16px', 
                    textAlign: 'center', 
                    fontSize: 14, 
                    color: theme.palette.text.secondary 
                  }}>
                    <Spinner />
                  </td>
                </tr>
              ) : undispensedTransactions.length ? (
                undispensedTransactions.map((txn, idx) => (
                  <tr 
                    key={txn.transaction_ID} 
                    style={{ 
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.palette.action.hover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>{idx + 1}</td>
                    <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{txn.transaction_ID}</div>
                        <div style={{ fontSize: 12, color: theme.palette.text.secondary }}>Dispense: {txn.dispense_id}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{txn.patient_name}</div>
                        <div style={{ fontSize: 12, color: theme.palette.text.secondary }}>ID: {txn.Patient_ID}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>
                      {productMap[txn.Product_ID] || txn.product_name}
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>{txn.approved_quantity}</td>
                    <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary, fontWeight: 600 }}>
                      Tsh {parseFloat(txn.approved_amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        background: theme.palette.primary.light,
                        color: theme.palette.primary.dark
                      }}>
                        {txn.approved_payment_method}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>
                      {txn.approved_by_name}
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>
                      {formatDateTime(txn.created_at)}
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>
                      <button
                        onClick={() => setSelectedTransaction(txn)}
                        style={{
                          padding: '8px 16px',
                          background: theme.palette.success.main,
                          color: theme.palette.success.contrastText,
                          borderRadius: 6,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Check style={{ width: 14, height: 14 }} />
                        Dispense
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ 
                    padding: '40px 16px', 
                    textAlign: 'center', 
                    fontSize: 14, 
                    color: theme.palette.text.secondary 
                  }}>
                    <Package style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.5 }} />
                    <div>No transactions to dispense.</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>All approved transactions have been dispensed.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispense Modal */}
      {selectedTransaction && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 50,
          padding: 24
        }}>
          <div style={{ 
            background: theme.palette.background.paper, 
            borderRadius: 16, 
            boxShadow: theme.shadows[3], 
            maxWidth: 600, 
            width: '100%',
            border: `1px solid ${theme.palette.divider}`
          }}>
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <h2 style={{ 
                margin: 0, 
                color: theme.palette.text.primary, 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <Package style={{ width: 20, height: 20 }} />
                Confirm Dispense
              </h2>
              <button 
                onClick={() => setSelectedTransaction(null)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: theme.palette.text.secondary
                }}
              >
                <X style={{ width: 24, height: 24 }} />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 16, 
                marginBottom: 24 
              }}>
                <div style={{ 
                  background: theme.palette.background.default, 
                  padding: 16, 
                  borderRadius: 8,
                  border: `1px solid ${theme.palette.divider}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <User style={{ width: 16, height: 16, color: theme.palette.primary.main }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase' }}>
                      Patient Information
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: theme.palette.text.primary }}>
                    <div><strong>Name:</strong> {selectedTransaction.patient_name}</div>
                    <div><strong>ID:</strong> {selectedTransaction.Patient_ID}</div>
                  </div>
                </div>

                <div style={{ 
                  background: theme.palette.background.default, 
                  padding: 16, 
                  borderRadius: 8,
                  border: `1px solid ${theme.palette.divider}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Package style={{ width: 16, height: 16, color: theme.palette.primary.main }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase' }}>
                      Product Information
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: theme.palette.text.primary }}>
                    <div><strong>Product:</strong> {productMap[selectedTransaction.Product_ID] || selectedTransaction.product_name}</div>
                    <div><strong>Quantity:</strong> {selectedTransaction.approved_quantity}</div>
                  </div>
                </div>

                <div style={{ 
                  background: theme.palette.background.default, 
                  padding: 16, 
                  borderRadius: 8,
                  border: `1px solid ${theme.palette.divider}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <DollarSign style={{ width: 16, height: 16, color: theme.palette.primary.main }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase' }}>
                      Payment Details
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: theme.palette.text.primary }}>
                    <div><strong>Amount:</strong> Tsh {parseFloat(selectedTransaction.approved_amount).toLocaleString()}</div>
                    <div><strong>Method:</strong> {selectedTransaction.approved_payment_method}</div>
                  </div>
                </div>

                <div style={{ 
                  background: theme.palette.background.default, 
                  padding: 16, 
                  borderRadius: 8,
                  border: `1px solid ${theme.palette.divider}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Clock style={{ width: 16, height: 16, color: theme.palette.primary.main }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase' }}>
                      Transaction Details
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: theme.palette.text.primary }}>
                    <div><strong>ID:</strong> {selectedTransaction.transaction_ID}</div>
                    <div><strong>Dispense ID:</strong> {selectedTransaction.dispense_id}</div>
                  </div>
                </div>
              </div>

              <div style={{ 
                background: theme.palette.warning.light, 
                padding: 16, 
                borderRadius: 8,
                border: `1px solid ${theme.palette.warning.main}`,
                marginBottom: 24
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AlertCircle style={{ width: 16, height: 16, color: theme.palette.warning.dark }} />
                  <span style={{ fontWeight: 600, color: theme.palette.warning.dark }}>Important</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: theme.palette.warning.dark }}>
                  This action will dispense {selectedTransaction.approved_quantity} units of {productMap[selectedTransaction.Product_ID] || selectedTransaction.product_name} 
                  to {selectedTransaction.patient_name}. The stock will be automatically reduced.
                </p>
              </div>
            </div>

            <div style={{ 
              padding: '16px 24px', 
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 12 
            }}>
              <button 
                onClick={() => setSelectedTransaction(null)} 
                style={{
                  padding: '12px 24px',
                  background: theme.palette.grey[300],
                  color: theme.palette.text.primary,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDispense} 
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: loading ? theme.palette.action.disabledBackground : theme.palette.success.main,
                  color: loading ? theme.palette.text.disabled : theme.palette.success.contrastText,
                  borderRadius: 8,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {loading ? <Spinner /> : <Check style={{ width: 16, height: 16 }} />}
                Confirm Dispense
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default DispenseApproval;