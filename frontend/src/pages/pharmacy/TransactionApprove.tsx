import React, { useState, useEffect, useMemo } from 'react';
import { Search, Check, Printer, AlertCircle, RefreshCw, X } from 'lucide-react';
import { NavigateNext } from '@mui/icons-material';
import { API_BASE_URL } from '../../../constants';
import Spinner from '../../components/UI/Spinner/index.tsx';
import CustomDatePicker from '../../components/UI/DatePicker/CustomDatePicker.tsx';
import { Transition } from 'react-transition-group';
import { useTheme } from '@mui/material';

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

// 1. Replace Transaction interface to match backend
interface ApprovedTransaction {
  id: string | null;
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

  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved'>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'All' | 'cash' | 'mobile' | 'card'>('All');

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'All'>(5);
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
      if (!Array.isArray(data)) return;
      setDispensedRecords(data);
    } catch {}
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

  useEffect(() => {
    if (medicines.length > 0) {
      // fetchTransactions(); // This line is no longer needed as transactions are fetched directly
    }
  }, [medicines, dispenseResult, page, pageSize]);

  const fetchCustomerDetails = async (patientId: string): Promise<Customer> => {
    if (customerCache.has(patientId)) {
      return customerCache.get(patientId)!;
    }
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/customers/${patientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });
    const text = await response.text();
    if (!response.ok) {
      console.warn(`Failed to fetch customer ${patientId}: ${text}`);
      const customer = { id: patientId, first_name: 'Unknown', last_name: 'Patient', phone: 'N/A' };
      setCustomerCache((prev) => new Map(prev).set(patientId, customer));
      return customer;
    }
    const data = JSON.parse(text);
    const customer = {
      id: String(data.id),
      first_name: data.first_name || 'Unknown',
      last_name: data.last_name || 'Patient',
      phone: data.phone || 'N/A',
    };
    setCustomerCache((prev) => new Map(prev).set(patientId, customer));
    return customer;
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
      if (!response.ok) {
        throw new Error('Failed to fetch medicines');
      }
      const data: Medicine[] = JSON.parse(text);
      setMedicines(data);
    } catch (err: any) {
      console.error('Error fetching medicines:', err);
      setError('Failed to fetch medicine data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCartDetails = async (transactionId: string): Promise<Item[]> => {
    if (cartCache.has(transactionId)) {
      return cartCache.get(transactionId)!;
    }
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/carts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });
    const text = await response.text();
    if (!response.ok) {
      console.warn(`Failed to fetch cart for transaction ${transactionId}: ${text}`);
      return [];
    }
    const data = JSON.parse(text);
    const cart = Array.isArray(data) ? data.find((c: any) => String(c.transaction_ID) === transactionId) : null;
    if (!cart || !cart.product_purchased) {
      console.warn(`No cart found for transaction ${transactionId}`);
      return [];
    }

    const items = cart.product_purchased.map((item: any) => {
      const medicine = medicines.find((m) => String(m.product_id) === String(item.product_id));
      if (!medicine) {
        console.warn(`Medicine not found for product_id ${item.product_id}`);
      }
      return {
        id: String(item.product_id),
        name: medicine ? medicine.product_name : `Product ID ${item.product_id}`,
        quantity: item.product_quantity || 1,
        price: item.product_price || 0,
      };
    });
    setCartCache((prev) => new Map(prev).set(transactionId, items));
    return items;
  };

  // 2. Fetch approved transactions from /api/payment-approve
  const fetchApprovedTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const url = `${API_BASE_URL}/api/payment-approve`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to fetch approved transactions: ${response.status}`);
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Expected an array of approved transactions');
      setApprovedTransactions(data);
    } catch (err: any) {
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
      const payload = {
        Payment_ID: String(selectedTransaction.id), // Ensure string and correct key
        transaction_id: String(selectedTransaction.transaction_ID),
        transaction_status: selectedTransaction.status,
        payment_method: selectedTransaction.approved_payment_method,
        approved_payment_method: selectedTransaction.approved_payment_method,
        total_price: String(selectedTransaction.approved_amount),
        created_by: String(user.id || '1'), // Ensure string
        Patient_ID: String(selectedTransaction.Patient_ID),
        Product_ID: String(selectedTransaction.Product_ID),
        quantity: String(selectedTransaction.approved_quantity),
        items: [
          {
            product_id: String(selectedTransaction.Product_ID),
            quantity: String(selectedTransaction.approved_quantity),
          },
        ],
      };
      const response = await fetch(`${API_BASE_URL}/api/dispense/${selectedTransaction.Product_ID}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to dispense: ${response.status} - ${text}`);
      setDispenseResult({ success: true, message: 'Dispensed successfully!' });
      setApprovedTransactions((prev) => prev.filter(txn => txn.transaction_ID !== selectedTransaction.transaction_ID)); // Remove dispensed transaction
      setSelectedTransaction(null);
      await fetchApprovedTransactions();
    } catch (err: any) {
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
      Phone: ${transaction.patient_name}
      Date: ${new Date(transaction.created_at).toLocaleString()}
      Items:
      ${transaction.product_name}: ${transaction.approved_quantity} x Tsh ${transaction.approved_amount}
      Total: Tsh ${transaction.approved_amount}
      Status: ${transaction.status}
      Payment Method: ${transaction.approved_payment_method}
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
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase());

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

  const totalPages = pageSize === 'All' ? 1 : Math.ceil(approvedTransactions.length / (typeof pageSize === 'number' ? pageSize : 1));

  const transitionStyles = {
    entering: { opacity: 0, transform: 'translateY(-10px)' },
    entered: { opacity: 1, transform: 'translateY(0)' },
    exiting: { opacity: 0, transform: 'translateY(-10px)' },
    exited: { opacity: 0, transform: 'translateY(-10px)' },
  };

  // Filter out already-dispensed transactions
  const dispensedPaymentIds = new Set(dispensedRecords.map((d) => String(d.Payment_ID)));
  const dispensedTransactionIds = new Set(dispensedRecords.map((d) => String(d.transaction_id)));
  const undispensedTransactions = approvedTransactions.filter(txn => !dispensedPaymentIds.has(String(txn.id)) && !dispensedTransactionIds.has(String(txn.transaction_ID)));

  return (
    <main style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', background: theme.palette.background.default, boxSizing: 'border-box', padding: '16px' }}>
      <header className="bg-white shadow-sm">
        <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <NavigateNext className="h-6 w-6 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-600">Pharmacy</h4>
            <NavigateNext className="h-6 w-6 text-gray-500" />
            <h1 className="text-sm font-semibold text-gray-600">Dispense Approval</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchApprovedTransactions}
              className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
              disabled={loading}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
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

        <Transition in={!!dispenseResult} timeout={300} unmountOnExit>
          {(state) => (
            <div
              className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6 transition-all duration-300"
              style={{ ...transitionStyles[state] }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">Dispense Successful!</p>
                  <p>{dispenseResult?.message}</p>
                  <p>Transaction ID: {dispenseResult?.transaction_id || 'N/A'}</p>
                  {dispenseResult?.payment_ID && <p>Payment ID: {dispenseResult.payment_ID}</p>}
                  {dispenseResult?.dispense_id && <p>Dispense ID: {dispenseResult.dispense_id}</p>}
                </div>
                <button
                  onClick={() =>
                    printReceipt(
                      selectedTransaction ||
                        approvedTransactions.find((t) => t.transaction_ID === dispenseResult?.transaction_id) || {
                          id: dispenseResult?.transaction_id || 'N/A',
                          payment_ID: dispenseResult?.payment_ID || 'N/A',
                          patient_name: 'Unknown Patient',
                          created_at: new Date().toISOString(),
                          approved_quantity: '0',
                          approved_amount: '0',
                          approved_payment_method: 'cash',
                        }
                    )
                  }
                  className="flex items-center px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-teal-300 hover:text-black transition-colors shadow-md"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Print Receipt
                </button>
              </div>
            </div>
          )}
        </Transition>

        {loading && !error && !dispenseResult && (
          <div className="text-center py-6">
            <Spinner />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions or payment ID..."
                className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex items-center space-x-4">
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-600">Start Date</label>
                  <CustomDatePicker
                    selected={dateFrom}
                    onChange={(date: Date | null) => {
                      setDateFrom(date);
                      setPage(1);
                    }}
                    disabled={loading}
                    className="mt-1 block w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                  />
                </div>
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-600">End Date</label>
                  <CustomDatePicker
                    selected={dateTo}
                    onChange={(date: Date | null) => {
                      setDateTo(date);
                      setPage(1);
                    }}
                    disabled={loading}
                    className="mt-1 block w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'All' | 'Approved' | 'Pending' | 'Cancelled');
                  setPage(1);
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                disabled={loading}
              >
                <option value="All">All Status</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value ="Cancelled">Cancelled</option>
              </select>
              <select
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value as 'All' | 'cash' | 'mobile' | 'card');
                  setPage(1);
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                disabled={loading}
              >
                <option value="All">All Payment Methods</option>
                <option value="cash">Cash</option>
                <option value="mobile">Mobile</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
          {(dateFrom || dateTo) && (
            <div className="text-sm text-gray-600 mt-4">
              Showing transactions from {formatDate(dateFrom)} to {formatDate(dateTo)}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Approved Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">S/N</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-600">Loading...</td></tr>
                ) : undispensedTransactions.length ? (
                  undispensedTransactions.map((txn, idx) => (
                    <tr key={txn.transaction_ID} onClick={() => setSelectedTransaction(txn)} className="hover:bg-blue-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{txn.transaction_ID}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{txn.Patient_ID}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{txn.patient_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{productMap[txn.Product_ID] || txn.product_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{txn.approved_quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Tsh {txn.approved_amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(txn.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-600">No transactions to approve.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Approve Dispense - TXN: {selectedTransaction.transaction_ID}</h2>
                <button onClick={() => setSelectedTransaction(null)} className="text-gray-500 hover:text-gray-700"><X className="h-6 w-6" /></button>
              </div>
              <div className="mb-4">
                <p><b>Patient ID:</b> {selectedTransaction.Patient_ID}</p>
                <p><b>Patient Name:</b> {selectedTransaction.patient_name}</p>
                <p><b>Product:</b> {productMap[selectedTransaction.Product_ID] || selectedTransaction.product_name}</p>
                <p><b>Quantity:</b> {selectedTransaction.approved_quantity}</p>
                <p><b>Total:</b> Tsh {selectedTransaction.approved_amount}</p>
                <p><b>Date:</b> {new Date(selectedTransaction.created_at).toLocaleString()}</p>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => setSelectedTransaction(null)} className="px-4 py-2 bg-red-600 text-white rounded-lg mr-4">Cancel</button>
                <button onClick={handleDispense} disabled={loading} className="px-6 py-3 bg-green-600 text-white rounded-lg">Dispense</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row justify-between items-center mt-6">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="text-sm text-gray-600">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newPageSize = e.target.value === 'All' ? 'All' : parseInt(e.target.value);
                setPageSize(newPageSize);
                setPage(1);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
              disabled={loading}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="All">All</option>
            </select>
            <span className="text-sm text-gray-600">entries</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </main>
  );
};

export default DispenseApproval;