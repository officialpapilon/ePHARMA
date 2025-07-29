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
  DollarSign,
  CreditCard,
  Users,
  Calendar,
  Eye,
  Clock
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

interface Payment {
  id: number;
  cart_id: number;
  customer_id: number;
  total_amount: number;
  payment_method: string;
  status: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    name: string;
    phone: string;
  };
  cart?: {
    items: any[];
  };
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
    date: string;
    revenue: number;
    sales_count: number;
  }>;
  payment_method_breakdown: Array<{
    payment_method: string;
    total_amount: number;
    count: number;
  }>;
  top_customers: Array<{
    customer_id: number;
    total_spent: number;
    transaction_count: number;
    customer?: {
      name: string;
    };
  }>;
  summary: {
    total_revenue: number;
    total_transactions: number;
    average_transaction_value: number;
    peak_period: any;
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
  }, [currentPage, sortBy, sortOrder, analyticsPeriod, startDate, endDate]);

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
      if (result.success) {
        setPayments(result.data);
        setSummary(result.summary);
        setTotalItems(result.meta.total);
        setTotalPages(result.meta.last_page);
      } else {
        setPayments([]);
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
        payment.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer?.phone?.includes(searchTerm) ||
        payment.id.toString().includes(searchTerm)
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(payment => payment.status === selectedStatus);
    }

    if (selectedPaymentMethod) {
      filtered = filtered.filter(payment => payment.payment_method === selectedPaymentMethod);
    }

    if (startDate && endDate) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return paymentDate >= start && paymentDate <= end;
      });
    }

    setFilteredPayments(filtered);
  };

  const handleExportExcel = () => {
    const exportData = filteredPayments.map(payment => ({
      'Payment ID': payment.id,
      'Customer Name': payment.customer?.name || 'Unknown',
      'Customer Phone': payment.customer?.phone || 'N/A',
      'Total Amount': payment.total_amount,
      'Payment Method': payment.payment_method,
      'Status': payment.status,
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

  const formatCurrency = (amount: number) => {
    return `Tsh ${amount.toLocaleString()}`;
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
      key: 'id',
      header: 'Payment ID',
      sortable: true,
      width: '10%'
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      width: '20%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <div>
            <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {row.customer?.name || 'Unknown'}
            </div>
            <div style={{ fontSize: 12, color: theme.palette.text.secondary }}>
              {row.customer?.phone || 'N/A'}
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
      render: (row: any) => {
        if (!row) return '-';
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500,
            background: theme.palette.primary.light,
            color: theme.palette.primary.main
          }}>
            {row.payment_method}
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
      key: 'created_at',
      header: 'Date',
      sortable: true,
      width: '15%',
      render: (row: any) => {
        if (!row) return '-';
        return new Date(row.created_at).toLocaleDateString();
      }
    },
    {
      key: 'approved_at',
      header: 'Approved',
      sortable: true,
      width: '13%',
      render: (row: any) => {
        if (!row) return '-';
        return row.approved_at ? new Date(row.approved_at).toLocaleDateString() : '-';
      }
    }
  ];

  // Chart data
  const revenueChartData = {
    labels: revenueAnalytics?.revenue_trends.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
        label: 'Sales Count',
        data: revenueAnalytics?.revenue_trends.map(item => item.sales_count) || [],
        borderColor: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.light,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const paymentMethodChartData = {
    labels: revenueAnalytics?.payment_method_breakdown.map(item => item.payment_method) || [],
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
                  <Line data={revenueChartData} options={chartOptions} />
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
                    key={customer.customer_id}
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
                          {customer.customer?.name || `Customer ${customer.customer_id}`}
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
              Search Payments
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
                placeholder="Search by customer name, phone, or ID..."
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
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
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
              {summary?.payment_methods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
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
                setSelectedPaymentMethod('');
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

      {/* Payments Table */}
      <div style={{
        background: theme.palette.background.paper,
        borderRadius: 16,
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden'
      }}>
        <DataTable
          columns={columns}
          data={filteredPayments}
          loading={loading}
          emptyMessage="No payments found. Try adjusting your filters."
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
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} payments
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

export default PaymentReports;