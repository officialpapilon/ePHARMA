import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../constants';
import Modal from '../UI/Modal/Modal';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMedicineCreated: () => void;
}

const AddMedicineModal: React.FC<AddMedicineModalProps> = ({ isOpen, onClose, onMedicineCreated }) => {
  const [formData, setFormData] = useState({
    product_name: '',
    product_category: '',
    product_unit: '',
    product_price: '',
    unit_price: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Get user ID from localStorage (assuming it's stored as 'userId' or similar) or default to 1
      const userId = parseInt(localStorage.getItem('userId') || '1', 10);

      const response = await axios.post(`${API_BASE_URL}/api/medicines`, {
        ...formData,
        product_price: parseFloat(formData.product_price) || 0,
        unit_price: parseFloat(formData.unit_price) || 0,
        created_by: userId, // Ensure this is an integer
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.status === 201) {
        onMedicineCreated();
        onClose();
      }
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Error adding medicine' : 'Error adding medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      heading="Add Medicine"
      size="small"
    >
      <form onSubmit={handleSubmit} className="space-y-2 max-w-sm mx-auto p-4">
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input
            type="text"
            name="product_name"
            value={formData.product_name}
            onChange={handleChange}
            required
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
            required
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
            required
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
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Unit price</label>
          <input
            type="number"
            name="unit_price"
            value={formData.unit_price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        

        {error && <div className="text-red-500 text-xs">{error}</div>}

        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMedicineModal;