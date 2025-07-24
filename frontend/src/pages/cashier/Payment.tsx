import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Check, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [searchCustomerName, setSearchCustomerName] = useState('');
  const [searchCustomerId, setSearchCustomerId] = useState('');
  const [searchTransactionId, setSearchTransactionId] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null); // Keep for now, but not used in new logic
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]); // Keep for now, but not used in new logic
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
  const [customerMap, setCustomerMap] = useState<Record<string, Customer>>({});
  const [productMap, setProductMap] = useState<Record<string, string>>({});

  // Fetch all customers and build a map
  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
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
      const map: Record<string, Customer> = {};
      data.forEach((c: any) => { map[String(c.id)] = c; });
      setCustomerMap(map);
    } catch {}
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
      fetchCustomers();
      fetchProducts();
      fetchPaymentApprovals();
    }
  }, []);

  useEffect(() => {
    if (medicines.length > 0) {
      // fetchPendingTransactions(); // This function is no longer used
    }
  }, [medicines]);

  const fetchCustomerDetails = async (patientId: string): Promise<Customer> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const url = `${API_BASE_URL}/api/customers/${patientId}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });
      const text = await response.text();
      if (!response.ok) {
        if (response.status === 404) {
          return { id: patientId, first_name: 'Unknown', last_name: 'Customer', phone: 'N/A' };
        }
        throw new Error(`Failed to fetch customer: ${response.status}`);
      }
      const data = JSON.parse(text);
      return {
        id: String(data.id),
        first_name: data.first_name || 'Unknown',
        last_name: data.last_name || '',
        phone: data.phone || 'N/A',
        age: data.age || undefined,
      };
    } catch (err: any) {
      console.error(`Error fetching customer ${patientId}:`, err.message);
      return { id: patientId, first_name: 'Unknown', last_name: 'Customer', phone: 'N/A' };
    }
  };

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
      setPendingCarts(data);
    } catch (err: any) {
      setError(err.message);
      setPendingCarts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setAmountPaid(transaction.total.toString());
    setChange(0);
    setPaymentResult(null);
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountPaid(value);
    if (selectedCart) {
      const paid = parseFloat(value) || 0;
      setChange(Math.max(0, paid - parseFloat(selectedCart.total_price)));
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
      const payload = {
        Patient_ID: String(selectedCart.patient_ID),
        Product_ID: String(selectedCart.product_purchased[0].product_id),
        transaction_ID: String(selectedCart.transaction_ID),
        status: 'Approved',
        approved_by: userId,
        approved_quantity: selectedCart.product_purchased.reduce((sum, p) => sum + Number(p.product_quantity), 0).toString(),
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
      setPaymentResult({ status: 'Approved', message: 'Payment approved successfully' });
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-auto mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pending Transactions</h1>

        {error && (
          <div className="text-center text-red-700 bg-red-50 p-4 rounded-lg shadow-sm mb-6">
            {error}
            {setTimeout(() => setError(null), 5000)}
          </div>
        )}

        {paymentResult && (
          <div className="text-center text-green-700 bg-green-50 p-4 rounded-lg shadow-sm mb-6 animate-fade-out">
            <p className="font-bold">Payment Approved Successfully!</p>
            <p>Payment ID: {paymentResult.payment_ID}</p>
            <p>Transaction ID: {paymentResult.transaction_ID}</p>
            <p>Status: {paymentResult.status}</p>
            {setTimeout(() => setPaymentResult(null), 5000)}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
           
           <div className="w-48">
                         <label className="text-sm text-[#4a5568]">Start Date</label>
                         <CustomDatePicker
                           selected={dateFrom}
                           onChange={(date: Date | null) => {
                             setDateFrom(date);
                             setPage(1);
                           }}
                           disabled={loading}
                         />
                       </div>
                       <div className="w-48">
                         <label className="text-sm text-[#4a5568]">End Date</label>
                         <CustomDatePicker
                           selected={dateTo}
                           onChange={(date: Date | null) => {
                             setDateTo(date);
                             setPage(1);
                           }}
                           disabled={loading}
                         />
                       </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none top-6">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 shadow-sm transition-all duration-200"
                value={searchCustomerName}
                onChange={(e) => setSearchCustomerName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none top-6">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by ID..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 shadow-sm transition-all duration-200"
                value={searchCustomerId}
                onChange={(e) => setSearchCustomerId(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none top-6">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by ID..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 shadow-sm transition-all duration-200"
                value={searchTransactionId}
                onChange={(e) => setSearchTransactionId(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Pending Transactions Table */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Pending Carts</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">S/N</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-600">Loading...</td></tr>
                ) : filteredTransactions.length ? (
                  paginatedTransactions.map((cart, idx) => (
                    <tr key={cart.transaction_ID} onClick={() => setSelectedCart(cart)} className="hover:bg-blue-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{startIndex + idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{cart.transaction_ID}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{cart.patient_ID}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customerMap[cart.patient_ID]?.first_name || ''} {customerMap[cart.patient_ID]?.last_name || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Tsh {cart.total_price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(cart.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-600">No pending transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-all duration-200"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages} ({totalItems} items)
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-all duration-200"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Details Modal */}
        {selectedCart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Cart Details - TXN: {selectedCart.transaction_ID}</h2>
                <button onClick={() => setSelectedCart(null)} className="text-gray-500 hover:text-gray-700"><X className="h-6 w-6" /></button>
              </div>
              <div className="mb-4">
                <p><b>Patient ID:</b> {selectedCart.patient_ID}</p>
                <p><b>Patient Name:</b> {customerMap[selectedCart.patient_ID]?.first_name || ''} {customerMap[selectedCart.patient_ID]?.last_name || ''}</p>
                <p><b>Total Price:</b> Tsh {selectedCart.total_price}</p>
                <p><b>Date:</b> {new Date(selectedCart.created_at).toLocaleString()}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Products</h3>
                <ul>
                  {selectedCart.product_purchased.map((p, i) => (
                    <li key={i}>{productMap[p.product_id] || p.product_id} - Qty: {p.product_quantity} - Price: Tsh {p.product_price}</li>
                  ))}
                </ul>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (Tsh)</label>
                <input type="number" min={selectedCart.total_price} step="0.01" value={amountPaid} onChange={handleAmountPaidChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full" placeholder="0.00" disabled={loading} />
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => setSelectedCart(null)} className="px-4 py-2 bg-red-600 text-white rounded-lg mr-4">Cancel</button>
                <button onClick={handleApprovePayment} disabled={loading || !amountPaid || parseFloat(amountPaid) < parseFloat(selectedCart.total_price)} className="px-6 py-3 bg-green-600 text-white rounded-lg">Approve Payment</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;