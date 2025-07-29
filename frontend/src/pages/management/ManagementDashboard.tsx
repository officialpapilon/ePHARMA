import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  AlertTriangle,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '@mui/material';
import { Line, Doughnut } from 'react-chartjs-2';
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

interface DashboardData {
  financial: {
    total_revenue: number;
    monthly_revenue: number;
    weekly_revenue: number;
    revenue_growth: number;
  };
  inventory: {
    total_products: number;
    low_stock_products: number;
    out_of_stock_products: number;
    total_inventory_value: number;
  };
  sales: {
    total_sales: number;
    monthly_sales: number;
    total_customers: number;
    new_customers_this_month: number;
  };
  staff: {
    total_staff: number;
    active_staff: number;
  };
  recent_activities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    amount?: number;
  }>;
  top_selling_products: Array<{
    product_id: string;
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
  revenue_trends: Array<{
    date: string;
    revenue: number;
    sales_count: number;
  }>;
  category_performance: Array<{
    product_category: string;
    product_count: number;
    total_value: number;
  }>;
}

const ManagementDashboard: React.FC = () => {
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/api/management-dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Management dashboard API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch dashboard data: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Management dashboard API response:', result);
      
      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        console.error('Management dashboard API returned unsuccessful response:', result);
        setDashboardData(null);
      }
    } catch (err: unknown) {
      console.error('Fetch dashboard data error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Tsh ${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? theme.palette.success.main : theme.palette.error.main;
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  // Chart data
  const revenueChartData = {
    labels: dashboardData?.revenue_trends.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Revenue',
        data: dashboardData?.revenue_trends.map(item => item.revenue) || [],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.4,
      },
      {
        label: 'Sales Count',
        data: dashboardData?.revenue_trends.map(item => item.sales_count) || [],
        borderColor: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.light,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const categoryChartData = {
    labels: dashboardData?.category_performance.map(item => item.product_category) || [],
    datasets: [
      {
        data: dashboardData?.category_performance.map(item => item.total_value) || [],
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

  if (loading) {
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
          message="Loading management dashboard..." 
          size={48}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '16px', 
        background: theme.palette.background.default, 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle style={{ 
            width: 48, 
            height: 48, 
            color: theme.palette.error.main
          }} />
          <p style={{ marginTop: 16, color: theme.palette.error.main }}>Error: {error}</p>
          <button
            onClick={fetchDashboardData}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
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
          Management Dashboard
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={fetchDashboardData}
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
        </div>
      </div>

      {dashboardData && (
        <>
          {/* Financial Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 24, 
            marginBottom: 32 
          }}>
            {/* Total Revenue */}
            <div style={{ 
              background: theme.palette.background.paper, 
              padding: 24, 
              borderRadius: 16, 
              boxShadow: theme.shadows[1], 
              border: `1px solid ${theme.palette.divider}` 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Total Revenue</p>
                  <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>
                    {formatCurrency(dashboardData.financial.total_revenue)}
                  </p>
                </div>
                <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.success.light }}>
                  <DollarSign style={{ color: theme.palette.success.main, width: 24, height: 24 }} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
                {getGrowthIcon(dashboardData.financial.revenue_growth)}
                <span style={{ 
                  fontSize: 14, 
                  fontWeight: 500, 
                  color: getGrowthColor(dashboardData.financial.revenue_growth),
                  marginLeft: 6
                }}>
                  {dashboardData.financial.revenue_growth >= 0 ? '+' : ''}{dashboardData.financial.revenue_growth}%
                </span>
                <span style={{ fontSize: 14, color: theme.palette.text.secondary, marginLeft: 8 }}>from last month</span>
              </div>
            </div>

            {/* Monthly Revenue */}
            <div style={{ 
              background: theme.palette.background.paper, 
              padding: 24, 
              borderRadius: 16, 
              boxShadow: theme.shadows[1], 
              border: `1px solid ${theme.palette.divider}` 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Monthly Revenue</p>
                  <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>
                    {formatCurrency(dashboardData.financial.monthly_revenue)}
                  </p>
                </div>
                <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.primary.light }}>
                  <Calendar style={{ color: theme.palette.primary.main, width: 24, height: 24 }} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: theme.palette.text.secondary }}>
                  This month's total revenue
                </span>
              </div>
            </div>

            {/* Total Sales */}
            <div style={{ 
              background: theme.palette.background.paper, 
              padding: 24, 
              borderRadius: 16, 
              boxShadow: theme.shadows[1], 
              border: `1px solid ${theme.palette.divider}` 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Total Sales</p>
                  <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>
                    {formatNumber(dashboardData.sales.total_sales)}
                  </p>
                </div>
                <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.warning.light }}>
                  <ShoppingCart style={{ color: theme.palette.warning.main, width: 24, height: 24 }} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: theme.palette.text.secondary }}>
                  {formatNumber(dashboardData.sales.monthly_sales)} this month
                </span>
              </div>
            </div>

            {/* Total Customers */}
            <div style={{ 
              background: theme.palette.background.paper, 
              padding: 24, 
              borderRadius: 16, 
              boxShadow: theme.shadows[1], 
              border: `1px solid ${theme.palette.divider}` 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Total Customers</p>
                  <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>
                    {formatNumber(dashboardData.sales.total_customers)}
                  </p>
                </div>
                <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.info.light }}>
                  <Users style={{ color: theme.palette.info.main, width: 24, height: 24 }} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: theme.palette.text.secondary }}>
                  +{formatNumber(dashboardData.sales.new_customers_this_month)} new this month
                </span>
              </div>
            </div>
          </div>

          {/* Inventory Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: 24, 
            marginBottom: 32 
          }}>
            {/* Total Products */}
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
                    {formatNumber(dashboardData.inventory.total_products)}
                  </p>
                </div>
                <Package style={{ color: theme.palette.primary.main, width: 20, height: 20 }} />
              </div>
            </div>

            {/* Low Stock */}
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
                    {formatNumber(dashboardData.inventory.low_stock_products)}
                  </p>
                </div>
                <AlertTriangle style={{ color: theme.palette.warning.main, width: 20, height: 20 }} />
              </div>
            </div>

            {/* Out of Stock */}
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
                    {formatNumber(dashboardData.inventory.out_of_stock_products)}
                  </p>
                </div>
                <Clock style={{ color: theme.palette.error.main, width: 20, height: 20 }} />
              </div>
            </div>

            {/* Inventory Value */}
            <div style={{ 
              background: theme.palette.background.paper, 
              padding: 20, 
              borderRadius: 12, 
              boxShadow: theme.shadows[1], 
              border: `1px solid ${theme.palette.divider}` 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>Inventory Value</p>
                  <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: theme.palette.success.main }}>
                    {formatCurrency(dashboardData.inventory.total_inventory_value)}
                  </p>
                </div>
                <BarChart3 style={{ color: theme.palette.success.main, width: 20, height: 20 }} />
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
            {/* Revenue Trends Chart */}
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
                Revenue Trends (Last 7 Days)
              </h3>
              <div style={{ height: 300 }}>
                <Line data={revenueChartData} options={chartOptions} />
              </div>
            </div>

            {/* Category Performance */}
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
                Category Performance
              </h3>
              <div style={{ height: 300 }}>
                <Doughnut data={categoryChartData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* Recent Activities & Top Products */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 24 
          }}>
            {/* Recent Activities */}
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
                Recent Activities
              </h3>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 12 
              }}>
                {dashboardData.recent_activities.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: theme.palette.background.default,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <p style={{ 
                      fontSize: 12, 
                      color: theme.palette.text.secondary,
                      margin: '0 0 4px 0'
                    }}>
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                    <p style={{ 
                      fontSize: 14, 
                      fontWeight: 500, 
                      color: theme.palette.text.primary,
                      margin: 0
                    }}>
                      {activity.description}
                    </p>
                    {activity.amount && (
                      <p style={{ 
                        fontSize: 12, 
                        fontWeight: 600, 
                        color: theme.palette.success.main,
                        margin: '4px 0 0 0'
                      }}>
                        {formatCurrency(activity.amount)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Top Selling Products */}
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
                Top Selling Products
              </h3>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 12 
              }}>
                {dashboardData.top_selling_products.slice(0, 8).map((product) => (
                  <div
                    key={product.product_id}
                    style={{
                      padding: 12,
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
                          {product.product_name}
                        </p>
                        <p style={{ 
                          fontSize: 12, 
                          color: theme.palette.text.secondary,
                          margin: 0
                        }}>
                          {formatNumber(product.total_quantity)} units sold
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ 
                          fontSize: 14, 
                          fontWeight: 600, 
                          color: theme.palette.success.main,
                          margin: 0
                        }}>
                          {formatCurrency(product.total_revenue)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManagementDashboard;