import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../constants';
import Modal from '../UI/Modal/Modal';
import { AlertTriangleIcon } from 'lucide-react';
import * as XLSX from 'xlsx';

interface UploadExcelDataProviderProps {
  isOpen: boolean;
  onClose: () => void;
  onMedicineCreated: () => void;
}

interface Medicine {
  product_name: string;
  product_category: string;
  product_unit: string;
  unit_price?: string;
  product_price: string;
}

const UploadExcelDataProvider: React.FC<UploadExcelDataProviderProps> = ({ isOpen, onClose, onMedicineCreated }) => {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medicinesData, setMedicinesData] = useState<Medicine[]>([]);

  const token = localStorage.getItem('token');

  const validateSheet = (data: any[][]) => {
    if (data.length === 0) return 'Sheet is empty.';
    const requiredColumns = ['product_name', 'product_category', 'product_unit', 'product_price', 'unit_price'];
    const columnNames = data[0].map((col: any) => col.toLowerCase().trim());
    for (let i = 0; i < requiredColumns.length; i++) {
      if (columnNames[i] !== requiredColumns[i]) {
        return `Incorrect columns. Expected: ${requiredColumns.join(', ')}`;
      }
    }
    return '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target?.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      const validationError = validateSheet(data);
      if (validationError) {
        setError(validationError);
        return;
      }

      const medicines = data.slice(1).map((row: any[]): Medicine => ({
        product_name: row[0],
        product_category: row[1],
        product_unit: row[2],
        product_price: row[3],
        unit_price: row[4] || '', // Optional field
      }));

      setMedicinesData(medicines);
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Get user ID as an integer from localStorage or default to 1
      const userId = parseInt(localStorage.getItem('userId') || '1', 10);

      for (const medicine of medicinesData) {
        const response = await axios.post(
          `${API_BASE_URL}api/medicines`,
          {
            ...medicine,
            product_price: parseFloat(medicine.product_price) || 0,
            unit_price: parseFloat(medicine.unit_price || '0') || 0,
            created_by: userId, // Ensure this is an integer
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Accept': 'application/json',
            },
          }
        );

        if (response.status !== 201) {
          setError('Failed to add some medicines');
          break;
        }
      }
      onMedicineCreated();
      onClose();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Error uploading medicines' : 'Error uploading medicines');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      heading="Upload Medicines"
      size="small"
    >
      <form onSubmit={handleSubmit} className="space-y-2 max-w-sm mx-auto p-4">
        <div>
          <label className="block text-sm text-gray-700">Excel File</label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && <div className="text-red-500 text-xs">{error}</div>}

        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={isSubmitting || medicinesData.length === 0}
            className="px-4 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Importing...' : 'Import'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="w-4 h-4 text-gray-500" />
          <p>Remember:</p>
        </div>
        <p className="text-xs text-gray-500">1. Required Columns:</p>
        <p className="text-xs text-gray-500"> product_name | product_category | product_unit | product_price | unit_price</p>
        <p className="text-xs text-gray-500">2. Excel file supported are of extension (.xls) and (.xlsx)</p>
      </form>
    </Modal>
  );
};

export default UploadExcelDataProvider;