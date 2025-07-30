import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  AlertCircle, 
  RefreshCw,
  FileSpreadsheet,
  BarChart3,
  Pill,
  Users,
  Clock,
  FileText
} from 'lucide-react';
import { useTheme } from '@mui/material';
import { Bar } from 'react-chartjs-2';
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
  patient_id: number | string;
  patient_name: string;
  patient_phone?: string;
  total_amount: number;
  dispensed_by: number;
  dispensed_by_name?: string;
  dispensed_at: string;
  status: string;
  payment_status?: string;
  payment_method?: string;
  transaction_type?: string;
  created_at: string;
  updated_at: string;
  type?: string;
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
  // New summary by type
  complex_dispensing: {
    count: number;
    revenue: number;
  };
  simple_dispensing: {
    count: number;
    revenue: number;
  };
  wholesale: {
    count: number;
    revenue: number;
  };
}

const DispensingReports: React.FC = () => {
  const theme = useTheme();
  const [dispensings, setDispensings] = useState<DispensingRecord[]>([]);
  const [filteredDispensings, setFilteredDispensings] = useState<DispensingRecord[]>([]);
  const [summary, setSummary] = useState<DispensingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters - Set default date to current date
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [selectedTransactionType, setSelectedTransactionType] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchDispensingData();
  }, [currentPage, sortBy, sortOrder, startDate, endDate, selectedStatus, selectedPaymentStatus, selectedTransactionType, selectedPaymentMethod]);

  useEffect(() => {
    filterDispensings();
  }, [dispensings, searchTerm]);

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
        ...(selectedTransactionType && { transaction_type: selectedTransactionType }),
        ...(selectedPaymentMethod && { payment_method: selectedPaymentMethod }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });

      const response = await fetch(`${API_BASE_URL}/api/dispensing-reports?${params}`, {
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
      console.log('Dispensing data response:', result); // Debug log
      
      if (result.success) {
        setDispensings(result.data || []);
        setSummary(result.summary || null);
        setTotalItems(result.meta?.total || (result.data || []).length);
        setTotalPages(result.meta?.last_page || 1);
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
        dispensing.patient_phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDispensings(filtered);
  };

  const handleExportExcel = () => {
    // Excel export functionality
    console.log('Exporting to Excel...');
  };

  const handleExportPDF = () => {
    // Simple PDF export using jsPDF
    console.log('Exporting to PDF...');
    
    // Import jsPDF dynamically
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Dispensing Reports', 14, 20);
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Add summary
      if (summary) {
        doc.setFontSize(14);
        doc.text('Summary', 14, 45);
        doc.setFontSize(10);
        doc.text(`Total Dispensings: ${formatNumber(summary.total_dispensings)}`, 14, 55);
        doc.text(`Total Revenue: Tsh ${formatCurrency(summary.total_revenue)}`, 14, 62);
        doc.text(`Complex Dispensing: ${formatNumber(summary.complex_dispensing?.count || 0)} (Tsh ${formatCurrency(summary.complex_dispensing?.revenue || 0)})`, 14, 69);
        doc.text(`Simple Dispensing: ${formatNumber(summary.simple_dispensing?.count || 0)} (Tsh ${formatCurrency(summary.simple_dispensing?.revenue || 0)})`, 14, 76);
      }
      
      // Add table headers
      const headers = ['ID', 'Type', 'Customer', 'Amount', 'Payment', 'Status', 'Date'];
      let yPosition = summary ? 85 : 40;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      headers.forEach((header, index) => {
        doc.text(header, 14 + (index * 25), yPosition);
      });
      
      // Add table data
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      
      filteredDispensings.forEach((record, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        const rowData = [
          record.id,
          record.transaction_type === 'complex_dispensing' ? 'Complex' : 
          record.transaction_type === 'simple_dispensing' ? 'Simple' : 'Wholesale',
          record.patient_name,
          `Tsh ${formatCurrency(record.total_amount)}`,
          record.payment_method?.toUpperCase() || 'CASH',
          record.status,
          new Date(record.dispensed_at).toLocaleDateString()
        ];
        
        rowData.forEach((cell, cellIndex) => {
          doc.text(cell, 14 + (cellIndex * 25), yPosition + 10 + (index * 8));
        });
        
        yPosition += 8;
      });
      
      // Save PDF
      doc.save('dispensing-reports.pdf');
    }).catch(error => {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '0';
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'approved':
      case 'paid':
        return theme.palette.success.main;
      case 'pending':
        return theme.palette.warning.main;
      case 'cancelled':
      case 'failed':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return '-';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'failed': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  // DataTable columns
  const columns = [
    {
      key: 'transaction_type',
      header: 'Type',
      sortable: true,
      width: '12%',
      render: (row: any) => {
        if (!row) return '-';
        const type = row.transaction_type || row.type || 'complex_dispensing';
        const typeLabels = {
          'complex_dispensing': 'Complex',
          'simple_dispensing': 'Simple',
          'wholesale': 'Wholesale'
        };
        const typeColors = {
          'complex_dispensing': theme.palette.primary.main,
          'simple_dispensing': theme.palette.secondary.main,
          'wholesale': theme.palette.success.main
        };
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 500,
            background: typeColors[type] + '20',
            color: typeColors[type]
          }}>
            {typeLabels[type] || type}
          </span>
        );
      }
    },
    {
      key: 'patient_name',
      header: 'Customer Info',
      sortable: true,
      width: '20%',
      render: (row: any) => {
        if (!row) return '-';
        const customerName = row.patient_name === 'Passover Customer' ? 'Passover Customer' : row.patient_name;
        const customerPhone = row.patient_phone || 'N/A';
        return (
          <div>
            <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {customerName}
            </div>
            <div style={{ fontSize: 12, color: theme.palette.text.secondary }}>
              {customerPhone}
            </div>
          </div>
        );
      }
    },
    {
      key: 'total_amount',
      header: 'Amount',
      sortable: true,
      width: '15%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <span style={{ fontWeight: 600, color: theme.palette.success.main }}>
            Tsh {formatCurrency(row.total_amount)}
          </span>
        );
      }
    },
    {
      key: 'payment_method',
      header: 'Payment Method',
      sortable: true,
      width: '15%',
      render: (row: any) => {
        if (!row) return '-';
        const method = row.payment_method || 'cash';
        const methodColors = {
          'cash': theme.palette.success.main,
          'card': theme.palette.primary.main,
          'mobile': theme.palette.secondary.main,
          'bank_transfer': theme.palette.info.main,
          'cheque': theme.palette.warning.main,
          'credit_card': theme.palette.primary.main,
          'mobile_money': theme.palette.secondary.main
        };
        const color = methodColors[method] || theme.palette.grey[500];
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 500,
            background: color + '20',
            color: color
          }}>
            {method.toUpperCase()}
          </span>
        );
      }
    },
    {
      key: 'dispensed_by_name',
      header: 'Dispensed By',
      sortable: true,
      width: '15%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <span style={{ fontWeight: 500, color: theme.palette.text.primary }}>
            {row.dispensed_by_name || 'Unknown'}
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
            fontSize: 11,
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
      key: 'dispensed_at',
      header: 'Dispensed At',
      sortable: true,
      width: '15%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <div>
            <div style={{ fontWeight: 500, color: theme.palette.text.primary }}>
              {new Date(row.dispensed_at).toLocaleDateString()}
            </div>
            <div style={{ fontSize: 11, color: theme.palette.text.secondary }}>
              {new Date(row.dispensed_at).toLocaleTimeString()}
            </div>
          </div>
        );
      }
    }
  ];

  // Chart data
  const revenueChartData = {
    labels: summary?.dispensing_trends.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Revenue',
        data: summary?.dispensing_trends.map(item => item.revenue) || [],
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.main,
        borderWidth: 1,
      },
      {
        label: 'Dispensings',
        data: summary?.dispensing_trends.map(item => item.dispensings) || [],
        backgroundColor: theme.palette.secondary.main,
        borderColor: theme.palette.secondary.main,
        borderWidth: 1,
        yAxisID: 'y1',
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
            onClick={handleExportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              border: `1px solid ${theme.palette.primary.main}`,
              borderRadius: 8,
              background: 'transparent',
              color: theme.palette.primary.main,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            <FileSpreadsheet size={16} />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              border: `1px solid ${theme.palette.secondary.main}`,
              borderRadius: 8,
              background: 'transparent',
              color: theme.palette.secondary.main,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            <FileText size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 16, 
          marginBottom: 24 
        }}>
          {/* Total Summary */}
          <div style={{
            background: theme.palette.background.paper,
            borderRadius: 12,
            padding: 20,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: theme.palette.primary.main + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Pill size={20} color={theme.palette.primary.main} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: theme.palette.text.secondary, fontWeight: 500 }}>
                  Total Dispensings
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>
                  {formatNumber(summary.total_dispensings)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.palette.success.main }}>
              Tsh {formatCurrency(summary.total_revenue)}
            </div>
          </div>

          {/* Complex Dispensing */}
          <div style={{
            background: theme.palette.background.paper,
            borderRadius: 12,
            padding: 20,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: theme.palette.primary.main + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={20} color={theme.palette.primary.main} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: theme.palette.text.secondary, fontWeight: 500 }}>
                  Complex Dispensing
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>
                  {formatNumber(summary.complex_dispensing?.count || 0)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.palette.primary.main }}>
              Tsh {formatCurrency(summary.complex_dispensing?.revenue || 0)}
            </div>
          </div>

          {/* Simple Dispensing */}
          <div style={{
            background: theme.palette.background.paper,
            borderRadius: 12,
            padding: 20,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: theme.palette.secondary.main + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={20} color={theme.palette.secondary.main} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: theme.palette.text.secondary, fontWeight: 500 }}>
                  Simple Dispensing
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>
                  {formatNumber(summary.simple_dispensing?.count || 0)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.palette.secondary.main }}>
              Tsh {formatCurrency(summary.simple_dispensing?.revenue || 0)}
            </div>
          </div>

          {/* Wholesale */}
          <div style={{
            background: theme.palette.background.paper,
            borderRadius: 12,
            padding: 20,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: theme.palette.success.main + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChart3 size={20} color={theme.palette.success.main} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: theme.palette.text.secondary, fontWeight: 500 }}>
                  Wholesale
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>
                  {formatNumber(summary.wholesale?.count || 0)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.palette.success.main }}>
              Tsh {formatCurrency(summary.wholesale?.revenue || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: theme.palette.background.paper,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 16 
        }}>
          <Filter size={20} color={theme.palette.primary.main} />
          <h3 style={{ 
            fontSize: 16, 
            fontWeight: 600, 
            color: theme.palette.text.primary,
            margin: 0
          }}>
            Filters
          </h3>
        </div>

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
              Search
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: theme.palette.text.secondary
                }}
              />
              <input
                type="text"
                placeholder="Search by ID, customer, or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 40px',
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
              <option value="approved">Approved</option>
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

          {/* Transaction Type Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Transaction Type
            </label>
            <select
              value={selectedTransactionType}
              onChange={(e) => setSelectedTransactionType(e.target.value)}
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
              <option value="">All Types</option>
              <option value="complex_dispensing">Complex Dispensing</option>
              <option value="simple_dispensing">Simple Dispensing</option>
              <option value="wholesale">Wholesale</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Payment Method
            </label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
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
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
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
                setSelectedTransactionType('');
                setSelectedPaymentMethod('');
                setStartDate(new Date().toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
              style={{
                padding: '8px 16px',
                border: `1px solid ${theme.palette.error.main}`,
                borderRadius: 8,
                background: 'transparent',
                color: theme.palette.error.main,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: theme.palette.error.light,
          color: theme.palette.error.main,
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Data Table */}
      <div style={{
        background: theme.palette.background.paper,
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: theme.palette.text.primary,
            margin: 0
          }}>
            Dispensing Records ({filteredDispensings.length})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw
              size={16}
              style={{ cursor: 'pointer', color: theme.palette.primary.main }}
              onClick={fetchDispensingData}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <LoadingSpinner loading={true} message="Loading..." size={32} />
          </div>
        ) : filteredDispensings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: theme.palette.text.secondary
          }}>
            <Pill size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              No dispensing records found
            </div>
            <div style={{ fontSize: 14 }}>
              Try adjusting your filters or search terms
            </div>
          </div>
        ) : (
          <>
            <DataTable
              data={filteredDispensings}
              columns={columns}
              loading={loading}
              pagination={{
                current_page: currentPage,
                last_page: totalPages,
                total: totalItems,
                per_page: itemsPerPage,
                onPageChange: setCurrentPage
              }}
              onPerPageChange={(newPerPage) => {
                setItemsPerPage(newPerPage);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      {summary && summary.dispensing_trends && summary.dispensing_trends.length > 0 && (
        <div style={{
          background: theme.palette.background.paper,
          borderRadius: 12,
          padding: 20,
          marginTop: 24,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: theme.palette.text.primary,
            marginBottom: 20
          }}>
            Dispensing Trends
          </h3>
          <div style={{ height: 400 }}>
            <Bar data={revenueChartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DispensingReports;
