import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertCircle,
  X,
  RefreshCw,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  CreditCard,
  Clock
} from 'lucide-react';
import { useTheme } from '@mui/material';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
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
import { TableColumn } from '../../types';
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

interface Payment {
  id: number | string;
  dispense_id: string;
  customer_id: number | string;
  total_amount: number | string;
  payment_method: string;
  status: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  transaction_type?: string;
  customer?: {
    name: string;
    phone: string;
  } | null;
  cart?: {
    items: unknown[];
  } | null;
  patient_name?: string;
  patient_phone?: string;
}

interface PaymentSummary {
  total_payments: number;
  total_revenue: number;
  pending_payments: number;
  approved_payments: number;
  rejected_payments: number;
  payment_methods: string[];
}

interface RevenueAnalytics {
  revenue_trends: Array<{
    period: string;
    revenue: number;
    transactions: number;
  }>;
  payment_method_breakdown: Array<{
    approved_payment_method: string;
    total_amount: number;
    count: number;
  }>;
  top_customers: Array<{
    Patient_ID: string;
    total_spent: number;
    transaction_count: number;
    customer?: {
      id: number;
      first_name: string;
      last_name: string;
      phone: string;
      name?: string;
    } | null;
  }>;
  summary: {
    total_revenue: number;
    total_transactions: number;
    average_transaction_value: number;
    peak_period: unknown;
    growth_rate: number;
  };
}

