import React, { useEffect, useState } from 'react';
import { Search, Edit, Save, X, PlusIcon, FileSpreadsheet, RefreshCw } from 'lucide-react';
import Button from '../../components/UI/Button/Button';
import AddMedicineModal from '../../components/Stock-Manager/AddMedicine';
import { API_BASE_URL } from '../../../constants';
import axios from 'axios';
import UploadExcelDataProvider from '../../components/Stock-Manager/FromExcel';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

interface Medicine {
  id: string;
  product_name: string;
  product_category: string;
  product_unit: string;
  product_price: string;
}

const StockManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedMedicine, setEditedMedicine] = useState<Medicine | null>(null);
  const [isAddMedicineModalOpen, setIsAddMedicineModalOpen] = useState(false); 
  const [isUploadExcelModalOpen, setIsUploadExcelModalOpen] = useState(false); 
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const token = localStorage.getItem('token');

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine?.product_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine?.product_price?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (medicine: Medicine) => {
    setEditingId(medicine.id);
    setEditedMedicine({ ...medicine });
  };

  const handleSave = () => {
    if (editedMedicine) {
      setMedicines(
        medicines.map((medicine) =>
          medicine.id === editedMedicine.id ? editedMedicine : medicine
        )
      );
      setEditingId(null);
      setEditedMedicine(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedMedicine(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedMedicine) {
      const { name, value } = e.target;
      setEditedMedicine({
        ...editedMedicine,
        [name]: name === 'stock' ? parseInt(value) || 0 : value
      });
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}api/medicines`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': 'csrfToken',
          'Accept': 'application/json'
        }
      });

      if (response.data) {
        // Handle new API response structure
        const data = response.data.success && response.data.data ? response.data.data : response.data;
        
        if (Array.isArray(data)) {
          setMedicines(data);
        } else {
          console.error('Unexpected API response structure:', response.data);
          setError('Invalid data format received from server');
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to load medicines');
      } else {
        setError('Failed to load medicines');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddMedicineModal = () => setIsAddMedicineModalOpen(true); 
  const closeAddMedicineModal = () => setIsAddMedicineModalOpen(false); 

  const openUploadExcelModal = () => setIsUploadExcelModalOpen(true); 
  const closeUploadExcelModal = () => setIsUploadExcelModalOpen(false); 

  if (isLoading && medicines.length === 0) {
    return (
      <div style={{ 
        padding: '16px', 
        background: '#f5f5f5', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingSpinner 
          loading={true} 
          message="Loading inventory..." 
          size={48}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Stock Manager</h2>

      {/* Search */}
      <div className="flex justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search medicines..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <div className="mr-2">
            <Button variant="secondary" size="md" onClick={openAddMedicineModal}>
              <span>
                <PlusIcon />
              </span>
              New
            </Button>
          </div>
          <div>
            <Button variant="secondary" size="md" onClick={openUploadExcelModal}>
              <span>
                <FileSpreadsheet />
              </span>
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Unit
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Price
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : filteredMedicines.length > 0 ? (
                filteredMedicines.map((medicine) => (
                  <tr key={medicine.id}>
                    {editingId === medicine.id ? (
                      // Edit mode
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            name="name"
                            value={editedMedicine?.product_name || ''}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-md px-2 py-1 w-full"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            name="category"
                            value={editedMedicine?.product_category || ''}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-md px-2 py-1 w-full"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            name="unit"
                            value={editedMedicine?.product_unit || ''}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-md px-2 py-1 w-full"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            name="price"
                            value={editedMedicine?.product_price || ''}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-md px-2 py-1 w-full"
                          />
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2 justify-end">
                            <button onClick={handleSave} className="text-green-600 hover:text-green-900">
                              <Save className="h-5 w-5" />
                            </button>
                            <button onClick={handleCancel} className="text-red-600 hover:text-red-900">
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // View mode
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {medicine?.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {medicine?.product_category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {medicine?.product_unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {medicine?.product_price}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleEdit(medicine)} className="text-indigo-600 hover:text-indigo-900">
                            <Edit className="h-5 w-5" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No medicines found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <AddMedicineModal isOpen={isAddMedicineModalOpen} onClose={closeAddMedicineModal} onMedicineCreated={loadData} />
          <UploadExcelDataProvider isOpen={isUploadExcelModalOpen} onClose={closeUploadExcelModal} onMedicineCreated={loadData} />
        </div>
      </div>
    </div>
  );
};

export default StockManager;
