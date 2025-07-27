import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Search, 
  Filter, 
  AlertCircle, 
  X, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Pill,
  Users,
  Calendar,
  Eye,
  Clock,
  DollarSign
} from 'lucide-react';
import { useTheme } from '@mui/material';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { API_BASE_URL } from '../../../constants';
import DataTable from '../../components/common/DataTable/DataTable';
import { TableColumn } from '../../components/common/DataTable/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DispensingRecord {
  id: number;
  dispense_id: string;
  patient_id: number;
  patient_name: string;
  products_dispensed: string;
  total_amount: number;
  dispensed_by: number;
  dispensed_at: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

interface DispensingSummary {
  total_dispensings: number;
  total_revenue: number;
  pending_dispensings: number;
  completed_dispensings: number;
  cancelled_dispensings: number;
  average_dispensing_value: number;
  top_dispensing_products: Array<{
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
  dispensing_trends: Array<{
    date: string;
    dispensings: number;
    revenue: number;
  }>;
}

const DispensingReports: React.FC = () => {
  const theme = useTheme();
  const [dispensings, setDispensings] = useState<DispensingRecord[]>([]);
  const [filteredDispensings, setFilteredDispensings] = useState<DispensingRecord[]>([]);
  const [summary, setSummary] = useState<DispensingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchDispensingData();
  }, [currentPage, sortBy, sortOrder]);

  useEffect(() => {
    filterDispensings();
  }, [dispensings, searchTerm, selectedStatus, selectedPaymentStatus, startDate, endDate]);

  const fetchDispensingData = async () => {
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
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedPaymentStatus && { payment_status: selectedPaymentStatus }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });

      const response = await fetch(`${API_BASE_URL}/api/dispensing-report?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dispensing data: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setDispensings(result.data);
        setSummary(result.summary);
        setTotalItems(result.meta.total);
        setTotalPages(result.meta.last_page);
      } else {
        setDispensings([]);
        setSummary(null);
      }
    } catch (err: any) {
      console.error('Fetch dispensing error:', err);
      setError(err.message);
      setDispensings([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const filterDispensings = () => {
    let filtered = dispensings;

    if (searchTerm) {
      filtered = filtered.filter(dispensing =>
        dispensing.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispensing.dispense_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispensing.products_dispensed.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(dispensing => dispensing.status === selectedStatus);
    }

    if (selectedPaymentStatus) {
      filtered = filtered.filter(dispensing => dispensing.payment_status === selectedPaymentStatus);
    }

    if (startDate && endDate) {
      filtered = filtered.filter(dispensing => {
        const dispensingDate = new Date(dispensing.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return dispensingDate >= start && dispensingDate <= end;
      });
    }

    setFilteredDispensings(filtered);
  };

  const handleExportExcel = () => {
    const exportData = filteredDispensings.map(dispensing => ({
      'Dispense ID': dispensing.dispense_id,
      'Patient Name': dispensing.patient_name,
      'Products': dispensing.products_dispensed,
      'Total Amount': dispensing.total_amount,
      'Status': dispensing.status,
      'Payment Status': dispensing.payment_status,
      'Dispensed Date': new Date(dispensing.dispensed_at).toLocaleDateString(),
      'Created Date': new Date(dispensing.created_at).toLocaleDateString()
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
    link.setAttribute('download', `dispensing_report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'Tsh 0';
    return `Tsh ${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'cancelled': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return '-';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'failed': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  // DataTable columns
  const columns: TableColumn[] = [
    {
      key: 'dispense_id',
      header: 'Dispense ID',
      sortable: true,
      width: '12%'
    },
    {
      key: 'patient_name',
      header: 'Patient',
      sortable: true,
      width: '18%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <div>
            <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {row.patient_name}
            </div>
            <div style={{ fontSize: 12, color: theme.palette.text.secondary }}>
              ID: {row.patient_id}
            </div>
          </div>
        );
      }
    },
    {
      key: 'products_dispensed',
      header: 'Products',
      sortable: false,
      width: '20%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <div style={{ 
            maxWidth: 200, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {row.products_dispensed}
          </div>
        );
      }
    },
    {
      key: 'total_amount',
      header: 'Amount',
      sortable: true,
      width: '12%',
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
      key: 'payment_status',
      header: 'Payment',
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
            background: getPaymentStatusColor(row.payment_status) + '20',
            color: getPaymentStatusColor(row.payment_status)
          }}>
            {getStatusText(row.payment_status)}
          </span>
        );
      }
    },
    {
      key: 'dispensed_at',
      header: 'Dispensed',
      sortable: true,
      width: '14%',
      render: (row: any) => {
        if (!row) return '-';
        return new Date(row.dispensed_at).toLocaleDateString();
      }
    }
  ];

  // Chart data
  const dispensingTrendsData = {
    labels: summary?.dispensing_trends.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Dispensings',
        data: summary?.dispensing_trends.map(item => item.dispensings) || [],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.4,
      },
      {
        label: 'Revenue',
        data: summary?.dispensing_trends.map(item => item.revenue) || [],
        borderColor: theme.palette.success.main,
        backgroundColor: theme.palette.success.light,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const topProductsData = {
    labels: summary?.top_dispensing_products.map(item => item.product_name) || [],
    datasets: [
      {
        data: summary?.top_dispensing_products.map(item => item.total_quantity) || [],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
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
        position: 'top' as const,
        labels: {
          color: theme.palette.text.primary,
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          color: theme.palette.text.secondary,
        },
        grid: {
          color: theme.palette.divider,
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        ticks: {
          color: theme.palette.text.secondary,
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        ticks: {
          color: theme.palette.text.secondary,
        },
        grid: {
          color: theme.palette.divider,
        },
      },
    },
  };

  const doughnutOptions = {
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

  if (loading && dispensings.length === 0) {
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
          message="Loading dispensing report..." 
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
          Dispensing Reports
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={fetchDispensingData}
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
                  <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Total Revenue</p>
                  <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.success.main }}>
                    {formatCurrency(summary.total_revenue)}
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
                  <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Total Dispensings</p>
                  <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>
                    {formatNumber(summary.total_dispensings)}
                  </p>
                </div>
                <Pill style={{ color: theme.palette.primary.main, width: 20, height: 20 }} />
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
                  <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Completed</p>
                  <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.success.main }}>
                    {formatNumber(summary.completed_dispensings)}
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
                  <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Pending</p>
                  <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.warning.main }}>
                    {formatNumber(summary.pending_dispensings)}
                  </p>
                </div>
                <Clock style={{ color: theme.palette.warning.main, width: 20, height: 20 }} />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr', 
            gap: 24, 
            marginBottom: 32 
          }}>
            {/* Dispensing Trends Chart */}
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
                Dispensing Trends
              </h3>
              <div style={{ height: 300 }}>
                <Line data={dispensingTrendsData} options={chartOptions} />
              </div>
            </div>

            {/* Top Products */}
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
                Top Dispensing Products
              </h3>
              <div style={{ height: 300 }}>
                <Doughnut data={topProductsData} options={doughnutOptions} />
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
              Search Dispensings
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
                placeholder="Search by patient name, dispense ID, or products..."
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
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Payment Status
            </label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
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
              <option value="">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
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

          {/* Clear Filters */}
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('');
                setSelectedPaymentStatus('');
                setStartDate('');
                setEndDate('');
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

      {/* Dispensings Table */}
      <div style={{
        background: theme.palette.background.paper,
        borderRadius: 16,
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden'
      }}>
        <DataTable
          columns={columns}
          data={filteredDispensings}
          loading={loading}
          emptyMessage="No dispensing records found. Try adjusting your filters."
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
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} dispensings
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

export default DispensingReports;
