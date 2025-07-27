import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Plus, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Save,
  Trash2,
  Package
} from 'lucide-react';
import { useTheme } from '@mui/material';
import { API_BASE_URL } from '../../../constants';
import DataTable from '../../components/common/DataTable/DataTable';
import { TableColumn } from '../../../types';
import UploadExcelDataProvider from '../../components/Stock-Manager/FromExcel';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface StockItem {
  id?: string;
  product_id: string;
  product_name: string;
  batch_no: string;
  quantity: number;
  unit_price: number;
  buying_price: number;
  total_price: number;
  supplier: string;
  manufacturer: string;
  expiry_date: string;
  received_date: string;
  notes: string;
  isNew?: boolean;
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

const ReceivingStock: React.FC = () => {
  const theme = useTheme();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<StockItem>({
    product_id: '',
    product_name: '',
    batch_no: '',
    quantity: 0,
    unit_price: 0,
    buying_price: 0,
    total_price: 0,
    supplier: '',
    manufacturer: '',
    expiry_date: '',
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
    isNew: true
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    filterItems();
  }, [stockItems, searchTerm]);

  const filterItems = () => {
    let filtered = stockItems;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batch_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/api/medicines-cache`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch medicines: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setMedicines(result.data);
      } else {
        setMedicines([]);
      }
    } catch (err: any) {
      console.error('Fetch medicines error:', err);
      setError(err.message);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.product_id || !newItem.quantity || !newItem.batch_no) {
      setError('Please fill in all required fields');
      return;
    }

    const selectedMedicine = medicines.find(m => m.product_id === newItem.product_id);
    if (!selectedMedicine) {
      setError('Selected product not found');
      return;
    }

    const item: StockItem = {
      ...newItem,
      id: `new-${Date.now()}`,
      product_name: selectedMedicine.product_name,
      total_price: newItem.quantity * newItem.unit_price,
      isNew: true
    };

    setStockItems(prev => [...prev, item]);
    setNewItem({
      product_id: '',
      product_name: '',
      batch_no: '',
      quantity: 0,
      unit_price: 0,
      buying_price: 0,
      total_price: 0,
      supplier: '',
      manufacturer: '',
      expiry_date: '',
      received_date: new Date().toISOString().split('T')[0],
      notes: '',
      isNew: true
    });
    setIsAddModalOpen(false);
    setSuccess('Item added successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleRemoveItem = (id: string) => {
    setStockItems(prev => prev.filter(item => item.id !== id));
    setSuccess('Item removed successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSaveAll = async () => {
    if (stockItems.length === 0) {
      setError('No items to save');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Process each item
      for (const item of stockItems) {
        // Update medicines cache
        const existingMedicine = medicines.find(m => m.product_id === item.product_id);
        
        if (existingMedicine) {
          // Update existing medicine
          const response = await fetch(`${API_BASE_URL}/api/medicines-cache/${existingMedicine.id}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({
              current_quantity: existingMedicine.current_quantity + item.quantity,
              product_price: item.unit_price.toString(),
              expire_date: item.expiry_date,
              batch_no: item.batch_no
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to update medicine: ${item.product_name}`);
          }
        } else {
          // Create new medicine entry
          const response = await fetch(`${API_BASE_URL}/api/medicines-cache`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({
              product_id: item.product_id,
              product_name: item.product_name,
              current_quantity: item.quantity,
              product_price: item.unit_price.toString(),
              buying_price: item.buying_price.toString(),
              product_category: 'General',
              expire_date: item.expiry_date,
              batch_no: item.batch_no
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to create medicine: ${item.product_name}`);
          }
        }

        // Create stock adjustment record
        const adjustmentResponse = await fetch(`${API_BASE_URL}/api/stock-adjustments`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            product_id: item.product_id,
            batch_no: item.batch_no,
            adjustment_date: item.received_date,
            adjustment_type: 'increase',
            quantity_adjusted: item.quantity,
            reason: `Stock received from ${item.supplier}. ${item.notes}`,
            created_by: String(user.id || '1')
          }),
        });

        if (!adjustmentResponse.ok) {
          console.warn(`Failed to create adjustment record for: ${item.product_name}`);
        }
      }

      setStockItems([]);
      await fetchMedicines();
      setSuccess(`Successfully processed ${stockItems.length} items`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTemplate = () => {
    const template = [
      {
        'Product ID': 'MED001',
        'Product Name': 'Paracetamol 500mg',
        'Batch Number': 'BATCH2025001',
        'Quantity': 100,
        'Unit Price': 50.00,
        'Total Price': 5000.00,
        'Supplier': 'ABC Pharmaceuticals',
        'Expiry Date': '2026-12-31',
        'Received Date': new Date().toISOString().split('T')[0],
        'Notes': 'Sample entry'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Template');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(data);
    link.download = 'Stock_Receiving_Template.xlsx';
    link.click();
  };

  const calculateTotal = () => {
    return stockItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateTotalQuantity = () => {
    return stockItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  // DataTable columns
  const columns: TableColumn[] = [
    {
      key: 'product_name',
      header: 'Product',
      sortable: true,
      width: '20%'
    },
    {
      key: 'batch_no',
      header: 'Batch',
      sortable: true,
      width: '12%'
    },
    {
      key: 'quantity',
      header: 'Quantity',
      sortable: true,
      width: '8%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <span style={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {row.quantity}
          </span>
        );
      }
    },
    {
      key: 'unit_price',
      header: 'Unit Price',
      sortable: true,
      width: '12%',
      render: (row: any) => {
        if (!row) return '-';
        return `Tsh ${row.unit_price?.toLocaleString() || '0'}`;
      }
    },
    {
      key: 'buying_price',
      header: 'Buying Price',
      sortable: true,
      width: '12%',
      render: (row: any) => {
        if (!row) return '-';
        return `Tsh ${row.buying_price?.toLocaleString() || '0'}`;
      }
    },
    {
      key: 'manufacturer',
      header: 'Manufacturer',
      sortable: true,
      width: '12%'
    },
    {
      key: 'supplier',
      header: 'Supplier',
      sortable: true,
      width: '12%'
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      width: '8%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <button
            onClick={() => handleRemoveItem(row.id!)}
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
            <Trash2 style={{ width: 12, height: 12 }} />
          </button>
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
          Stock Receiving
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleExportTemplate}
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
            <Download style={{ width: 16, height: 16 }} />
            Download Template
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

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 20, 
          borderRadius: 12, 
          boxShadow: theme.shadows[1],
          border: `1px solid ${theme.palette.divider}`,
          textAlign: 'center'
        }}>
          <Package style={{ 
            width: 32, 
            height: 32, 
            color: theme.palette.primary.main,
            marginBottom: 8
          }} />
          <p style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            color: theme.palette.text.primary,
            margin: '8px 0 4px 0'
          }}>
            {stockItems.length}
          </p>
          <p style={{ 
            fontSize: 14, 
            color: theme.palette.text.secondary,
            margin: 0
          }}>
            Total Items
          </p>
        </div>

        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 20, 
          borderRadius: 12, 
          boxShadow: theme.shadows[1],
          border: `1px solid ${theme.palette.divider}`,
          textAlign: 'center'
        }}>
          <Package style={{ 
            width: 32, 
            height: 32, 
            color: theme.palette.success.main,
            marginBottom: 8
          }} />
          <p style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            color: theme.palette.text.primary,
            margin: '8px 0 4px 0'
          }}>
            {calculateTotalQuantity()}
          </p>
          <p style={{ 
            fontSize: 14, 
            color: theme.palette.text.secondary,
            margin: 0
          }}>
            Total Quantity
          </p>
        </div>

        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 20, 
          borderRadius: 12, 
          boxShadow: theme.shadows[1],
          border: `1px solid ${theme.palette.divider}`,
          textAlign: 'center'
        }}>
          <Package style={{ 
            width: 32, 
            height: 32, 
            color: theme.palette.warning.main,
            marginBottom: 8
          }} />
          <p style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            color: theme.palette.text.primary,
            margin: '8px 0 4px 0'
          }}>
            Tsh {calculateTotal().toLocaleString()}
          </p>
          <p style={{ 
            fontSize: 14, 
            color: theme.palette.text.secondary,
            margin: 0
          }}>
            Total Value
          </p>
        </div>
      </div>

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
                placeholder="Search items..."
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
              onClick={handleSaveAll}
              disabled={loading || stockItems.length === 0}
              style={{
                padding: '8px 16px',
                background: theme.palette.success.main,
                color: theme.palette.success.contrastText,
                border: 'none',
                borderRadius: 8,
                cursor: (loading || stockItems.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: (loading || stockItems.length === 0) ? 0.7 : 1
              }}
            >
              <Save style={{ width: 16, height: 16 }} />
              {loading ? 'Saving...' : 'Save All Items'}
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
            Showing {filteredItems.length} of {stockItems.length} items
            {searchTerm && ` matching "${searchTerm}"`}
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
          emptyMessage="No items to receive. Add some items to get started."
        />
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: theme.palette.background.paper,
            borderRadius: 16,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 24 
            }}>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 600, 
                color: theme.palette.text.primary,
                margin: 0
              }}>
                Add Stock Item
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.palette.text.secondary
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Product Selection */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Product *
                </label>
                <select
                  value={newItem.product_id}
                  onChange={(e) => setNewItem(prev => ({ ...prev, product_id: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                >
                  <option value="">Select a product</option>
                  {medicines.map(medicine => (
                    <option key={medicine.id} value={medicine.product_id}>
                      {medicine.product_name} (Current: {medicine.current_quantity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Number */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Batch Number *
                </label>
                <input
                  type="text"
                  value={newItem.batch_no}
                  onChange={(e) => setNewItem(prev => ({ ...prev, batch_no: e.target.value }))}
                  placeholder="Enter batch number"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                />
              </div>

              {/* Quantity and Unit Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 8, 
                    fontWeight: 500, 
                    color: theme.palette.text.primary 
                  }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ 
                      ...prev, 
                      quantity: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="Enter quantity"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      background: theme.palette.background.default,
                      color: theme.palette.text.primary,
                      fontSize: 14
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 8, 
                    fontWeight: 500, 
                    color: theme.palette.text.primary 
                  }}>
                    Unit Price (Tsh) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem(prev => ({ 
                      ...prev, 
                      unit_price: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="Enter unit price"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      background: theme.palette.background.default,
                      color: theme.palette.text.primary,
                      fontSize: 14
                    }}
                  />
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Supplier
                </label>
                <input
                  type="text"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Enter supplier name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={newItem.expiry_date}
                  onChange={(e) => setNewItem(prev => ({ ...prev, expiry_date: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Notes
                </label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter any additional notes"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14,
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: 12, 
                justifyContent: 'flex-end',
                marginTop: 24,
                paddingTop: 16,
                borderTop: `1px solid ${theme.palette.divider}`
              }}>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '12px 24px',
                    background: theme.palette.grey[300],
                    color: theme.palette.text.primary,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  style={{
                    padding: '12px 24px',
                    background: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadExcelDataProvider
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => {
            setIsUploadModalOpen(false);
            fetchMedicines();
          }}
        />
      )}
    </div>
  );
};

export default ReceivingStock;