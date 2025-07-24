import React from 'react';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useTheme } from '@mui/material';

const Dashboard = () => {
  const theme = useTheme();
  // Mock data for charts
  const monthlySales = [
    { month: 'Jan', value: 35000 },
    { month: 'Feb', value: 42000 },
    { month: 'Mar', value: 38000 },
    { month: 'Apr', value: 45000 },
    { month: 'May', value: 52000 },
    { month: 'Jun', value: 48000 },
    { month: 'Jul', value: 55000 },
    { month: 'Aug', value: 60000 },
    { month: 'Sep', value: 58000 },
    { month: 'Oct', value: 65000 },
    { month: 'Nov', value: 70000 },
    { month: 'Dec', value: 75000 }
  ];

  const customerGrowth = [
    { month: 'Jan', value: 120 },
    { month: 'Feb', value: 135 },
    { month: 'Mar', value: 142 },
    { month: 'Apr', value: 158 },
    { month: 'May', value: 165 },
    { month: 'Jun', value: 180 },
    { month: 'Jul', value: 195 },
    { month: 'Aug', value: 210 },
    { month: 'Sep', value: 225 },
    { month: 'Oct', value: 240 },
    { month: 'Nov', value: 255 },
    { month: 'Dec', value: 270 }
  ];

  const salesByCategory = [
    { category: 'Analgesics', value: 25 },
    { category: 'Antibiotics', value: 20 },
    { category: 'Antihistamines', value: 15 },
    { category: 'Antidiabetics', value: 12 },
    { category: 'Statins', value: 10 },
    { category: 'Others', value: 18 }
  ];

  const maxSalesValue = Math.max(...monthlySales.map(item => item.value));
  const maxCustomerValue = Math.max(...customerGrowth.map(item => item.value));
  const maxCategoryValue = Math.max(...salesByCategory.map(item => item.value));

  return (
    <div style={{ padding: 24, background: theme.palette.background.default, minHeight: '100vh' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 24 }}>Management Dashboard</h2>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Card 1 */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Total Sales</p>
              <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>Tsh 643,568</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.success.light }}>
              <DollarSign style={{ color: theme.palette.success.main, width: 24, height: 24 }} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
            <TrendingUp style={{ color: theme.palette.success.main, marginRight: 6, width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.palette.success.main }}>+15.3%</span>
            <span style={{ fontSize: 14, color: theme.palette.text.secondary, marginLeft: 8 }}>from last year</span>
          </div>
        </div>
        
        {/* Card 2 */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Total Customers</p>
              <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>1,254</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.info.light }}>
              <Users style={{ color: theme.palette.info.main, width: 24, height: 24 }} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
            <TrendingUp style={{ color: theme.palette.success.main, marginRight: 6, width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.palette.success.main }}>+12.8%</span>
            <span style={{ fontSize: 14, color: theme.palette.text.secondary, marginLeft: 8 }}>from last year</span>
          </div>
        </div>
        
        {/* Card 3 */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Items Sold</p>
              <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>24,568</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.warning.light }}>
              <Package style={{ color: theme.palette.warning.main, width: 24, height: 24 }} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
            <TrendingUp style={{ color: theme.palette.success.main, marginRight: 6, width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.palette.success.main }}>+18.2%</span>
            <span style={{ fontSize: 14, color: theme.palette.text.secondary, marginLeft: 8 }}>from last year</span>
          </div>
        </div>
        
        {/* Card 4 */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Pending Payments</p>
              <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>Tsh 3,428</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.error.light }}>
              <ShoppingCart style={{ color: theme.palette.error.main, width: 24, height: 24 }} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
            <TrendingUp style={{ color: theme.palette.error.main, marginRight: 6, width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.palette.error.main }}>-7.5%</span>
            <span style={{ fontSize: 14, color: theme.palette.text.secondary, marginLeft: 8 }}>from last month</span>
          </div>
        </div>
      </div>
      
      {/* Sales Chart */}
      <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], marginBottom: 32, border: `1px solid ${theme.palette.divider}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.palette.text.primary }}>Monthly Sales</h3>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: theme.palette.text.secondary }}>
            <Calendar style={{ width: 16, height: 16, marginRight: 4 }} />
            <span>2025</span>
          </div>
        </div>
        <div style={{ height: 256 }}>
          {/* This would be a real chart in a production app */}
          <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {monthlySales.map((item, index) => (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  style={{ width: '100%', background: theme.palette.primary.main, borderRadius: '8px 8px 0 0' }}
                  className="rounded-t"
                  style={{ height: `${(item.value / maxSalesValue) * 100}%` }}
                ></div>
                <div style={{ fontSize: 12, marginTop: 8 }}>{item.month}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Customer Growth and Sales by Category */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: theme.palette.text.primary }}>Customer Growth</h3>
          <div style={{ height: 256 }}>
            {/* This would be a real chart in a production app */}
            <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              {customerGrowth.map((item, index) => (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div 
                    style={{ width: '100%', background: theme.palette.info.main, borderRadius: '8px 8px 0 0' }}
                    className="rounded-t"
                    style={{ height: `${(item.value / maxCustomerValue) * 100}%` }}
                  ></div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>{item.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: theme.palette.text.primary }}>Sales by Category</h3>
          <div style={{ height: 256 }}>
            {/* This would be a real chart in a production app */}
            <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              {salesByCategory.map((item, index) => (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div 
                    style={{ width: '100%', background: theme.palette.success.main, borderRadius: '8px 8px 0 0' }}
                    className="rounded-t"
                    style={{ height: `${(item.value / maxCategoryValue) * 100}%` }}
                  ></div>
                  <div style={{ fontSize: 12, marginTop: 8, textAlign: 'center' }}>{item.category}</div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{item.value}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Products and Customers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: theme.palette.text.primary }}>Top Selling Products</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
              <thead style={{ background: theme.palette.background.paper }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Product
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Sold
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody style={{ background: theme.palette.background.paper }}>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Paracetamol 500mg
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    3,245 units
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh 19,438.55
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Amoxicillin 250mg
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    2,568 units
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh 32,100.00
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Ibuprofen 400mg
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    2,105 units
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh 15,225.75
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Cetirizine 10mg
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    1,982 units
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh 17,342.50
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Omeprazole 20mg
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    1,756 units
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh.26,340.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: theme.palette.text.primary }}>Top Customers</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
              <thead style={{ background: theme.palette.background.paper }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Customer
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Orders
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Spent
                  </th>
                </tr>
              </thead>
              <tbody style={{ background: theme.palette.background.paper }}>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    MediCare Hospital
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    324
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh 124,500.00
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    City Clinic
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    285
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh 98,755.50
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    HealthPlus Pharmacy
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    256
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh 83,207.75
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Wellness Center
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    224
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh 74,502.25
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Community Health
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    187
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh 59,800.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;