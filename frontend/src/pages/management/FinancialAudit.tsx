import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Receipt,
  Store,
  Business,
  AccountBalance,
  Timeline,
  Person,
  Payment,
} from '@mui/icons-material';
import { Users, RefreshCw, FileText } from 'lucide-react';
import { Line } from 'react-chartjs-2';
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

interface FinancialAuditData {
  summary: {
    total_revenue: number;
    pharmacy_revenue: number;
    wholesale_revenue: number;
    financial_income: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
    transaction_count: {
      pharmacy: number;
      wholesale: number;
      expenses: number;
    };
  };
  pharmacy_transactions: Array<{
    id: number;
    transaction_id: string;
    patient_name: string;
    patient_phone: string;
    amount: number;
    payment_method: string;
    status: string;
    approved_by: string;
    created_by: string;
    approved_at: string;
    type: string;
  }>;
  wholesale_transactions: Array<{
    id: number;
    payment_number: string;
    order_number: string;
    customer_name: string;
    customer_contact: string;
    amount: number;
    payment_type: string;
    status: string;
    payment_date: string;
    created_by: string;
    type: string;
  }>;
  expenses: Array<{
    id: number;
    transaction_id: string;
    category: string;
    description: string;
    amount: number;
    payment_method: string;
    reference_number: string;
    transaction_date: string;
    created_by: string;
    approved_by: string;
    status: string;
    type: string;
  }>;
  user_activity: Array<{
    user_id: number;
    user_name: string;
    pharmacy_transactions: number;
    pharmacy_amount: number;
    expenses_count: number;
    expenses_amount: number;
    wholesale_transactions: number;
    wholesale_amount: number;
    total_transactions: number;
    total_amount: number;
  }>;
  payment_methods_breakdown: {
    pharmacy: Array<{
      approved_payment_method: string;
      count: number;
      amount: number;
    }>;
    wholesale: Array<{
      payment_type: string;
      count: number;
      amount: number;
    }>;
    expenses: Array<{
      payment_method: string;
      count: number;
      amount: number;
    }>;
  };
  daily_trends: Array<{
    date: string;
    pharmacy_revenue: number;
    wholesale_revenue: number;
    expenses: number;
    net_revenue: number;
  }>;
  top_performers: {
    pharmacy_customers: Array<{
      customer_id: number;
      customer_name: string;
      phone: string;
      total_spent: number;
      transaction_count: number;
      average_transaction: number;
    }>;
    wholesale_customers: Array<{
      customer_id: number;
      customer_name: string;
      contact_person: string;
      phone: string;
      total_spent: number;
      transaction_count: number;
      average_transaction: number;
    }>;
  };
  audit_trail: Array<{
    timestamp: string;
    action: string;
    user: string;
    details: string;
    amount: number;
    type: string;
    status: string;
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`audit-tabpanel-${index}`}
      aria-labelledby={`audit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const FinancialAudit: React.FC = () => {
  const theme = useTheme();
  const [auditData, setAuditData] = useState<FinancialAuditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionType, setTransactionType] = useState<string>('all');

  useEffect(() => {
    fetchAuditData();
  }, [startDate, endDate]);

  const fetchAuditData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        ...(transactionType !== 'all' && { transaction_type: transactionType }),
      });

      const response = await fetch(`${API_BASE_URL}/api/financial-audit?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch audit data`);
      }

      const result = await response.json();
      if (result.success) {
        setAuditData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch audit data');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? theme.palette.success.main : theme.palette.error.main;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return theme.palette.success.main;
      case 'pending':
        return theme.palette.warning.main;
      case 'failed':
      case 'rejected':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const summaryCards = [
    {
      title: 'Total Revenue',
      value: auditData?.summary.total_revenue || 0,
      icon: <TrendingUp />,
      color: theme.palette.success.main,
      subtitle: 'All income sources',
    },
    {
      title: 'Net Profit',
      value: auditData?.summary.net_profit || 0,
      icon: <TrendingUp />,
      color: getProfitColor(auditData?.summary.net_profit || 0),
      subtitle: 'Revenue minus expenses',
    },
    {
      title: 'Total Expenses',
      value: auditData?.summary.total_expenses || 0,
      icon: <TrendingDown />,
      color: theme.palette.error.main,
      subtitle: 'All recorded expenses',
    },
    {
      title: 'Profit Margin',
      value: auditData?.summary.profit_margin || 0,
      icon: <Assessment />,
      color: theme.palette.info.main,
      subtitle: 'Percentage of profit',
      isPercentage: true,
    },
  ];

  if (loading) {
    return <LoadingSpinner overlay message="Loading financial audit data..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchAuditData} startIcon={<RefreshCw />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          Financial Audit Report
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive financial analysis across all system transactions, expenses, and revenue streams
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchAuditData}
              startIcon={<RefreshCw />}
            >
              Refresh Data
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: `${card.color}20`,
                      color: card.color,
                      mr: 2,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {card.isPercentage
                        ? `${card.value.toFixed(1)}%`
                        : formatCurrency(card.value)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {card.subtitle}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Revenue Breakdown */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: `${theme.palette.primary.main}20`,
                    color: theme.palette.primary.main,
                    mr: 2,
                  }}
                >
                  <Store />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(auditData?.summary.pharmacy_revenue || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Pharmacy Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: `${theme.palette.secondary.main}20`,
                    color: theme.palette.secondary.main,
                    mr: 2,
                  }}
                >
                  <Business />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(auditData?.summary.wholesale_revenue || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Wholesale Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: `${theme.palette.success.main}20`,
                    color: theme.palette.success.main,
                    mr: 2,
                  }}
                >
                  <AccountBalance />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(auditData?.summary.financial_income || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Other Income
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Transactions" icon={<Receipt />} />
          <Tab label="User Activity" icon={<Person />} />
          <Tab label="Payment Methods" icon={<Payment />} />
          <Tab label="Trends" icon={<Timeline />} />
          <Tab label="Top Performers" icon={<Users />} />
          <Tab label="Audit Trail" icon={<FileText />} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing recent pharmacy and wholesale transactions
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Pharmacy Transactions: {auditData?.pharmacy_transactions.length || 0}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Wholesale Transactions: {auditData?.wholesale_transactions.length || 0}
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            User Activity Summary
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing user activity across all financial transactions
          </Typography>
          
          <Typography variant="body2">
            Total Users with Activity: {auditData?.user_activity.length || 0}
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Payment Methods Breakdown
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing payment method distribution across all transactions
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">Pharmacy Payment Methods</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">Wholesale Payment Methods</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">Expense Payment Methods</Typography>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Daily Revenue Trends
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing revenue trends over the selected period
          </Typography>
          
          {auditData?.daily_trends && auditData.daily_trends.length > 0 ? (
            <Box sx={{ height: 400 }}>
              <Line
                data={{
                  labels: auditData.daily_trends.map(trend => new Date(trend.date).toLocaleDateString()),
                  datasets: [
                    {
                      label: 'Pharmacy Revenue',
                      data: auditData.daily_trends.map(trend => trend.pharmacy_revenue),
                      borderColor: theme.palette.primary.main,
                      backgroundColor: `${theme.palette.primary.main}20`,
                      tension: 0.4,
                    },
                    {
                      label: 'Wholesale Revenue',
                      data: auditData.daily_trends.map(trend => trend.wholesale_revenue),
                      borderColor: theme.palette.secondary.main,
                      backgroundColor: `${theme.palette.secondary.main}20`,
                      tension: 0.4,
                    },
                    {
                      label: 'Net Revenue',
                      data: auditData.daily_trends.map(trend => trend.net_revenue),
                      borderColor: theme.palette.success.main,
                      backgroundColor: `${theme.palette.success.main}20`,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(Number(value));
                        },
                      },
                    },
                  },
                }}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No trend data available for the selected period
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Top Performers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing top customers by spending
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Top Pharmacy Customers</Typography>
              <Typography variant="body2">
                Count: {auditData?.top_performers.pharmacy_customers.length || 0}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Top Wholesale Customers</Typography>
              <Typography variant="body2">
                Count: {auditData?.top_performers.wholesale_customers.length || 0}
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            Complete Audit Trail
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing complete transaction history with user details
          </Typography>
          
          <Typography variant="body2">
            Total Audit Entries: {auditData?.audit_trail.length || 0}
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default FinancialAudit; 