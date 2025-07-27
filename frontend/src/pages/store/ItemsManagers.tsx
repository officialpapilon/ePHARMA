import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Download,
  Upload
} from 'lucide-react';
import { useTheme } from '@mui/material';
import { API_BASE_URL } from '../../../constants';
import DataTable from '../../components/common/DataTable/DataTable';
import { TableColumn } from '../../../types';
import AddMedicineModal from '../../components/Stock-Manager/AddMedicine';
import EditMedicineModal from '../../components/Stock-Manager/EditMedicine';
import UploadExcelDataProvider from '../../components/Stock-Manager/FromExcel';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Item {
  id: number;
  product_id: string;
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

const ItemsManager: React.FC = () => {
  const theme = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchItems();
    }
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm]);

  const filterItems = () => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.product_id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
    setCurrentPage(1);
  };

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

      const result = JSON.parse(text);
      if (result.success && Array.isArray(result.data)) {
        setItems(result.data);
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(`Error fetching items: ${err.message}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (item: Item) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!item || !item.product_id) {
        throw new Error('Invalid item data');
      }

      const response = await fetch(`${API_BASE_URL}/api/medicines/${item.product_id}`, {
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

      await fetchItems();
      setSuccess('Item deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(`Error deleting item: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item: Item) => {
    if (!item || !item.product_id) {
      console.error('Invalid item data:', item);
      return;
    }
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedMedicine: Item) => {
    setItems(items.map(item =>
      item.product_id === updatedMedicine.product_id ? updatedMedicine : item
    ));
    fetchItems();
    setSuccess('Item updated successfully');
    setTimeout(() => setSuccess(null), 3000);
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
    setSuccess('Items exported successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  // DataTable columns
  const columns: TableColumn[] = [
    {
      key: 'product_name',
      header: 'Product Name',
      sortable: true,
      width: '25%'
    },
    {
      key: 'product_category',
      header: 'Category',
      sortable: true,
      width: '15%'
    },
    {
      key: 'product_unit',
      header: 'Unit',
      sortable: true,
      width: '10%'
    },
    {
      key: 'product_price',
      header: 'Price (Tsh)',
      sortable: true,
      width: '15%',
      render: (row: any) => {
        if (!row) return '-';
        return `Tsh ${parseFloat(row.product_price || '0').toLocaleString()}`;
      }
    },
    {
      key: 'unit_price',
      header: 'Unit Price (Tsh)',
      sortable: true,
      width: '15%',
      render: (row: any) => {
        if (!row) return '-';
        return row.unit_price ? `Tsh ${parseFloat(row.unit_price).toLocaleString()}` : '-';
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      width: '15%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => handleEditItem(row)}
              style={{
                padding: '4px 8px',
                background: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteItem(row)}
              style={{
                padding: '4px 8px',
                background: theme.palette.error.main,
                color: theme.palette.error.contrastText,
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Delete
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div style={{
      padding: '16px',
      background: theme.palette.background.default,
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <h2 style={{
          fontSize: 24,
          fontWeight: 700,
          color: theme.palette.text.primary
        }}>
          Items Management
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={fetchItems}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: loading ? 0.7 : 1
            }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
            Refresh
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '8px 16px',
              background: theme.palette.success.main,
              color: theme.palette.success.contrastText,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Add Item
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div style={{
          background: theme.palette.success.light,
          border: `1px solid ${theme.palette.success.main}`,
          color: theme.palette.success.dark,
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle style={{ width: 16, height: 16 }} />
          {success}
        </div>
      )}

      {error && (
        <div style={{
          background: theme.palette.error.light,
          border: `1px solid ${theme.palette.error.main}`,
          color: theme.palette.error.dark,
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertCircle style={{ width: 16, height: 16 }} />
          {error}
        </div>
      )}

      {/* Search and Actions */}
      <div style={{
        background: theme.palette.background.paper,
        padding: 24,
        borderRadius: 16,
        boxShadow: theme.shadows[1],
        marginBottom: 24,
        border: `1px solid ${theme.palette.divider}`
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.palette.text.secondary,
                width: 16,
                height: 16
              }} />
              <input
                type="text"
                placeholder="Search items by name, category, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  background: theme.palette.background.default,
                  color: theme.palette.text.primary,
                  fontSize: 14
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              style={{
                padding: '8px 16px',
                background: theme.palette.info.main,
                color: theme.palette.info.contrastText,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Upload style={{ width: 16, height: 16 }} />
              Import Excel
            </button>
            <button
              onClick={handleExportToExcel}
              disabled={filteredItems.length === 0}
              style={{
                padding: '8px 16px',
                background: theme.palette.warning.main,
                color: theme.palette.warning.contrastText,
                border: 'none',
                borderRadius: 8,
                cursor: filteredItems.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: filteredItems.length === 0 ? 0.7 : 1
              }}
            >
              <Download style={{ width: 16, height: 16 }} />
              Export Excel
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div style={{
          marginTop: 16,
          padding: '12px 0',
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{
            fontSize: 14,
            color: theme.palette.text.secondary,
            margin: 0
          }}>
            Showing {filteredItems.length} of {items.length} items
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
          <p style={{
            fontSize: 14,
            color: theme.palette.text.secondary,
            margin: 0
          }}>
            Total Items: {items.length}
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div style={{
        background: theme.palette.background.paper,
        borderRadius: 16,
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden'
      }}>
        <DataTable
          columns={columns}
          data={filteredItems}
          loading={loading}
          emptyMessage="No items found. Add some items to get started."
        />
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddMedicineModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onMedicineCreated={() => {
            setIsAddModalOpen(false);
            fetchItems();
          }}
        />
      )}

      {isEditModalOpen && selectedItem && (
        <EditMedicineModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedItem(null);
          }}
          medicine={{
            id: selectedItem.product_id,
            product_name: selectedItem.product_name,
            product_category: selectedItem.product_category,
            product_unit: selectedItem.product_unit,
            product_price: parseFloat(selectedItem.product_price),
            unit_price: selectedItem.unit_price ? parseFloat(selectedItem.unit_price) : 0,
            created_by: selectedItem.created_by.toString(),
          }}
          onSave={(updatedMedicine) => {
            handleSaveEdit({
              ...selectedItem,
              product_id: updatedMedicine.id,
              product_name: updatedMedicine.product_name,
              product_category: updatedMedicine.product_category,
              product_unit: updatedMedicine.product_unit,
              product_price: updatedMedicine.product_price.toString(),
              unit_price: updatedMedicine.unit_price.toString(),
              created_by: parseInt(updatedMedicine.created_by),
              updated_at: new Date().toISOString(),
            });
            setIsEditModalOpen(false);
            setSelectedItem(null);
          }}
        />
      )}

      {isUploadModalOpen && (
        <UploadExcelDataProvider
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onMedicineCreated={() => {
            setIsUploadModalOpen(false);
            fetchItems();
          }}
        />
      )}
    </div>
  );
};

export default ItemsManager;
