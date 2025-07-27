import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Save, 
  AlertTriangle, 
  RefreshCw,
  Package,
  Calendar,
  User,
  FileSpreadsheet,
  Download,
  Truck,
  CheckCircle
} from 'lucide-react';
import { useTheme } from '@mui/material';
import { API_BASE_URL } from '../../../constants';
import DataTable from '../../components/common/DataTable/DataTable';
import { TableColumn } from '../../components/common/DataTable/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

interface StockReceiving {
  id: number;
  supplier_name: string;
  invoice_number: string;
  delivery_date: string;
  total_amount: number;
  status: 'pending' | 'received' | 'cancelled';
  created_by: number;
  created_at: string;
  updated_at: string;
  items: StockReceivingItem[];
}

interface StockReceivingItem {
  id: number;
  receiving_id: number;
  product_id: string;
  product_name: string;
  batch_no: string;
  quantity_received: number;
  unit_price: number;
  buying_price: number;
  manufacture_date: string;
  expire_date: string;
  created_at: string;
}

const StockReceiving: React.FC = () => {
  const theme = useTheme();
  const [stockReceivings, setStockReceivings] = useState<StockReceiving[]>([]);
  const [filteredReceivings, setFilteredReceivings] = useState<StockReceiving[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchStockReceivings();
  }, []);

  useEffect(() => {
    filterReceivings();
  }, [stockReceivings, searchTerm, selectedStatus, startDate, endDate]);

  const fetchStockReceivings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/api/stock-receiving`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock receiving data: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setStockReceivings(result.data);
      } else {
        setStockReceivings([]);
      }
    } catch (err: any) {
      console.error('Fetch stock receiving error:', err);
      setError(err.message);
      setStockReceivings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReceivings = () => {
    let filtered = stockReceivings;

    if (searchTerm) {
      filtered = filtered.filter(receiving =>
        receiving.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receiving.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(receiving => receiving.status === selectedStatus);
    }

    if (startDate && endDate) {
      filtered = filtered.filter(receiving => {
        const receivingDate = new Date(receiving.delivery_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return receivingDate >= start && receivingDate <= end;
      });
    }

    setFilteredReceivings(filtered);
  };

  const handleExportExcel = () => {
    const exportData = filteredReceivings.map(receiving => ({
      'Receiving ID': receiving.id,
      'Supplier': receiving.supplier_name,
      'Invoice Number': receiving.invoice_number,
      'Delivery Date': new Date(receiving.delivery_date).toLocaleDateString(),
      'Total Amount': receiving.total_amount,
      'Status': receiving.status,
      'Items Count': receiving.items.length,
      'Created Date': new Date(receiving.created_at).toLocaleDateString()
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
    link.setAttribute('download', `stock_receiving_${new Date().toISOString().slice(0, 10)}.csv`);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'cancelled': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return '-';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // DataTable columns
  const columns: TableColumn[] = [
    {
      key: 'id',
      header: 'Receiving ID',
      sortable: true,
      width: '10%'
    },
    {
      key: 'supplier_name',
      header: 'Supplier',
      sortable: true,
      width: '20%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <div>
            <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {row.supplier_name}
            </div>
            <div style={{ fontSize: 12, color: theme.palette.text.secondary }}>
              Invoice: {row.invoice_number}
            </div>
          </div>
        );
      }
    },
    {
      key: 'delivery_date',
      header: 'Delivery Date',
      sortable: true,
      width: '15%',
      render: (row: any) => {
        if (!row) return '-';
        return new Date(row.delivery_date).toLocaleDateString();
      }
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      sortable: true,
      width: '15%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <span style={{ fontWeight: 600, color: theme.palette.success.main }}>
            {formatCurrency(row.total_amount)}
          </span>
        );
      }
    },
    {
      key: 'items_count',
      header: 'Items',
      sortable: true,
      width: '10%',
      render: (row: any) => {
        if (!row) return '-';
        return formatNumber(row.items?.length || 0);
      }
    },
    {
      key: 'status',
      header: 'Status',
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
            background: getStatusColor(row.status) + '20',
            color: getStatusColor(row.status)
          }}>
            {getStatusText(row.status)}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      width: '18%',
      render: (row: any) => {
        if (!row) return '-';
        return new Date(row.created_at).toLocaleDateString();
      }
    }
  ];

  if (loading && stockReceivings.length === 0) {
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
          message="Loading stock receiving..." 
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
          Stock Receiving
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={fetchStockReceivings}
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
          <CheckCircle style={{ width: 20, height: 20 }} />
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
              <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Total Receivings</p>
              <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>
                {formatNumber(stockReceivings.length)}
              </p>
            </div>
            <Truck style={{ color: theme.palette.primary.main, width: 20, height: 20 }} />
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
              <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Total Value</p>
              <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.success.main }}>
                {formatCurrency(stockReceivings.reduce((sum, r) => sum + r.total_amount, 0))}
              </p>
            </div>
            <Package style={{ color: theme.palette.success.main, width: 20, height: 20 }} />
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
              <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Received</p>
              <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.success.main }}>
                {formatNumber(stockReceivings.filter(r => r.status === 'received').length)}
              </p>
            </div>
            <CheckCircle style={{ color: theme.palette.success.main, width: 20, height: 20 }} />
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
              <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Pending</p>
              <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.warning.main }}>
                {formatNumber(stockReceivings.filter(r => r.status === 'pending').length)}
              </p>
            </div>
            <Calendar style={{ color: theme.palette.warning.main, width: 20, height: 20 }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        background: theme.palette.background.paper, 
        padding: 20, 
        borderRadius: 12, 
        boxShadow: theme.shadows[1], 
        border: `1px solid ${theme.palette.divider}`,
        marginBottom: 24
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 16 
        }}>
          {/* Search */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Search Receivings
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
                placeholder="Search by supplier or invoice..."
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

          {/* Status Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
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
              <option value="">All Status</option>
              <option value="received">Received</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
        </div>
      </div>

      {/* Stock Receiving Table */}
      <div style={{
        background: theme.palette.background.paper,
        borderRadius: 16,
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden'
      }}>
        <DataTable
          columns={columns}
          data={filteredReceivings}
          loading={loading}
          emptyMessage="No stock receiving records found. Try adjusting your filters."
        />
      </div>
    </div>
  );
};

export default StockReceiving;