import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Save, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  User,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { useTheme } from '@mui/material';
import { API_BASE_URL } from '../../../constants';
import DataTable from '../../components/common/DataTable/DataTable';
import { TableColumn } from '../../components/common/DataTable/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

interface Product {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  current_quantity: number;
  batch_no: string;
  expire_date: string;
  product_price: number;
}

interface AdjustmentRecord {
  id: number;
  product_id: string;
  batch_no: string;
  adjustment_date: string;
  adjustment_type: 'increase' | 'decrease' | 'transfer' | 'donation';
  quantity_adjusted: number;
  reason: string;
  created_by: number;
  created_at: string;
  product_name?: string;
}

const StockAdjusting: React.FC = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease' | 'transfer' | 'donation'>('increase');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchAdjustmentHistory();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

  const fetchProducts = async () => {
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
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const result = await response.json();
      const data = result.success && result.data ? result.data : result;
      
      if (Array.isArray(data)) {
        const mappedProducts = data.map((item: any) => ({
          id: item.id.toString(),
          product_id: item.product_id,
          product_name: item.product_name,
          product_category: item.product_category,
          current_quantity: parseInt(item.current_quantity) || 0,
          batch_no: item.batch_no,
          expire_date: item.expire_date,
          product_price: parseFloat(item.product_price) || 0,
        }));
        setProducts(mappedProducts);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error('Fetch products error:', err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustmentHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/inventory-reports/stock-movements`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAdjustmentHistory(result.data);
        }
      }
    } catch (err) {
      console.error('Fetch adjustment history error:', err);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.product_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.batch_no.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleSaveAdjustment = async () => {
    if (!selectedProduct || adjustmentQuantity <= 0 || !adjustmentReason.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const adjustmentData = {
        product_id: selectedProduct.product_id,
        batch_no: selectedProduct.batch_no,
        adjustment_date: new Date().toISOString().split('T')[0],
        adjustment_type: adjustmentType,
        quantity_adjusted: adjustmentQuantity,
        reason: adjustmentReason,
        created_by: parseInt(localStorage.getItem('user_id') || '1')
      };

      const response = await fetch(`${API_BASE_URL}/api/stock-adjustments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(adjustmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save adjustment');
      }

      const result = await response.json();
      if (result.success) {
        setSuccess('Stock adjustment saved successfully');
        setSelectedProduct(null);
        setAdjustmentQuantity(0);
        setAdjustmentReason('');
        fetchProducts();
        fetchAdjustmentHistory();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.message || 'Failed to save adjustment');
      }
    } catch (err: any) {
      console.error('Save adjustment error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = adjustmentHistory.map(adjustment => ({
      'Product ID': adjustment.product_id,
      'Product Name': adjustment.product_name || 'Unknown',
      'Batch No': adjustment.batch_no,
      'Adjustment Type': adjustment.adjustment_type,
      'Quantity Adjusted': adjustment.quantity_adjusted,
      'Reason': adjustment.reason,
      'Date': new Date(adjustment.adjustment_date).toLocaleDateString(),
      'Created By': adjustment.created_by
    }));

    // Create CSV content
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stock_adjustments_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
    return `Tsh ${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getAdjustmentTypeColor = (type: string) => {
    switch (type) {
      case 'increase': return theme.palette.success.main;
      case 'decrease': return theme.palette.error.main;
      case 'transfer': return theme.palette.warning.main;
      case 'donation': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  const getAdjustmentTypeIcon = (type: string) => {
    switch (type) {
      case 'increase': return <TrendingUp size={16} />;
      case 'decrease': return <TrendingDown size={16} />;
      case 'transfer': return <Package size={16} />;
      case 'donation': return <AlertTriangle size={16} />;
      default: return null;
    }
  };

  // DataTable columns for adjustment history
  const columns: TableColumn[] = [
    {
      key: 'product_name',
      header: 'Product',
      sortable: true,
      width: '25%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <div>
            <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {row.product_name || 'Unknown Product'}
            </div>
            <div style={{ fontSize: 12, color: theme.palette.text.secondary }}>
              ID: {row.product_id} | Batch: {row.batch_no}
            </div>
          </div>
        );
      }
    },
    {
      key: 'adjustment_type',
      header: 'Type',
      sortable: true,
      width: '12%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500,
            background: getAdjustmentTypeColor(row.adjustment_type) + '20',
            color: getAdjustmentTypeColor(row.adjustment_type),
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            {getAdjustmentTypeIcon(row.adjustment_type)}
            {row.adjustment_type ? row.adjustment_type.charAt(0).toUpperCase() + row.adjustment_type.slice(1) : '-'}
          </span>
        );
      }
    },
    {
      key: 'quantity_adjusted',
      header: 'Quantity',
      sortable: true,
      width: '12%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <span style={{ 
            fontWeight: 600, 
            color: getAdjustmentTypeColor(row.adjustment_type)
          }}>
            {row.adjustment_type === 'decrease' ? '-' : '+'}{formatNumber(row.quantity_adjusted)}
          </span>
        );
      }
    },
    {
      key: 'reason',
      header: 'Reason',
      sortable: false,
      width: '25%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <div style={{ 
            maxWidth: 200, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {row.reason}
          </div>
        );
      }
    },
    {
      key: 'adjustment_date',
      header: 'Date',
      sortable: true,
      width: '12%',
      render: (row: any) => {
        if (!row) return '-';
        return new Date(row.adjustment_date).toLocaleDateString();
      }
    },
    {
      key: 'created_by',
      header: 'User',
      sortable: true,
      width: '14%',
      render: (row: any) => {
        if (!row) return '-';
        return `User ${row.created_by}`;
      }
    }
  ];

  if (loading && products.length === 0) {
    return (
      <div style={{ 
        padding: '16px', 
        background: theme.palette.background.default, 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingSpinner 
          loading={true} 
          message="Loading stock adjustment..." 
          size={48}
        />
      </div>
    );
  }

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
          Stock Adjustments
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={fetchProducts}
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
            onClick={handleExportExcel}
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
            <FileSpreadsheet style={{ width: 16, height: 16 }} />
            Export Excel
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: 16,
          background: theme.palette.error.light,
          color: theme.palette.error.main,
          borderRadius: 8,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertTriangle style={{ width: 20, height: 20 }} />
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: 16,
          background: theme.palette.success.light,
          color: theme.palette.success.main,
          borderRadius: 8,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Save style={{ width: 20, height: 20 }} />
          {success}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 24, 
        marginBottom: 32 
      }}>
        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 20, 
          borderRadius: 12, 
          boxShadow: theme.shadows[1], 
          border: `1px solid ${theme.palette.divider}` 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Total Products</p>
              <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>
                {formatNumber(products.length)}
              </p>
            </div>
            <Package style={{ color: theme.palette.primary.main, width: 20, height: 20 }} />
          </div>
        </div>

        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 20, 
          borderRadius: 12, 
          boxShadow: theme.shadows[1], 
          border: `1px solid ${theme.palette.divider}` 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Total Adjustments</p>
              <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.success.main }}>
                {formatNumber(adjustmentHistory.length)}
              </p>
            </div>
            <TrendingUp style={{ color: theme.palette.success.main, width: 20, height: 20 }} />
          </div>
        </div>

        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 20, 
          borderRadius: 12, 
          boxShadow: theme.shadows[1], 
          border: `1px solid ${theme.palette.divider}` 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Increases</p>
              <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.success.main }}>
                {formatNumber(adjustmentHistory.filter(a => a.adjustment_type === 'increase').length)}
              </p>
            </div>
            <TrendingUp style={{ color: theme.palette.success.main, width: 20, height: 20 }} />
          </div>
        </div>

        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 20, 
          borderRadius: 12, 
          boxShadow: theme.shadows[1], 
          border: `1px solid ${theme.palette.divider}` 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Decreases</p>
              <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.error.main }}>
                {formatNumber(adjustmentHistory.filter(a => a.adjustment_type === 'decrease').length)}
              </p>
            </div>
            <TrendingDown style={{ color: theme.palette.error.main, width: 20, height: 20 }} />
          </div>
        </div>
      </div>

      {/* Stock Adjustment Form */}
      <div style={{ 
        background: theme.palette.background.paper, 
        padding: 24, 
        borderRadius: 16, 
        boxShadow: theme.shadows[1], 
        border: `1px solid ${theme.palette.divider}`,
        marginBottom: 32
      }}>
        <h3 style={{ 
          fontSize: 18, 
          fontWeight: 600, 
          color: theme.palette.text.primary, 
          marginBottom: 20 
        }}>
          New Stock Adjustment
        </h3>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 20 
        }}>
          {/* Product Search */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Search Product
            </label>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name, category, or batch..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  fontSize: 14,
                  background: theme.palette.background.default,
                  color: theme.palette.text.primary
                }}
              />
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Select Product
            </label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const product = products.find(p => p.id === e.target.value);
                setSelectedProduct(product || null);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                fontSize: 14,
                background: theme.palette.background.default,
                color: theme.palette.text.primary
              }}
            >
              <option value="">Select a product...</option>
              {filteredProducts.map(product => (
                <option key={product.id} value={product.id}>
                  {product.product_name} - {product.batch_no} (Qty: {product.current_quantity})
                </option>
              ))}
            </select>
          </div>

          {/* Adjustment Type */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Adjustment Type
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                fontSize: 14,
                background: theme.palette.background.default,
                color: theme.palette.text.primary
              }}
            >
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
              <option value="transfer">Transfer</option>
              <option value="donation">Donation</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Quantity
            </label>
            <input
              type="number"
              value={adjustmentQuantity}
              onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
              min="1"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                fontSize: 14,
                background: theme.palette.background.default,
                color: theme.palette.text.primary
              }}
            />
          </div>

          {/* Reason */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Reason
            </label>
            <input
              type="text"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="Enter adjustment reason..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                fontSize: 14,
                background: theme.palette.background.default,
                color: theme.palette.text.primary
              }}
            />
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              onClick={handleSaveAdjustment}
              disabled={loading || !selectedProduct || adjustmentQuantity <= 0 || !adjustmentReason.trim()}
              style={{
                padding: '8px 16px',
                background: loading || !selectedProduct || adjustmentQuantity <= 0 || !adjustmentReason.trim() 
                  ? theme.palette.grey[300] 
                  : theme.palette.primary.main,
                color: loading || !selectedProduct || adjustmentQuantity <= 0 || !adjustmentReason.trim()
                  ? theme.palette.grey[600]
                  : theme.palette.primary.contrastText,
                border: 'none',
                borderRadius: 8,
                cursor: loading || !selectedProduct || adjustmentQuantity <= 0 || !adjustmentReason.trim() 
                  ? 'not-allowed' 
                  : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Save style={{ width: 16, height: 16 }} />
              Save Adjustment
            </button>
          </div>
        </div>

        {/* Selected Product Info */}
        {selectedProduct && (
          <div style={{
            marginTop: 20,
            padding: 16,
            background: theme.palette.background.default,
            borderRadius: 8,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <h4 style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: theme.palette.text.primary,
              marginBottom: 8
            }}>
              Selected Product Details
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: 16 
            }}>
              <div>
                <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>Name: </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{selectedProduct.product_name}</span>
              </div>
              <div>
                <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>Category: </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{selectedProduct.product_category}</span>
              </div>
              <div>
                <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>Current Stock: </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{formatNumber(selectedProduct.current_quantity)}</span>
              </div>
              <div>
                <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>Batch No: </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{selectedProduct.batch_no}</span>
              </div>
              <div>
                <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>Price: </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{formatCurrency(selectedProduct.product_price)}</span>
              </div>
              <div>
                <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>Expire Date: </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{new Date(selectedProduct.expire_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Adjustment History Table */}
      <div style={{
        background: theme.palette.background.paper,
        borderRadius: 16,
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden'
      }}>
        <div style={{
          padding: 24,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: theme.palette.text.primary 
          }}>
            Adjustment History
          </h3>
        </div>
        <DataTable
          columns={columns}
          data={adjustmentHistory}
          loading={loading}
          emptyMessage="No adjustment records found."
        />
      </div>
    </div>
  );
};

export default StockAdjusting;