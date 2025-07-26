import React, { useState, useEffect } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { API_BASE_URL } from '../../../constants';
import CustomDatePicker from '../../components/UI/DatePicker/CustomDatePicker';
import { useAuth } from '../../contexts/AuthContext';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  age?: number;
}

// 1. Replace Transaction and CartItem interfaces to match backend
interface CartProduct {
  product_id: string;
  product_price: number;
  product_quantity: number;
}

interface Cart {
  transaction_ID: string;
  patient_ID: string;
  patient_name?: string;
  patient_phone?: string;
  product_purchased: CartProduct[];
  total_price: string;
  created_at: string;
  updated_at: string;
}

interface PaymentResult {
  payment_ID?: string;
  transaction_ID?: string;
  status: string;
  message?: string;
  dispense_id?: string; // Added dispense_id
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

const Payment: React.FC = () => {
  const theme = useTheme();
  const [searchCustomerName, setSearchCustomerName] = useState('');
  const [searchCustomerId, setSearchCustomerId] = useState('');
  const [searchTransactionId, setSearchTransactionId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateFrom, setDateFrom] = useState<Date | null>(new Date());
  const [dateTo, setDateTo] = useState<Date | null>(new Date());

  const { user: authUser } = useAuth();

  const [pendingCarts, setPendingCarts] = useState<Cart[]>([]);
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [paymentApprovals, setPaymentApprovals] = useState<any[]>([]);

  // Add state for customer and product lookup
  const [productMap, setProductMap] = useState<Record<string, string>>({});

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

  // Fetch all payment approvals
  const fetchPaymentApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/payment-approve`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });
      const text = await response.text();
      if (!response.ok) return;
      const data = JSON.parse(text);
      if (!Array.isArray(data)) return;
      setPaymentApprovals(data);
    } catch {}
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchPendingCarts();
      fetchProducts();
      fetchPaymentApprovals();
    }
  }, []);

  useEffect(() => {
    if (medicines.length > 0) {
      // fetchPendingTransactions(); // This function is no longer used
    }
  }, [medicines]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/medicines-cache`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to fetch medicines: ${response.status}`);
      const data = JSON.parse(text);
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch medicine data');
    } finally {
      setLoading(false);
    }
  };

  const getMedicineName = (productId: string): string => {
    const medicine = medicines.find((m) => String(m.product_id) === String(productId));
    return medicine ? medicine.product_name : 'Unknown Product';
  };

  // 3. Fetch pending carts from /api/carts
  const fetchPendingCarts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const url = `${API_BASE_URL}/api/carts?status=sent_to_cashier`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to fetch carts: ${response.status}`);
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Expected an array of carts');
      