const PaymentReports: React.FC = () => {
  const theme = useTheme();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Analytics period
  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly');

  useEffect(() => {
    fetchPaymentData();
    fetchRevenueAnalytics();
  }, [currentPage, sortBy, sortOrder, analyticsPeriod, startDate, endDate, selectedStatus, selectedPaymentMethod]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, selectedStatus, selectedPaymentMethod, startDate, endDate]);

  const fetchPaymentData = async () => {
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
        ...(selectedPaymentMethod && { payment_method: selectedPaymentMethod }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });

      const response = await fetch(`${API_BASE_URL}/api/payment-reports?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payment data: ${response.status}`);
      }

      const result = await response.json();
      console.log('Payment data response:', result); // Debug log
      
      if (result.success) {
        // Transform the data to match our interface
        const transformedData = result.data.map((payment: any) => ({
          ...payment,
          total_amount: typeof payment.total_amount === 'string' ? parseFloat(payment.total_amount) : payment.total_amount,
          id: payment.id,
          // Use backend-provided patient_name and patient_phone directly
          patient_name: payment.patient_name || 'Unknown Customer',
          patient_phone: payment.patient_phone || 'N/A',
          // Keep existing customer object for backward compatibility
          customer: payment.customer || null
        }));
        
        setPayments(transformedData);
        setFilteredPayments(transformedData); // Set filtered data initially
        setSummary(result.summary);
        setTotalItems(result.meta?.total || transformedData.length);
        setTotalPages(result.meta?.last_page || 1);
      } else {
        setPayments([]);
        setFilteredPayments([]);
        setSummary(null);
      }
    } catch (err: any) {
      console.error('Fetch payment error:', err);
      setError(err.message);
      setPayments([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams({
        period: analyticsPeriod,
        start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });

      const response = await fetch(`${API_BASE_URL}/api/payment-reports/revenue-analytics?${params}`, {
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
          setRevenueAnalytics(result.data);
        }
      }
    } catch (err) {
      console.error('Fetch revenue analytics error:', err);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.patient_phone?.includes(searchTerm) ||
        payment.dispense_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transaction_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(payment => payment.status === selectedStatus);
    }

    if (selectedPaymentMethod) {
      filtered = filtered.filter(payment => payment.payment_method?.toLowerCase() === selectedPaymentMethod.toLowerCase());
    }

    if (startDate && endDate) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.approved_at || payment.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate + 'T23:59:59'); // Include end of day
        return paymentDate >= start && paymentDate <= end;
      });
    }

    setFilteredPayments(filtered);
  };

  const handleExportExcel = () => {
    const exportData = filteredPayments.map(payment => ({
      'Payment ID': payment.id,
      'Transaction Type': payment.transaction_type || 'complex_dispensing',
      'Customer Name': payment.patient_name || payment.customer?.name || 'Passover Customer',
      'Customer Phone': payment.patient_phone || payment.customer?.phone || 'N/A',
      'Total Amount': formatCurrency(payment.total_amount),
      'Payment Method': payment.payment_method?.toUpperCase() || 'CASH',
      'Status': getStatusText(payment.status),
      'Date': new Date(payment.created_at).toLocaleDateString(),
      'Approved Date': payment.approved_at ? new Date(payment.approved_at).toLocaleDateString() : 'N/A'
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
    link.setAttribute('download', `payment_report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Tsh ${num.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'rejected': return theme.palette.error.main;
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
      key: 'transaction_type',
      header: 'Type',
      sortable: true,
      width: '15%',
      render: (row: Payment) => {
        if (!row) return '-';
        const type = row.transaction_type || 'complex_dispensing';
        const typeLabels: Record<string, string> = {
          'complex_dispensing': 'Complex Dispense',
          'simple_dispensing': 'Simple Dispense',
          'wholesale': 'Wholesale'
        };
        const typeColors: Record<string, string> = {
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
      key: 'customer_info',
      header: 'Customer Info',
      sortable: false,
      width: '25%',
      render: (row: Payment) => {
        if (!row) return '-';
        // Use the backend-provided patient_name and patient_phone
        const customerName = row.patient_name || 'Unknown Customer';
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
      render: (row: Payment) => {
        if (!row) return '-';
        return (
          <span style={{ fontWeight: 600, color: theme.palette.success.main }}>
            {formatCurrency(row.total_amount)}
          </span>
        );
      }
    },
    {
      key: 'payment_method',
      header: 'Payment Method',
      sortable: true,
      width: '15%',
      render: (row: Payment) => {
        if (!row) return '-';
        const methodColors: Record<string, string> = {
          'cash': theme.palette.success.main,
          'card': theme.palette.primary.main,
          'mobile': theme.palette.secondary.main,
          'bank_transfer': theme.palette.info.main,
          'cheque': theme.palette.warning.main,
          'credit_card': theme.palette.primary.main,
          'mobile_money': theme.palette.secondary.main
        };
        const color = methodColors[row.payment_method?.toLowerCase()] || theme.palette.grey[500];
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500,
            background: color + '20',
            color: color
          }}>
            {row.payment_method?.toUpperCase() || 'CASH'}
          </span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '12%',
      render: (row: Payment) => {
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
      key: 'approved_at',
      header: 'Date/Approved',
      sortable: true,
      width: '18%',
      render: (row: Payment) => {
        if (!row) return '-';
        const date = row.approved_at || row.created_at;
        if (!date) {
          return (
            <span style={{ color: theme.palette.text.secondary, fontSize: 12 }}>
              Pending
            </span>
          );
        }
        return (
          <div>
            <div style={{ fontWeight: 500, color: theme.palette.text.primary }}>
              {new Date(date).toLocaleDateString()}
            </div>
            <div style={{ fontSize: 11, color: theme.palette.text.secondary }}>
              {new Date(date).toLocaleTimeString()}
            </div>
          </div>
        );
      }
    }
  ];

  // Chart data
  const revenueChartData = {
    labels: revenueAnalytics?.revenue_trends.map(item => {
      const date = new Date(item.period + '-01'); // Add day for parsing
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Revenue',
        data: revenueAnalytics?.revenue_trends.map(item => item.revenue) || [],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.4,
      },
      {
        label: 'Transactions',
        data: revenueAnalytics?.revenue_trends.map(item => item.transactions) || [],
        borderColor: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.light,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const paymentMethodChartData = {
    labels: revenueAnalytics?.payment_method_breakdown.map(item => item.approved_payment_method?.toUpperCase()) || [],
    datasets: [
      {
        data: revenueAnalytics?.payment_method_breakdown.map(item => item.total_amount) || [],
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

  if (loading && payments.length === 0) {
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
          message="Loading payment report..." 
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
          Payment Reports
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={fetchPaymentData}
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
                  <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Total Payments</p>
                  <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>
                    {formatNumber(summary.total_payments)}
                  </p>
                </div>
                <CreditCard style={{ color: theme.palette.primary.main, width: 20, height: 20 }} />
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
                  <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Approved</p>
                  <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.success.main }}>
                    {formatNumber(summary.approved_payments)}
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
                    {formatNumber(summary.pending_payments)}
                  </p>
                </div>
                <Clock style={{ color: theme.palette.warning.main, width: 20, height: 20 }} />
              </div>
            </div>
          </div>

          {/* Revenue Analytics */}
          {revenueAnalytics && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: 24,
              marginBottom: 32
            }}>
              {/* Revenue Trends Chart */}
              <div style={{
                background: theme.palette.background.paper,
                padding: 24,
                borderRadius: 16,
                boxShadow: theme.shadows[1],
                border: `1px solid ${theme.palette.divider}`
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
                    color: theme.palette.text.primary
                  }}>
                    Revenue Trends
                  </h3>
                  <select
                    value={analyticsPeriod}
                    onChange={(e) => setAnalyticsPeriod(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 6,
                      fontSize: 12,
                      background: theme.palette.background.default,
                      color: theme.palette.text.primary
                    }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div style={{ height: 300 }}>
                  <Bar data={revenueChartData} options={chartOptions} />
                </div>
              </div>

              {/* Payment Method Breakdown */}
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
                  Payment Methods
                </h3>
                <div style={{ height: 300 }}>
                  <Doughnut data={paymentMethodChartData} options={doughnutOptions} />
                </div>
              </div>
            </div>
          )}

          {/* Top Customers */}
          {revenueAnalytics?.top_customers && revenueAnalytics.top_customers.length > 0 && (
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
                marginBottom: 16
              }}>
                Top Customers
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 16
              }}>
                {revenueAnalytics.top_customers.slice(0, 6).map((customer, index) => (
                  <div
                    key={customer.Patient_ID}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      background: theme.palette.background.default,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <p style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          margin: '0 0 4px 0'
                        }}>
                          {customer.customer?.first_name && customer.customer?.last_name 
                            ? `${customer.customer.first_name} ${customer.customer.last_name}`
                            : customer.customer?.name || `Customer ${customer.Patient_ID}`}
                        </p>
                        <p style={{
                          fontSize: 12,
                          color: theme.palette.text.secondary,
                          margin: 0
                        }}>
                          {customer.transaction_count} transactions
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: theme.palette.success.main,
                          margin: 0
                        }}>
                          {formatCurrency(customer.total_spent)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Filters */}
      <div style={{
        background: theme.palette.background.paper,
        padding: 20,
        borderRadius: 12,
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`
      }}>
        <h3 style={{
          fontSize: 18,
          fontWeight: 600,
          color: theme.palette.text.primary,
          marginBottom: 16
        }}>
          Filters
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 20
        }}>
          {/* Search */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: theme.palette.text.primary,
              marginBottom: 8
            }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: theme.palette.text.primary,
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
                borderRadius: 6,
                fontSize: 14
              }}
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: theme.palette.text.primary,
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
                borderRadius: 6,
                fontSize: 14
              }}
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="mobile">Mobile Money</option>
              <option value="card">Card</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: theme.palette.text.primary,
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
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>

          {/* End Date */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: theme.palette.text.primary,
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
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <button
          onClick={() => {
            setSearchTerm('');
            setSelectedStatus('');
            setSelectedPaymentMethod('');
            setStartDate(new Date().toISOString().split('T')[0]);
            setEndDate(new Date().toISOString().split('T')[0]);
          }}
          style={{
            padding: '8px 16px',
            background: theme.palette.grey[100],
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 6,
            fontSize: 14,
            cursor: 'pointer',
            color: theme.palette.text.primary
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* DataTable */}
      <div style={{
        background: theme.palette.background.paper,
        padding: 20,
        borderRadius: 12,
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            color: theme.palette.text.primary,
            margin: 0
          }}>
            Payment Records
          </h3>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleExportExcel}
              style={{
                padding: '8px 16px',
                background: theme.palette.success.main,
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: theme.palette.error.main
          }}>
            <AlertCircle size={24} style={{ marginBottom: 8 }} />
            <p>{error}</p>
          </div>
        ) : (
          <DataTable
            data={filteredPayments}
            columns={columns}
            pagination={{
              currentPage,
              totalPages,
              totalItems,
              itemsPerPage,
              onPageChange: setCurrentPage
            }}
            onPerPageChange={(newPerPage) => {
              // Handle per page change if needed
            }}
            perPageOptions={[5, 10, 25, 50, 100]}
          />
        )}
      </div>
    </div>
  );
};

export default PaymentReports;