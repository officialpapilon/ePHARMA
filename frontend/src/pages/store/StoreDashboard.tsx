import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { API_BASE_URL } from '../../../constants';
import { 
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  BarChart3
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StoreDashboardData {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  stockStatus: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  topCategories: Array<{
    name: string;
    count: number;
    value: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>;
  stockTrends: Array<{
    date: string;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    severity: string;
    timestamp: string;
    isRead: boolean;
  }>;
}

const StoreDashboard: React.FC = () => {
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState<StoreDashboardData | null>(null);
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

      const response = await fetch(`${API_BASE_URL}/api/store-dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        setDashboardData(null);
      }
    } catch (err: any) {
      console.error('Fetch dashboard data error:', err);
      setError(err.message);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: dashboardData?.stockTrends?.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'In Stock',
        data: dashboardData?.stockTrends?.map(item => item.inStock) || [],
        backgroundColor: theme.palette.success.main,
        borderColor: theme.palette.success.dark,
        borderWidth: 1,
      },
      {
        label: 'Low Stock',
        data: dashboardData?.stockTrends?.map(item => item.lowStock) || [],
        backgroundColor: theme.palette.warning.main,
        borderColor: theme.palette.warning.dark,
        borderWidth: 1,
      },
      {
        label: 'Out of Stock',
        data: dashboardData?.stockTrends?.map(item => item.outOfStock) || [],
        backgroundColor: theme.palette.error.main,
        borderColor: theme.palette.error.dark,
        borderWidth: 1,
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
      title: {
        display: true,
        text: 'Stock Status Trends (Last 7 Days)',
        color: theme.palette.text.primary,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: theme.palette.text.secondary,
        },
        grid: {
          color: theme.palette.divider,
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
        <div style={{ textAlign: 'center' }}>
          <Clock style={{ 
            width: 48, 
            height: 48, 
            color: theme.palette.primary.main,
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: 16, color: theme.palette.text.secondary }}>Loading store dashboard...</p>
        </div>
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
          <p style={{ marginTop: 16, color: theme.palette.error.main }}>{error}</p>
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
        <div>
          <h2 style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            color: theme.palette.text.primary,
            margin: '0 0 8px 0'
          }}>
            Store Dashboard
          </h2>
          <p style={{ 
            fontSize: 14, 
            color: theme.palette.text.secondary,
            margin: 0
          }}>
            Inventory overview and stock management
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
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
          <NavigateNext style={{ width: 16, height: 16 }} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 24, 
        marginBottom: 32 
      }}>
        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 24, 
          borderRadius: 16, 
          boxShadow: theme.shadows[1],
          border: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ 
            padding: 12, 
            borderRadius: 12, 
            background: theme.palette.primary.light,
            color: theme.palette.primary.main
          }}>
            <BarChart3 style={{ width: 32, height: 32 }} />
          </div>
          <div>
            <p style={{ 
              fontSize: 14, 
              color: theme.palette.text.secondary,
              margin: '0 0 4px 0'
            }}>
              Total Items
            </p>
            <p style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              color: theme.palette.text.primary,
              margin: 0
            }}>
              {dashboardData?.totalItems || 0}
            </p>
          </div>
        </div>

        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 24, 
          borderRadius: 16, 
          boxShadow: theme.shadows[1],
          border: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ 
            padding: 12, 
            borderRadius: 12, 
            background: theme.palette.success.light,
            color: theme.palette.success.main
          }}>
            <TrendingUp style={{ width: 32, height: 32 }} />
          </div>
          <div>
            <p style={{ 
              fontSize: 14, 
              color: theme.palette.text.secondary,
              margin: '0 0 4px 0'
            }}>
              Total Value
            </p>
            <p style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              color: theme.palette.text.primary,
              margin: 0
            }}>
              Tsh {dashboardData?.totalValue?.toLocaleString() || '0'}
            </p>
          </div>
        </div>

        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 24, 
          borderRadius: 16, 
          boxShadow: theme.shadows[1],
          border: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ 
            padding: 12, 
            borderRadius: 12, 
            background: theme.palette.warning.light,
            color: theme.palette.warning.main
          }}>
            <AlertTriangle style={{ width: 32, height: 32 }} />
          </div>
          <div>
            <p style={{ 
              fontSize: 14, 
              color: theme.palette.text.secondary,
              margin: '0 0 4px 0'
            }}>
              Low Stock Items
            </p>
            <p style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              color: theme.palette.text.primary,
              margin: 0
            }}>
              {dashboardData?.lowStockItems || 0}
            </p>
          </div>
        </div>

        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 24, 
          borderRadius: 16, 
          boxShadow: theme.shadows[1],
          border: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ 
            padding: 12, 
            borderRadius: 12, 
            background: theme.palette.error.light,
            color: theme.palette.error.main
          }}>
            <Package style={{ width: 32, height: 32 }} />
          </div>
          <div>
            <p style={{ 
              fontSize: 14, 
              color: theme.palette.text.secondary,
              margin: '0 0 4px 0'
            }}>
              Out of Stock
            </p>
            <p style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              color: theme.palette.text.primary,
              margin: 0
            }}>
              {dashboardData?.outOfStockItems || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Charts and Content */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: 24, 
        marginBottom: 32 
      }}>
        {/* Stock Trends Chart */}
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
            Stock Status Trends
          </h3>
          <div style={{ height: 300 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Alerts */}
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
            Stock Alerts ({dashboardData?.alerts?.length || 0})
          </h3>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12,
            maxHeight: 300,
            overflowY: 'auto'
          }}>
            {dashboardData?.alerts?.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: alert.severity === 'error' 
                    ? theme.palette.error.light 
                    : theme.palette.warning.light,
                  border: `1px solid ${alert.severity === 'error' 
                    ? theme.palette.error.main 
                    : theme.palette.warning.main}`,
                }}
              >
                <p style={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  margin: '0 0 4px 0'
                }}>
                  {alert.title}
                </p>
                <p style={{ 
                  fontSize: 11, 
                  color: theme.palette.text.secondary,
                  margin: 0
                }}>
                  {alert.message}
                </p>
              </div>
            ))}
            {(!dashboardData?.alerts || dashboardData?.alerts?.length === 0) && (
              <p style={{ 
                fontSize: 12, 
                color: theme.palette.text.secondary,
                textAlign: 'center',
                margin: 0
              }}>
                No alerts at the moment
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top Categories */}
      {dashboardData?.topCategories && dashboardData?.topCategories?.length > 0 && (
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
            Top Categories by Value
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 16 
          }}>
            {dashboardData.topCategories?.map((category, index) => (
              <div
                key={index}
                style={{
                  padding: 16,
                  borderRadius: 8,
                  background: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <p style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  margin: '0 0 8px 0'
                }}>
                  {category.name}
                </p>
                <p style={{ 
                  fontSize: 12, 
                  color: theme.palette.text.secondary,
                  margin: '0 0 4px 0'
                }}>
                  {category.count} items
                </p>
                <p style={{ 
                  fontSize: 16, 
                  fontWeight: 700, 
                  color: theme.palette.primary.main,
                  margin: 0
                }}>
                  Tsh {category.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {dashboardData?.recentActivities && dashboardData?.recentActivities?.length > 0 && (
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
            Recent Activities
          </h3>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12 
          }}>
            {dashboardData.recentActivities?.map((activity) => (
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
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  margin: 0
                }}>
                  {activity.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Trends Chart */}
      {/* {dashboardData?.stockTrends && dashboardData?.stockTrends?.length > 0 && (
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
            Stock Status Trends
          </h3>
          <div style={{ height: 300 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )} */}
    </div>
  );
};

export default StoreDashboard;