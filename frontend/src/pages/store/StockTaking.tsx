import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
  Calculator,
  FileText,
  Download,
  Upload,
  Filter,
  Eye,
  Edit
} from 'lucide-react';
import { useTheme } from '@mui/material';
import { API_BASE_URL } from '../../../constants';
import * as XLSX from 'xlsx';

interface StockTakingItem {
  id?: string;
  product_id: string;
  product_name: string;
  batch_no: string;
  expected_quantity: number;
  actual_quantity: number;
  difference: number;
  unit_price: number;
  total_value: number;
  notes: string;
  status: 'pending' | 'completed' | 'discrepancy';
  counted_by?: string;
  counted_at?: string;
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

const StockTaking: React.FC = () => {
  const theme = useTheme();
  const [stockTakingItems, setStockTakingItems] = useState<StockTakingItem[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockTakingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockTakingItem | null>(null);
  const [newItem, setNewItem] = useState<StockTakingItem>({
    product_id: '',
    product_name: '',
    batch_no: '',
    expected_quantity: 0,
    actual_quantity: 0,
    difference: 0,
    unit_price: 0,
    total_value: 0,
    notes: '',
    status: 'pending'
  });

  useEffect(() => {
    fetchMedicines();
    initializeStockTaking();
  }, []);

  useEffect(() => {
    filterItems();
  }, [stockTakingItems, searchTerm, statusFilter, categoryFilter]);

  const filterItems = () => {
    let filtered = stockTakingItems;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batch_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter(item => {
        const medicine = medicines.find(m => m.product_id === item.product_id);
        return medicine?.product_category === categoryFilter;
      });
    }

    setFilteredItems(filtered);
  };

  const fetchMedicines = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/medicines-cache`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMedicines(data.data || []);
      }
    } catch (err: any) {
      console.error('Fetch medicines error:', err);
    }
  };

  const initializeStockTaking = () => {
    // Initialize stock taking items from medicines
    const items: StockTakingItem[] = medicines.map(medicine => ({
      product_id: medicine.product_id,
      product_name: medicine.product_name,
      batch_no: medicine.batch_no,
      expected_quantity: medicine.current_quantity,
      actual_quantity: 0,
      difference: 0,
      unit_price: parseFloat(medicine.product_price),
      total_value: 0,
      notes: '',
      status: 'pending' as const
    }));

    setStockTakingItems(items);
  };

  const handleAddItem = () => {
    if (!newItem.product_id || newItem.actual_quantity < 0) {
      setError('Please fill in all required fields');
      return;
    }

    const selectedMedicine = medicines.find(m => m.product_id === newItem.product_id);
    if (!selectedMedicine) {
      setError('Selected product not found');
      return;
    }

    const item: StockTakingItem = {
      ...newItem,
      id: `new-${Date.now()}`,
      product_name: selectedMedicine.product_name,
      expected_quantity: selectedMedicine.current_quantity,
      difference: newItem.actual_quantity - selectedMedicine.current_quantity,
      unit_price: parseFloat(selectedMedicine.product_price),
      total_value: newItem.actual_quantity * parseFloat(selectedMedicine.product_price),
      status: newItem.actual_quantity === selectedMedicine.current_quantity ? 'completed' : 'discrepancy'
    };

    setStockTakingItems(prev => [...prev, item]);
    setNewItem({
      product_id: '',
      product_name: '',
      batch_no: '',
      expected_quantity: 0,
      actual_quantity: 0,
      difference: 0,
      unit_price: 0,
      total_value: 0,
      notes: '',
      status: 'pending'
    });
    setIsAddModalOpen(false);
    setSuccess('Item added successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleEditItem = (item: StockTakingItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleUpdateItem = (updatedItem: StockTakingItem) => {
    setStockTakingItems(prev =>
      prev.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
    setIsEditModalOpen(false);
    setSelectedItem(null);
    setSuccess('Item updated successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSaveStockTaking = async () => {
    if (stockTakingItems.length === 0) {
      setError('No items to save');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Group items by product_id
      const productsMap = new Map();
      
      stockTakingItems.forEach(item => {
        if (!productsMap.has(item.product_id)) {
          productsMap.set(item.product_id, {
            product_id: item.product_id,
            batches: []
          });
        }
        
        productsMap.get(item.product_id).batches.push({
          batch_no: item.batch_no,
          product_quantity: item.actual_quantity,
          manufacture_date: new Date().toISOString().split('T')[0], // Default to today
          expire_date: new Date().toISOString().split('T')[0] // Default to today
        });
      });

      const products = Array.from(productsMap.values());

      // Send stock taking data
      const response = await fetch(`${API_BASE_URL}/api/stock-taking`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          products: products,
          created_by: String(user.id || '1')
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save stock taking: ${response.status} - ${errorText}`);
      }

      setSuccess(`Successfully saved ${stockTakingItems.length} stock taking records`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Clear the stock taking items after successful save
      setStockTakingItems([]);
      
    } catch (err: any) {
      console.error('Save stock taking error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportStockTaking = () => {
    if (stockTakingItems.length === 0) {
      setError('No items to export');
      return;
    }

    const exportData = stockTakingItems.map(item => ({
      'Product ID': item.product_id,
      'Product Name': item.product_name,
      'Batch Number': item.batch_no,
      'Expected Quantity': item.expected_quantity,
      'Actual Quantity': item.actual_quantity,
      'Difference': item.difference,
      'Unit Price (Tsh)': item.unit_price,
      'Total Value (Tsh)': item.total_value,
      'Status': item.status,
      'Notes': item.notes
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Taking');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(data);
    link.download = `Stock_Taking_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'discrepancy':
        return theme.palette.error.main;
      case 'pending':
        return theme.palette.warning.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle style={{ color: theme.palette.success.main, width: 16, height: 16 }} />;
      case 'discrepancy':
        return <AlertCircle style={{ color: theme.palette.error.main, width: 16, height: 16 }} />;
      case 'pending':
        return <Package style={{ color: theme.palette.warning.main, width: 16, height: 16 }} />;
      default:
        return <Package style={{ color: theme.palette.text.secondary, width: 16, height: 16 }} />;
    }
  };

  const calculateSummary = () => {
    const total = stockTakingItems.length;
    const completed = stockTakingItems.filter(item => item.status === 'completed').length;
    const discrepancies = stockTakingItems.filter(item => item.status === 'discrepancy').length;
    const pending = stockTakingItems.filter(item => item.status === 'pending').length;
    const totalValue = stockTakingItems.reduce((sum, item) => sum + item.total_value, 0);
    const totalDifference = stockTakingItems.reduce((sum, item) => sum + Math.abs(item.difference), 0);

    return { total, completed, discrepancies, pending, totalValue, totalDifference };
  };

  const summary = calculateSummary();

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
          Stock Taking
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={initializeStockTaking}
            style={{
              padding: '8px 16px',
              background: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
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
            {summary.total}
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
          <CheckCircle style={{
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
            {summary.completed}
          </p>
          <p style={{
            fontSize: 14,
            color: theme.palette.text.secondary,
            margin: 0
          }}>
            Completed
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
          <AlertCircle style={{
            width: 32,
            height: 32,
            color: theme.palette.error.main,
            marginBottom: 8
          }} />
          <p style={{
            fontSize: 24,
            fontWeight: 700,
            color: theme.palette.text.primary,
            margin: '8px 0 4px 0'
          }}>
            {summary.discrepancies}
          </p>
          <p style={{
            fontSize: 14,
            color: theme.palette.text.secondary,
            margin: 0
          }}>
            Discrepancies
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
          <Calculator style={{
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
            Tsh {summary.totalValue.toLocaleString()}
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

      {/* Filters and Actions */}
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

          {/* Status Filter */}
          <div style={{ minWidth: 150 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="discrepancy">Discrepancy</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: 150 }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
              <option value="">All Categories</option>
              {Array.from(new Set(medicines.map(m => m.product_category))).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleExportStockTaking}
              disabled={stockTakingItems.length === 0}
              style={{
                padding: '8px 16px',
                background: theme.palette.info.main,
                color: theme.palette.info.contrastText,
                border: 'none',
                borderRadius: 8,
                cursor: stockTakingItems.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: stockTakingItems.length === 0 ? 0.7 : 1
              }}
            >
              <Download style={{ width: 16, height: 16 }} />
              Export
            </button>
            <button
              onClick={handleSaveStockTaking}
              disabled={loading || stockTakingItems.length === 0}
              style={{
                padding: '8px 16px',
                background: theme.palette.success.main,
                color: theme.palette.success.contrastText,
                border: 'none',
                borderRadius: 8,
                cursor: (loading || stockTakingItems.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: (loading || stockTakingItems.length === 0) ? 0.7 : 1
              }}
            >
              <Save style={{ width: 16, height: 16 }} />
              {loading ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
      </div>

      {/* Stock Taking Table */}
      <div style={{
        background: theme.palette.background.paper,
        borderRadius: 16,
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 1200
          }}>
            <thead>
              <tr style={{
                background: theme.palette.primary.main,
                color: theme.palette.primary.contrastText
              }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Product</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Batch</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>Expected</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>Actual</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>Difference</th>
                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>Unit Price</th>
                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>Total Value</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: theme.palette.text.secondary
                  }}>
                    <Package style={{
                      width: 24,
                      height: 24,
                      marginBottom: 8
                    }} />
                    <p>No stock taking items found</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} style={{
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div style={{
                          color: theme.palette.text.primary,
                          fontWeight: 500
                        }}>
                          {item.product_name}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: theme.palette.text.secondary
                        }}>
                          ID: {item.product_id}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: theme.palette.text.primary }}>
                      {item.batch_no}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: theme.palette.text.primary,
                      fontWeight: 500
                    }}>
                      {item.expected_quantity}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: theme.palette.text.primary,
                      fontWeight: 500
                    }}>
                      {item.actual_quantity}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: item.difference === 0 ? theme.palette.success.main : theme.palette.error.main,
                      fontWeight: 600
                    }}>
                      {item.difference > 0 ? '+' : ''}{item.difference}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'right',
                      color: theme.palette.text.primary
                    }}>
                      Tsh {item.unit_price.toLocaleString()}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'right',
                      color: theme.palette.text.primary,
                      fontWeight: 500
                    }}>
                      Tsh {item.total_value.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        justifyContent: 'center'
                      }}>
                        {getStatusIcon(item.status)}
                        <span style={{
                          color: getStatusColor(item.status),
                          fontWeight: 500,
                          textTransform: 'capitalize'
                        }}>
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEditItem(item)}
                          style={{
                            padding: '6px',
                            background: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                          }}
                          title="Edit"
                        >
                          <Edit style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
            maxWidth: 600,
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
                Add Stock Taking Item
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
                <XCircle style={{ width: 24, height: 24 }} />
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
                      {medicine.product_name} (Expected: {medicine.current_quantity})
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
                  Batch Number
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

              {/* Actual Quantity */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 500,
                  color: theme.palette.text.primary
                }}>
                  Actual Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={newItem.actual_quantity}
                  onChange={(e) => setNewItem(prev => ({
                    ...prev,
                    actual_quantity: parseInt(e.target.value) || 0
                  }))}
                  placeholder="Enter actual quantity counted"
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
                  placeholder="Enter any notes about the stock taking"
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

      {/* Edit Item Modal */}
      {isEditModalOpen && selectedItem && (
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
            maxWidth: 600,
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
                Edit Stock Taking Item
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedItem(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.palette.text.secondary
                }}
              >
                <XCircle style={{ width: 24, height: 24 }} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Product Info */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 500,
                  color: theme.palette.text.primary
                }}>
                  Product
                </label>
                <input
                  type="text"
                  value={selectedItem.product_name}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.grey[100],
                    color: theme.palette.text.secondary,
                    fontSize: 14
                  }}
                />
              </div>

              {/* Expected vs Actual */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: 8,
                    fontWeight: 500,
                    color: theme.palette.text.primary
                  }}>
                    Expected Quantity
                  </label>
                  <input
                    type="number"
                    value={selectedItem.expected_quantity}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      background: theme.palette.grey[100],
                      color: theme.palette.text.secondary,
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
                    Actual Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={selectedItem.actual_quantity}
                    onChange={(e) => {
                      const actualQty = parseInt(e.target.value) || 0;
                      const difference = actualQty - selectedItem.expected_quantity;
                      const status = actualQty === selectedItem.expected_quantity ? 'completed' : 'discrepancy';

                      setSelectedItem(prev => prev ? {
                        ...prev,
                        actual_quantity: actualQty,
                        difference,
                        total_value: actualQty * prev.unit_price,
                        status
                      } : null);
                    }}
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

              {/* Difference Display */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 500,
                  color: theme.palette.text.primary
                }}>
                  Difference
                </label>
                <input
                  type="text"
                  value={`${selectedItem.difference > 0 ? '+' : ''}${selectedItem.difference}`}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.grey[100],
                    color: selectedItem.difference === 0 ? theme.palette.success.main : theme.palette.error.main,
                    fontSize: 14,
                    fontWeight: 600
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
                  value={selectedItem.notes}
                  onChange={(e) => setSelectedItem(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="Enter any notes about the stock taking"
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
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                  }}
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
                  onClick={() => handleUpdateItem(selectedItem)}
                  style={{
                    padding: '12px 24px',
                    background: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  Update Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTaking;