import React, { useState, useEffect } from 'react';
import { 
  Search, 
  AlertCircle, 
  X, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  Package,
  Clock,
  DollarSign
} from 'lucide-react';
import { useTheme } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { API_BASE_URL } from '../../../constants';
import DataTable from '../../components/common/DataTable/DataTable';
import { TableColumn } from '../../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface InventoryItem {
  id: number;
  product_id: string;
  batch_no: string;
  product_name: string;
  product_price: string;
  buying_price: string | null;
  product_category: string;
  expire_date: string;
  current_quantity: number;
  created_at: string;
  updated_at: string;
}

interface InventorySummary {
  total_products: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  expiring_soon_count: number;
  categories: string[];
}

const InventoryReports: React.FC = () => {
  const theme = useTheme();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');
  const [sortBy, setSortBy] = useState('product_name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchInventoryData();
  }, [currentPage, sortBy, sortOrder]);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, selectedCategory, selectedStockStatus]);

  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: itemsPerPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedStockStatus && { stock_status: selectedStockStatus })
      });

      const response = await fetch(`${API_BASE_URL}/api/inventory-reports?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch inventory data: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setInventory(result.data);
        setSummary(result.summary);
        setTotalItems(result.meta.total);
        setTotalPages(result.meta.last_page);
      } else {
        setInventory([]);
        setSummary(null);
      }
    } catch (err: unknown) {
      console.error('Fetch inventory error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setInventory([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batch_no.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.product_category === selectedCategory);
    }

    if (selectedStockStatus) {
      switch (selectedStockStatus) {
        case 'low':
          filtered = filtered.filter(item => item.current_quantity <= 5 && item.current_quantity > 0);
          break;
        case 'out':
          filtered = filtered.filter(item => item.current_quantity === 0);
          break;
        case 'normal':
          filtered = filtered.filter(item => item.current_quantity > 5);
          break;
      }
    }

    setFilteredInventory(filtered);
  };

  const handleExportExcel = () => {
    const exportData = filteredInventory.map(item => ({
      'Product ID': item.product_id,
      'Product Name': item.product_name,
      'Batch No': item.batch_no,
      'Category': item.product_category,
      'Current Quantity': item.current_quantity,
      'Unit Price': parseFloat(item.product_price),
      'Buying Price': item.buying_price ? parseFloat(item.buying_price) : 0,
      'Total Value': item.current_quantity * parseFloat(item.product_price),
      'Expire Date': new Date(item.expire_date).toLocaleDateString(),
      'Status': item.current_quantity === 0 ? 'Out of Stock' : 
                item.current_quantity <= 5 ? 'Low Stock' : 'In Stock'
    }));

    // Create CSV content
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${(row as Record<string, string | number>)[header]}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
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

  const getStockStatusColor = (quantity: number) => {
    if (quantity === 0) return theme.palette.error.main;
    if (quantity <= 5) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const getStockStatusText = (quantity: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= 5) return 'Low Stock';
    return 'In Stock';
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
      key: 'batch_no',
      header: 'Batch No',
      sortable: true,
      width: '12%'
    },
    {
      key: 'product_category',
      header: 'Category',
      sortable: true,
      width: '15%'
    },
    {
      key: 'current_quantity',
      header: 'Quantity',
      sortable: true,
      width: '10%',
      render: (row: InventoryItem) => {
        if (!row) return '-';
        return (
          <span style={{ 
            fontWeight: 600, 
            color: getStockStatusColor(row.current_quantity)
          }}>
            {row.current_quantity}
          </span>
        );
      }
    },
    {
      key: 'product_price',
      header: 'Unit Price',
      sortable: true,
      width: '12%',
      render: (row: InventoryItem) => {
        if (!row) return '-';
        return formatCurrency(parseFloat(row.product_price));
      }
    },
    {
      key: 'buying_price',
      header: 'Buying Price',
      sortable: true,
      width: '12%',
      render: (row: InventoryItem) => {
        if (!row || !row.buying_price) return '-';
        return formatCurrency(parseFloat(row.buying_price));
      }
    },
    {
      key: 'total_value',
      header: 'Total Value',
      sortable: true,
      width: '12%',
      render: (row: InventoryItem) => {
        if (!row) return '-';
        const totalValue = row.current_quantity * parseFloat(row.product_price);
        return formatCurrency(totalValue);
      }
    },
    {
      key: 'stock_status',
      header: 'Status',
      sortable: false,
      width: '12%',
      render: (row: InventoryItem) => {
        if (!row) return '-';
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500,
            background: getStockStatusColor(row.current_quantity) + '20',
            color: getStockStatusColor(row.current_quantity)
          }}>
            {getStockStatusText(row.current_quantity)}
          </span>
        );
      }
    }
  ];

  // Chart data for category distribution
  const categoryChartData = {
    labels: summary?.categories || [],
    datasets: [
      {
        data: summary?.categories.map(category => 
          filteredInventory.filter(item => item.product_category === category).length
        ) || [],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ],
        borderWidth: 2,
        borderColor: theme.palette.background.paper,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: theme.palette.text.primary,
        },
      },
    },
  };

  if (loading && inventory.length === 0) {
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
          message="Loading inventory report..." 
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
          Inventory Reports
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={fetchInventoryData}
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
          <AlertCircle style={{ width: 20, height: 20 }} />
          {error}
        </div>
      )}

      {summary && (
        <>
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
                    {formatNumber(summary.total_products)}
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
                  <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Total Value</p>
                  <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.success.main }}>
                    {formatCurrency(summary.total_value)}
                  </p>
                </div>
                <DollarSign style={{ color: theme.palette.success.main, width: 20, height: 20 }} />
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
                  <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Low Stock</p>
                  <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.warning.main }}>
                    {formatNumber(summary.low_stock_count)}
                  </p>
                </div>
                <AlertCircle style={{ color: theme.palette.warning.main, width: 20, height: 20 }} />
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
                  <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Out of Stock</p>
                  <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.error.main }}>
                    {formatNumber(summary.out_of_stock_count)}
                  </p>
                </div>
                <Clock style={{ color: theme.palette.error.main, width: 20, height: 20 }} />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 24, 
            marginBottom: 32 
          }}>
            {/* Category Distribution */}
            <div style={{ 
              background: theme.palette.background.paper, 
              padding: 24, 
              borderRadius: 16, 
              boxShadow: theme.shadows[1], 
              border: `1px solid ${theme.palette.divider}` 
            }}>
              <h3 style={{ 
                fontSize: 18, 
                fontWeight: 600, 
                color: theme.palette.text.primary, 
                marginBottom: 16 
              }}>
                Category Distribution
              </h3>
              <div style={{ height: 300 }}>
                <Doughnut data={categoryChartData} options={chartOptions} />
              </div>
            </div>

            {/* Stock Status Distribution */}
            <div style={{ 
              background: theme.palette.background.paper, 
              padding: 24, 
              borderRadius: 16, 
              boxShadow: theme.shadows[1], 
              border: `1px solid ${theme.palette.divider}` 
            }}>
              <h3 style={{ 
                fontSize: 18, 
                fontWeight: 600, 
                color: theme.palette.text.primary, 
                marginBottom: 16 
              }}>
                Stock Status Overview
              </h3>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 16 
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 8,
                  background: theme.palette.success.light
                }}>
                  <span style={{ color: theme.palette.success.main, fontWeight: 600 }}>In Stock</span>
                  <span style={{ color: theme.palette.success.main, fontWeight: 700 }}>
                    {formatNumber(summary.total_products - summary.low_stock_count - summary.out_of_stock_count)}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 8,
                  background: theme.palette.warning.light
                }}>
                  <span style={{ color: theme.palette.warning.main, fontWeight: 600 }}>Low Stock</span>
                  <span style={{ color: theme.palette.warning.main, fontWeight: 700 }}>
                    {formatNumber(summary.low_stock_count)}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 8,
                  background: theme.palette.error.light
                }}>
                  <span style={{ color: theme.palette.error.main, fontWeight: 600 }}>Out of Stock</span>
                  <span style={{ color: theme.palette.error.main, fontWeight: 700 }}>
                    {formatNumber(summary.out_of_stock_count)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
              Search Products
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
                placeholder="Search by name, category, or batch..."
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

          {/* Category Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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
              <option value="">All Categories</option>
              {summary?.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Stock Status
            </label>
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
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
              <option value="normal">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedStockStatus('');
              }}
              style={{
                padding: '8px 16px',
                background: theme.palette.grey[500],
                color: theme.palette.grey[100],
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <X style={{ width: 16, height: 16 }} />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div style={{
        background: theme.palette.background.paper,
        borderRadius: 16,
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden'
      }}>
        <DataTable
          columns={columns}
          data={filteredInventory}
          loading={loading}
          emptyMessage="No inventory items found. Try adjusting your filters."
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24,
          padding: 16,
          background: theme.palette.background.paper,
          borderRadius: 12,
          boxShadow: theme.shadows[1],
          border: `1px solid ${theme.palette.divider}`
        }}>
          <p style={{
            fontSize: 14,
            color: theme.palette.text.secondary,
            margin: 0
          }}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                background: currentPage === 1 ? theme.palette.grey[300] : theme.palette.primary.main,
                color: currentPage === 1 ? theme.palette.grey[600] : theme.palette.primary.contrastText,
                border: 'none',
                borderRadius: 6,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                background: currentPage === totalPages ? theme.palette.grey[300] : theme.palette.primary.main,
                color: currentPage === totalPages ? theme.palette.grey[600] : theme.palette.primary.contrastText,
                border: 'none',
                borderRadius: 6,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Next
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReports;