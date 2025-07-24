import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { API_BASE_URL } from '../../../constants';

interface Medicine {
  product_id: string; // Use product_id as per API payload
  product_name: string;
  product_category: string;
  current_quantity: number;
  product_price: number;
  expiry_date: string; // Optional, not present in sample payload
  batch_no: string; // Matches API's batch_no
}

const StockManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchMedicines();
    }
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const response = await fetch(`${API_BASE_URL}/api/medicines-cache`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      console.log('Raw response from /medicines-cache:', text);
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
        return;
      }
      const rawData = JSON.parse(text);
      if (!Array.isArray(rawData)) throw new Error('Expected an array of medicines.');

      // Map API response to Medicine interface using correct field names
      const parsedData: Medicine[] = rawData.map((item: any) => {
        console.log('Mapping item:', item); // Debug each item
        return {
          product_id: String(item.product_id), // Use product_id instead of id
          product_name: item.product_name || 'Unknown Product',
          product_category: item.product_category || 'N/A',
          current_quantity: parseInt(item.current_quantity, 10) || 0,
          product_price: parseFloat(item.product_price) || 0,
          expiry_date: item.expire_date || 'N/A', // Use expire_date from API
          batch_no: item.batch_no || 'N/A', // Use batch_no from API
        };
      });

      console.log('Parsed medicines:', parsedData);
      setMedicines(parsedData);
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

  return (
    <div className="space-y-6 p-6 bg-[#f5f7fa]">
      <h2 className="text-lg font-semibold text-[#2d3748]">Stock Manager</h2>

      {/* Search */}
      <div className="relative w-full md:w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[#a0aec0]" />
        </div>
        <input
          type="text"
          placeholder="Search medicines..."
          className="pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-md w-full focus:ring-[#4c8bf5] focus:border-[#4c8bf5] bg-white text-[#4a5568]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Loading and Error States */}
      {loading && <div className="text-center text-[#4a5568]">Loading...</div>}
      {error && <div className="text-center text-red-700 bg-red-50 p-3 rounded-md">{error}</div>}

      {/* Medicines Table */}
      <div className="border border-[#e2e8f0] rounded-md overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e2e8f0]">
            <thead className="bg-[#f7fafc]">
              <tr>
              <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider"
                >
                  S/N
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider"
                >
                  Quantity
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider"
                >
                  Expiry Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider"
                >
                  Batch Number
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredMedicines.length > 0 ? (
                filteredMedicines.map((medicine) => (
                  <tr key={medicine.product_id} className="hover:bg-[#edf2f7] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2d3748]">
                      {medicines.indexOf(medicine) + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2d3748]">
                      {medicine.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      {medicine.product_category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      {medicine.current_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      Tsh {medicine.product_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      {medicine.expiry_date !== 'N/A'
                        ? new Date(medicine.expiry_date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      {medicine.batch_no}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-[#4a5568]">
                    No medicines found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockManager;