      // The enhanced cart response now includes all patient and product details
      setPendingCarts(data);
      
    } catch (err: any) {
      setError(err.message);
      setPendingCarts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTransaction = (transaction: any) => {
    // setSelectedTransaction(transaction); // This state is no longer used
    setAmountPaid(transaction.total.toString());
    // setChange(0); // This state is no longer used
    setPaymentResult(null);
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountPaid(value);
    if (selectedCart) {
      const paid = parseFloat(value) || 0;
      // setChange(Math.max(0, paid - parseFloat(selectedCart.total_price))); // This state is no longer used
    }
  };

  // 4. Payment approval logic
  const handleApprovePayment = async () => {
    if (!selectedCart || parseFloat(amountPaid) < parseFloat(selectedCart.total_price)) {
      alert('Invalid amount or no cart selected.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      // Ensure all fields are present and correct types
      const userId = authUser?.id ? Number(authUser.id) : Number(localStorage.getItem('user_id')) || 1;
      
      // Calculate total quantity from all products
      const totalQuantity = selectedCart.product_purchased.reduce((sum, p) => sum + Number(p.product_quantity), 0);
      
      const payload = {
        Patient_ID: String(selectedCart.patient_ID),
        Product_ID: String(selectedCart.product_purchased[0].product_id), // Keep first product for compatibility
        transaction_ID: String(selectedCart.transaction_ID),
        status: 'Approved',
        approved_by: userId,
        approved_quantity: totalQuantity.toString(),
        approved_amount: parseFloat(amountPaid).toString(),
        approved_payment_method: paymentMethod,
      };
      const response = await fetch(`${API_BASE_URL}/api/payment-approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      if (!response.ok) {
        let errorMsg = `Failed to approve payment: ${response.status}`;
        try {
          const errData = JSON.parse(text);
          if (errData.message) errorMsg = errData.message;
          if (errData.errors) errorMsg += ' ' + Object.values(errData.errors).flat().join(' ');
        } catch {}
        throw new Error(errorMsg);
      }
      
      const result = JSON.parse(text);
      
      // Debug logging
      console.log('Payment Approval Response:', result);
      console.log('Dispense ID from response:', result.data?.dispense_id);
      
      setPaymentResult({ 
        status: 'Approved', 
        message: 'Payment approved successfully',
        payment_ID: result.data?.Payment_ID,
        transaction_ID: result.data?.transaction_ID,
        dispense_id: result.data?.dispense_id
      });
      
      // Debug logging for payment result
      console.log('Payment Result set:', {
        status: 'Approved', 
        message: 'Payment approved successfully',
        payment_ID: result.data?.Payment_ID,
        transaction_ID: result.data?.transaction_ID,
        dispense_id: result.data?.dispense_id
      });
      
      setPendingCarts((prev) => prev.filter(cart => cart.transaction_ID !== selectedCart.transaction_ID)); // Remove paid cart
      setSelectedCart(null);
      setAmountPaid('');
      await fetchPendingCarts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Filter out paid carts
  const paidTransactionIds = new Set(paymentApprovals.map((a) => String(a.transaction_ID)));
  const unpaidCarts = pendingCarts.filter(cart => !paidTransactionIds.has(String(cart.transaction_ID)));

  // Use unpaidCarts in the UI instead of pendingCarts
  const filterTransactions = () => {
    return unpaidCarts
      .filter((t) => {
        const transactionDate = new Date(t.created_at);
        const start = dateFrom ? new Date(dateFrom.setHours(0, 0, 0, 0)) : new Date(0);
        const end = dateTo ? new Date(dateTo.setHours(23, 59, 59, 999)) : new Date();
        const matchesDate = transactionDate >= start && transactionDate <= end;
        const matchesCustomerName = String(t.patient_ID || '').toLowerCase().includes(searchCustomerName.toLowerCase());
        const matchesCustomerId = String(t.patient_ID || '').toLowerCase().includes(searchCustomerId.toLowerCase());
        const matchesTransactionId = String(t.transaction_ID || '').toLowerCase().includes(searchTransactionId.toLowerCase());
        return matchesDate && matchesCustomerName && matchesCustomerId && matchesTransactionId;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const filteredTransactions = filterTransactions();

  // Pagination logic
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const setPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.palette.background.default, padding: 32 }}>
      <div style={{ maxWidth: '100%', margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 32 }}>Pending Transactions</h1>

        {error && (
          <div style={{ textAlign: 'center', color: theme.palette.error.main, background: theme.palette.error.light, padding: 16, borderRadius: 8, marginBottom: 24, border: `1px solid ${theme.palette.error.main}` }}>
            {error}
            {setTimeout(() => setError(null), 5000)}
          </div>
        )}

        {paymentResult && (
          <div style={{ textAlign: 'center', color: theme.palette.success.main, background: theme.palette.success.light, padding: 16, borderRadius: 8, marginBottom: 24, border: `1px solid ${theme.palette.success.main}` }}>
            <p style={{ fontWeight: 600, margin: 0, marginBottom: 8 }}>Payment Approved Successfully!</p>
            <p style={{ margin: 0, marginBottom: 4 }}>Payment ID: {paymentResult.payment_ID}</p>
            <p style={{ margin: 0, marginBottom: 4 }}>Transaction ID: {paymentResult.transaction_ID}</p>
            <p style={{ margin: 0 }}>Status: {paymentResult.status}</p>
            {setTimeout(() => setPaymentResult(null), 5000)}
          </div>
        )}

        {/* Filters */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], marginBottom: 24, border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
           
           <div>
             <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 8 }}>Start Date</label>
             <CustomDatePicker
               selected={dateFrom}
               onChange={(date: Date | null) => {
                 setDateFrom(date);
                 setPage(1);
               }}
               disabled={loading}
             />
           </div>
           <div>
             <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 8 }}>End Date</label>
             <CustomDatePicker
               selected={dateTo}
               onChange={(date: Date | null) => {
                 setDateTo(date);
                 setPage(1);
               }}
               disabled={loading}
             />
           </div>

            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 8 }}>Customer Name</label>
              <div style={{ position: 'absolute', inset: '0 0 0 0', display: 'flex', alignItems: 'center', paddingLeft: 12, pointerEvents: 'none', top: 24 }}>
                <Search style={{ height: 20, width: 20, color: theme.palette.text.disabled }} />
              </div>
              <input
                type="text"
                placeholder="Search by name..."
                style={{ 
                  paddingLeft: 40, 
                  paddingRight: 16, 
                  paddingTop: 12, 
                  paddingBottom: 12, 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: 8, 
                  width: '100%', 
                  boxSizing: 'border-box',
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontSize: 14
                }}
                value={searchCustomerName}
                onChange={(e) => setSearchCustomerName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 8 }}>Customer ID</label>
              <div style={{ position: 'absolute', inset: '0 0 0 0', display: 'flex', alignItems: 'center', paddingLeft: 12, pointerEvents: 'none', top: 24 }}>
                <Search style={{ height: 20, width: 20, color: theme.palette.text.disabled }} />
              </div>
              <input
                type="text"
                placeholder="Search by ID..."
                style={{ 
                  paddingLeft: 40, 
                  paddingRight: 16, 
                  paddingTop: 12, 
                  paddingBottom: 12, 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: 8, 
                  width: '100%', 
                  boxSizing: 'border-box',
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontSize: 14
                }}
                value={searchCustomerId}
                onChange={(e) => setSearchCustomerId(e.target.value)}
                disabled={loading}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 8 }}>Transaction ID</label>
              <div style={{ position: 'absolute', inset: '0 0 0 0', display: 'flex', alignItems: 'center', paddingLeft: 12, pointerEvents: 'none', top: 24 }}>
                <Search style={{ height: 20, width: 20, color: theme.palette.text.disabled }} />
              </div>
              <input
                type="text"
                placeholder="Search by ID..."
                style={{ 
                  paddingLeft: 40, 
                  paddingRight: 16, 
                  paddingTop: 12, 
                  paddingBottom: 12, 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: 8, 
                  width: '100%', 
                  boxSizing: 'border-box',
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontSize: 14
                }}
                value={searchTransactionId}
                onChange={(e) => setSearchTransactionId(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Pending Transactions Table */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 24 }}>Pending Carts</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: theme.palette.background.default }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>S/N</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>Transaction ID</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>Patient Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>Phone</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>Total Price</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '16px', textAlign: 'center', fontSize: 14, color: theme.palette.text.secondary }}>Loading...</td>
                  </tr>
                ) : filteredTransactions.length ? (
                  paginatedTransactions.map((cart, idx) => (
                    <tr 
                      key={cart.transaction_ID} 
                      onClick={() => setSelectedCart(cart)} 
                      style={{ 
                        cursor: 'pointer',
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.palette.action.hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>{startIndex + idx + 1}</td>
                      <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>{cart.transaction_ID}</td>
                      <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>
                        {cart.patient_name}
                      </td>
                      <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>
                        {cart.patient_phone}
                      </td>
                      <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>Tsh {cart.total_price}</td>
                      <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.primary }}>{new Date(cart.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '16px', textAlign: 'center', fontSize: 14, color: theme.palette.text.secondary }}>No pending transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', sm: { flexDirection: 'row' }, justifyContent: 'space-between', alignItems: 'center', marginTop: 24, gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: theme.palette.text.secondary }}>Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  style={{ 
                    border: `1px solid ${theme.palette.divider}`, 
                    borderRadius: 8, 
                    padding: '8px 12px',
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ 
                    padding: 8, 
                    borderRadius: 8, 
                    border: `1px solid ${theme.palette.divider}`, 
                    color: theme.palette.text.primary, 
                    background: theme.palette.background.paper,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ChevronLeft style={{ height: 20, width: 20 }} />
                </button>
                <span style={{ fontSize: 14, color: theme.palette.text.secondary }}>
                  Page {currentPage} of {totalPages} ({totalItems} items)
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ 
                    padding: 8, 
                    borderRadius: 8, 
                    border: `1px solid ${theme.palette.divider}`, 
                    color: theme.palette.text.primary, 
                    background: theme.palette.background.paper,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ChevronRight style={{ height: 20, width: 20 }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Details Modal */}
        {selectedCart && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: theme.palette.background.paper, padding: 32, borderRadius: 16, boxShadow: theme.shadows[3], maxWidth: 700, width: '100%', border: `1px solid ${theme.palette.divider}`, maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 600, color: theme.palette.text.primary }}>Payment Details - TXN: {selectedCart.transaction_ID}</h2>
                <button 
                  onClick={() => setSelectedCart(null)} 
                  style={{ color: theme.palette.text.secondary, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X style={{ height: 24, width: 24 }} />
                </button>
              </div>
              
              {/* Patient Information */}
              <div style={{ background: theme.palette.background.default, padding: 16, borderRadius: 8, marginBottom: 24, border: `1px solid ${theme.palette.divider}` }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 12 }}>Patient Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 14, color: theme.palette.text.secondary, margin: '4px 0' }}><strong>Patient ID:</strong></p>
                    <p style={{ fontSize: 14, color: theme.palette.text.primary, margin: '4px 0' }}>{selectedCart.patient_ID}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: theme.palette.text.secondary, margin: '4px 0' }}><strong>Patient Name:</strong></p>
                    <p style={{ fontSize: 14, color: theme.palette.text.primary, margin: '4px 0' }}>
                      {selectedCart.patient_name}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: theme.palette.text.secondary, margin: '4px 0' }}><strong>Phone:</strong></p>
                    <p style={{ fontSize: 14, color: theme.palette.text.primary, margin: '4px 0' }}>
                      {selectedCart.patient_phone}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: theme.palette.text.secondary, margin: '4px 0' }}><strong>Date:</strong></p>
                    <p style={{ fontSize: 14, color: theme.palette.text.primary, margin: '4px 0' }}>{new Date(selectedCart.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 12 }}>Items</h3>
                <div style={{ background: theme.palette.background.default, borderRadius: 8, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: theme.palette.background.paper }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary }}>Item</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary }}>Quantity</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary }}>Price</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCart.product_purchased.map((item, index) => (
                        <tr key={index} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.primary }}>
                            {productMap[item.product_id] || `Product ID: ${item.product_id}`}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.primary, textAlign: 'center' }}>
                            {item.product_quantity}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.primary, textAlign: 'right' }}>
                            Tsh {parseFloat(item.product_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.primary, textAlign: 'right' }}>
                            Tsh {(parseFloat(item.product_price) * item.product_quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ background: theme.palette.background.paper }}>
                      <tr>
                        <td colSpan={3} style={{ padding: '12px 16px', fontSize: 16, fontWeight: 600, color: theme.palette.text.primary, textAlign: 'right' }}>
                          Total:
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 16, fontWeight: 600, color: theme.palette.text.primary, textAlign: 'right' }}>
                          Tsh {parseFloat(selectedCart.total_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 12 }}>Payment Method</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {['cash', 'card', 'mobile'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method as 'cash' | 'card' | 'mobile')}
                      style={{
                        padding: '12px 16px',
                        border: `2px solid ${paymentMethod === method ? theme.palette.primary.main : theme.palette.divider}`,
                        borderRadius: 8,
                        background: paymentMethod === method ? theme.palette.primary.main : theme.palette.background.paper,
                        color: paymentMethod === method ? theme.palette.primary.contrastText : theme.palette.text.primary,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount and Change Calculation */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 12 }}>Payment</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 8 }}>Amount Paid (Tsh)</label>
                    <input 
                      type="number" 
                      min={selectedCart.total_price} 
                      step="0.01" 
                      value={amountPaid} 
                      onChange={handleAmountPaidChange} 
                      style={{ 
                        border: `1px solid ${theme.palette.divider}`, 
                        borderRadius: 8, 
                        padding: '12px 16px', 
                        width: '100%', 
                        boxSizing: 'border-box',
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        fontSize: 14
                      }} 
                      placeholder="0.00" 
                      disabled={loading} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 8 }}>Change (Tsh)</label>
                    <div style={{ 
                      border: `1px solid ${theme.palette.divider}`, 
                      borderRadius: 8, 
                      padding: '12px 16px', 
                      background: theme.palette.background.default,
                      color: theme.palette.text.primary,
                      fontSize: 14,
                      fontWeight: 600
                    }}>
                      {Math.max(0, (parseFloat(amountPaid) || 0) - parseFloat(selectedCart.total_price)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, paddingTop: 16 }}>
                <button 
                  onClick={() => setSelectedCart(null)} 
                  style={{ 
                    padding: '12px 16px', 
                    background: theme.palette.error.main, 
                    color: theme.palette.error.contrastText, 
                    borderRadius: 8, 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApprovePayment} 
                  disabled={loading || !amountPaid || parseFloat(amountPaid) < parseFloat(selectedCart.total_price)} 
                  style={{ 
                    padding: '12px 24px', 
                    background: theme.palette.success.main, 
                    color: theme.palette.success.contrastText, 
                    borderRadius: 8, 
                    border: 'none', 
                    cursor: loading || !amountPaid || parseFloat(amountPaid) < parseFloat(selectedCart.total_price) ? 'not-allowed' : 'pointer',
                    opacity: loading || !amountPaid || parseFloat(amountPaid) < parseFloat(selectedCart.total_price) ? 0.7 : 1,
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Approve Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;