import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../constants';
import Modal from '../../components/UI/Modal/Modal';
import Button from '../../components/UI/Button/Button';

interface Medicine {
  id: string;
  product_name: string;
  product_category: string;
  product_unit: string;
  product_price: number;
  unit_price: number;
  created_by: string;
}

interface EditMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine;
  onSave: (updatedMedicine: Medicine) => void;
}

const EditMedicineModal: React.FC<EditMedicineModalProps> = ({ isOpen, onClose, medicine, onSave }) => {
  const [formData, setFormData] = useState(medicine);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Get user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || 1;

    const updatedMedicine = {
      ...formData,
      product_price: parseFloat(formData.product_price.toString()) || 0,
      unit_price: formData.unit_price ? parseFloat(formData.unit_price.toString()) : null,
      updated_by: userId
    };

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/medicines/${medicine.id}`,
        updatedMedicine,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        onSave(updatedMedicine);
        onClose();
      }
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Error' : 'Error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      heading="Edit Medicine"
      size="small" // Smaller modal size
    >
      <div className="space-y-2 max-w-sm mx-auto p-4"> {/* Compact and fixed width */}
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input
            type="text"
            name="product_name"
            value={formData.product_name}
            onChange={handleChange}
            className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Category</label>
          <input
            type="text"
            name="product_category"
            value={formData.product_category}
            onChange={handleChange}
            className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Unit</label>
          <input
            type="text"
            name="product_unit"
            value={formData.product_unit}
            onChange={handleChange}
            className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Price</label>
          <input
            type="number"
            name="product_price"
            value={formData.product_price}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Unit Price</label>
          <input
            type="number"
            name="unit_price"
            value={formData.unit_price}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && <div className="text-red-500 text-xs">{error}</div>}

        <div className="flex justify-end space-x-2 mt-3">
          <Button
            onClick={onClose}
            variant="secondary"
            className="px-4 py-1 text-sm rounded-md hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            className="px-4 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditMedicineModal;