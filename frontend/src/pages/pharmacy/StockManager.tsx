import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material';
import { Search, RefreshCw, X, AlertCircle } from 'lucide-react';
import { NavigateNext } from '@mui/icons-material';
import { API_BASE_URL } from '../../../constants';
import { Transition } from 'react-transition-group';
import Spinner from '../../components/UI/Spinner/index.tsx';

interface Medicine {
  product_id: string;
  product_name: string;
  product_category: string;
  current_quantity: number;
  product_price: number;
  expire_date: string;
  batch_no: string;
}

const StockManager: React.FC = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMedicines, setTotalMedicines] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchMedicines(page);
    }
  }, [page]);

  const fetchMedicines = async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const response = await fetch(`${API_BASE_URL}/api/medicines-cache?page=${pageNumber}`, {
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
        throw new Error(`Failed to fetch medicines: ${response.status} - ${text || 'No response data'}`);
      }
      if (!text) {
        setMedicines([]);
        setTotalPages(1);
        setTotalMedicines(0);
        return;
      }
      const rawData = JSON.parse(text);
      if (!Array.isArray(rawData.data)) throw new Error('Expected an array of medicines in data field.');

      const parsedData: Medicine[] = rawData.data.map((item: any) => ({
        product_id: String(item.product_id),
        product_name: item.product_name || 'Unknown Product',
        product_category: item.product_category || 'N/A',
        current_quantity: parseInt(item.current_quantity, 10) || 0,
        product_price: parseFloat(item.product_price) || 0,
        expire_date: item.expire_date || 'N/A',
        batch_no: item.batch_no || 'N/A',
      }));

      setMedicines(parsedData);
      setTotalPages(rawData.last_page || 1);
      setTotalMedicines(rawData.total || parsedData.length);
    } catch (err: any) {
      console.error('Fetch medicines error:', err);
      setError(err.message);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.product_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.batch_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const transitionStyles = {
    entering: { opacity: 0, transform: 'translateY(-10px)' },
    entered: { opacity: 1, transform: 'translateY(0)' },
    exiting: { opacity: 0, transform: 'translateY(-10px)' },
    exited: { opacity: 0, transform: 'translateY(-10px)' },
  };

  return (
    <main style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', background: theme.palette.background.default, boxSizing: 'border-box', padding: '16px' }}>
      <header style={{ background: theme.palette.background.paper, boxShadow: theme.shadows[1], marginBottom: 24 }}>
        <div style={{ maxWidth: '100%', padding: '16px 24px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.palette.text.primary }}>Stock Manager</h1>
        </div>
      </header>
      <main style={{ maxWidth: '100%' }}>
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
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search medicines..."
              className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
          {filteredMedicines.length > 0 && (
            <div className="text-sm text-gray-600 mt-4">
              Showing {filteredMedicines.length} of {totalMedicines} medicines
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">S/N</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Quantity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Expiry Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Batch Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMedicines.length > 0 ? (
                  filteredMedicines.map((medicine, index) => (
                    <tr key={medicine.product_id} className="hover:bg-indigo-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{medicine.product_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{medicine.product_category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{medicine.current_quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Tsh {medicine.product_price.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {medicine.expire_date !== 'N/A' ? new Date(medicine.expire_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{medicine.batch_no}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-600">No medicines found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row justify-between items-center mt-6">
          <div className="text-sm text-gray-600 mb-4 md:mb-0">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
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

export default StockManager;