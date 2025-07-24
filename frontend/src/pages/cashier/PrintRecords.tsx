import React, { useState, useEffect, useMemo } from 'react';
import { Search, Eye } from 'lucide-react';
import { API_BASE_URL } from '../../../constants';
import CustomDatePicker from '../../components/UI/DatePicker/CustomDatePicker';
import Spinner from '../../components/UI/Spinner';
import ReceiptModal from '../../components/receipt/ReceiptModal';

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

interface Transaction {
  id: string;
  payment_ID: string;
  customer: Customer;
  date: string;
  created_at: string;
  items: Item[];
  total: number;
  status: 'Approved';
  approved_payment_method: 'cash' | 'mobile' | 'card';
}

const PrintReceipt: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Date range filter: default to last 24 hours
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const [dateFrom, setDateFrom] = useState<Date | null>(startOfDay);
  const [dateTo, setDateTo] = useState<Date | null>(new Date());

  // Payment method filter
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<
    'All' | 'cash' | 'mobile' | 'card'
  >('All');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'All'>(5);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);

  // Cache for customers and carts
  const [customerCache, setCustomerCache] = useState<Map<string, Customer>>(new Map());
  const [cartCache, setCartCache] = useState<Map<string, Item[]>>(new Map());

  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchTransactions();
    }
  }, [page, pageSize]);

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

    const items = cart.product_purchased.map((item: any) => ({
      id: String(item.product_id),
      name: item.product_name || `Product ID ${item.product_id}`,
      quantity: item.product_quantity || 1,
      price: item.product_price || 0,
    }));
    setCartCache((prev) => new Map(prev).set(transactionId, items));
    return items;
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize === 'All' ? '1000' : pageSize.toString());

      const response = await fetch(`${API_BASE_URL}/api/payment-approve?${params.toString()}`, {
        method: 'GET',
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
        throw new Error(`Failed to fetch transactions: ${response.status} - ${text || 'No response data'}`);
      }

      if (!text) {
        setTransactions([]);
        setTotalTransactions(0);
        return;
      }

      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Expected an array of transactions');

      const mappedTransactions: Transaction[] = await Promise.all(
        data
          .filter((transaction: any) => transaction.status === 'Approved')
          .map(async (transaction: any) => {
            const customer = await fetchCustomerDetails(String(transaction.Patient_ID));
            const items = await fetchCartDetails(String(transaction.transaction_ID));
            return {
              id: String(transaction.transaction_ID),
              payment_ID: String(transaction.Payment_ID),
              customer,
              date: formatDate(transaction.created_at),
              created_at: transaction.created_at,
              items,
              total: parseFloat(transaction.approved_amount) || 0,
              status: transaction.status as 'Approved',
              approved_payment_method: transaction.approved_payment_method as 'cash' | 'mobile' | 'card',
            };
          })
      );

      setTransactions(mappedTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setTotalTransactions(mappedTransactions.length);
    } catch (err: any) {
      console.error('Fetch transactions error:', err);
      setError('Unable to fetch transactions. Please try again later.');
      setTransactions([]);
      setTotalTransactions(0);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        `${transaction.customer.first_name} ${transaction.customer.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.payment_ID.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPaymentMethod =
        paymentMethodFilter === 'All' || transaction.approved_payment_method === paymentMethodFilter;

      const transactionDate = new Date(transaction.created_at);
      const matchesDate =
        (!dateFrom || transactionDate >= dateFrom) &&
        (!dateTo || transactionDate <= dateTo);

      return matchesSearch && matchesPaymentMethod && matchesDate;
    });
  }, [transactions, searchTerm, paymentMethodFilter, dateFrom, dateTo]);

  const totalPages = pageSize === 'All' ? 1 : Math.ceil(totalTransactions / (typeof pageSize === 'number' ? pageSize : 1));

  return (
    <div className="space-y-6 p-6 bg-[#f5f7fa] min-h-screen">
      <h2 className="text-2xl font-bold text-[#2d3748]">Transaction Receipts</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          {setTimeout(() => setError(null), 5000)}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 gap-4">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#a0aec0]" />
          </div>
          <input
            type="text"
            placeholder="Search transactions or payment ID..."
            className="pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-md w-full focus:ring-[#4c8bf5] focus:border-[#4c8bf5] bg-white text-[#4a5568]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2">
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
          </div>

          <select
            value={paymentMethodFilter}
            onChange={(e) => {
              setPaymentMethodFilter(e.target.value as 'All' | 'cash' | 'mobile' | 'card');
              setPage(1);
            }}
            className="border border-[#e2e8f0] rounded-md px-3 py-2 focus:ring-[#4c8bf5] focus:border-[#4c8bf5] bg-white text-[#4a5568]"
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
        <div className="text-sm text-[#4a5568] mb-4">
          Showing transactions from {formatDate(dateFrom)} to {formatDate(dateTo)}
        </div>
      )}

      <div className="border border-[#e2e8f0] rounded-md overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e2e8f0]">
            <thead className="bg-[#f7fafc]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">
                  S/N
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">
                  Payment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-sm text-[#4a5568]">
                    <Spinner />
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      {typeof pageSize === 'number'
                        ? (page - 1) * pageSize + index + 1
                        : index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2d3748]">
                      {transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      {transaction.payment_ID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      <div>
                        <p className="font-medium">
                          {transaction.customer.first_name} {transaction.customer.last_name}
                        </p>
                        <p className="text-xs">{transaction.customer.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4a5568]">
                      {transaction.items.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {transaction.items.map((item) => (
                            <li key={item.id}>
                              {item.name} (x{item.quantity})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span>No items available</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      Tsh {transaction.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      {transaction.approved_payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="flex items-center px-3 py-1 bg-[#4c8bf5] text-white rounded-md hover:bg-[#3b7ae0] transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-sm text-[#4a5568]">
                    No transactions found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mt-4">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <span className="text-sm text-[#4a5568]">Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const newPageSize = e.target.value === 'All' ? 'All' : parseInt(e.target.value);
              setPageSize(newPageSize);
              setPage(1);
            }}
            className="border border-[#e2e8f0] rounded-md px-3 py-1 focus:ring-[#4c8bf5] focus:border-[#4c8bf5] bg-white text-[#4a5568]"
            disabled={loading}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="All">All</option>
          </select>
          <span className="text-sm text-[#4a5568]">entries</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1 || loading}
            className="px-3 py-1 border border-[#e2e8f0] rounded-md text-[#4a5568] hover:bg-[#edf2f7] disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-[#4a5568]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages || loading}
            className="px-3 py-1 border border-[#e2e8f0] rounded-md text-[#4a5568] hover:bg-[#edf2f7] disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {selectedTransaction && (
        <ReceiptModal
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
};

export default PrintReceipt;