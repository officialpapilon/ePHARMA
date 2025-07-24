import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Upload } from 'lucide-react';
import { API_BASE_URL } from '../../../constants';
import AddMedicineModal from '../../components/Stock-Manager/AddMedicine';
import EditMedicineModal from '../../components/Stock-Manager/EditMedicine';
import UploadExcelDataProvider from '../../components/Stock-Manager/FromExcel';
import Modal from '../../components/UI/Modal/Modal';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Item {
  product_id: number;
  product_name: string;
  product_category: string;
  product_unit: string;
  product_price: string;
  unit_price: string | null;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

const ItemsManager = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchItems();
    }
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/api/medicines`, {
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
        throw new Error(`Failed to fetch items: ${response.status} - ${text || 'Unknown error'}`);
      }

      const data: Item[] = JSON.parse(text);
      setItems(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(`Error fetching items: ${err.message}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/medicines/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Failed to delete item: ${response.status} - ${text || 'Unknown error'}`);
      }
      fetchItems();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(`Error deleting item: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = (updatedMedicine: Item) => {
    setItems(items.map(item =>
      item.product_id === updatedMedicine.product_id ? updatedMedicine : item
    ));
    fetchItems();
  };

  const handleExportToExcel = () => {
    const exportData = filteredItems.map(item => ({
      'Product ID': item.product_id,
      'Name': item.product_name,
      'Category': item.product_category,
      'Unit of Measure': item.product_unit,
      'Price (Tsh)': item.product_price,
      'Unit Price (Tsh)': item.unit_price || '0',
      'Created By': item.created_by,
      'Created At': new Date(item.created_at).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

    saveAs(data, `Items_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredItems = items.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-auto mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Items Manager</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Excel
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              disabled={loading}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Item
            </button>
            <button
              onClick={handleExportToExcel}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              disabled={loading}
            >
              <Upload className="h-5 w-5 mr-2" />
              Export Excel
            </button>
            
          </div>
        </div>

        {error && (
          <div className="text-center text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
        )}
        {loading && (
          <div className="text-center">Loading...</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-center text-gray-600 bg-gray-50 p-3 rounded-md">No items found.</div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            className="pl-10 pr-4 py-2 border rounded-md w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S/N</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit of Measure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item, index) => (
                <tr key={item.product_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.product_category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.product_unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">Tsh {item.product_price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                   Tsh {item.unit_price ? `${item.unit_price}` : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2 justify-end">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setIsEditModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400"
                        disabled={loading}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.product_id)}
                        className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                        disabled={loading}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AddMedicineModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onMedicineCreated={() => {
            fetchItems();
            setIsAddModalOpen(false);
          }}
        />

        {selectedItem && (
          <EditMedicineModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedItem(null);
            }}
            medicine={{
              id: selectedItem.product_id.toString(),
              product_name: selectedItem.product_name,
              product_category: selectedItem.product_category,
              product_unit: selectedItem.product_unit,
              product_price: parseFloat(selectedItem.product_price),
              unit_price: selectedItem.unit_price ? parseFloat(selectedItem.unit_price) : 0,
              created_by: selectedItem.created_by.toString(),
            }}
            onSave={(updatedMedicine) => {
              handleSaveEdit({
                ...updatedMedicine,
                product_id: parseInt(updatedMedicine.id),
                product_price: updatedMedicine.product_price.toString(),
                unit_price: selectedItem.unit_price,
                created_by: parseInt(updatedMedicine.created_by),
                updated_by: null,
                created_at: selectedItem.created_at,
                updated_at: new Date().toISOString(),
              });
              setIsEditModalOpen(false);
              setSelectedItem(null);
            }}
          />
        )}

        <UploadExcelDataProvider
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onMedicineCreated={() => {
            fetchItems();
            setIsUploadModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default ItemsManager;
