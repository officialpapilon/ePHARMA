import React from 'react';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { useTheme } from '@mui/material';

const Dashboard = () => {
  const theme = useTheme();
  return (
    <div style={{ padding: 24, background: theme.palette.background.default, minHeight: '100vh' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 24 }}>Wholesale Dashboard</h2>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Card 1 */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Total Sales</p>
              <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>$48,295</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.success.light }}>
              <DollarSign style={{ color: theme.palette.success.main, width: 24, height: 24 }} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
            <TrendingUp style={{ color: theme.palette.success.main, marginRight: 6, width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.palette.success.main }}>+12.5%</span>
            <span style={{ fontSize: 14, color: theme.palette.text.secondary, marginLeft: 8 }}>from last month</span>
          </div>
        </div>
        
        {/* Card 2 */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Customers</p>
              <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>254</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.info.light }}>
              <Users style={{ color: theme.palette.info.main, width: 24, height: 24 }} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
            <TrendingUp style={{ color: theme.palette.success.main, marginRight: 6, width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.palette.success.main }}>+8.2%</span>
            <span style={{ fontSize: 14, color: theme.palette.text.secondary, marginLeft: 8 }}>from last month</span>
          </div>
        </div>
        
        {/* Card 3 */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Items Sold</p>
              <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>1,876</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.warning.light }}>
              <Package style={{ color: theme.palette.warning.main, width: 24, height: 24 }} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
            <TrendingUp style={{ color: theme.palette.success.main, marginRight: 6, width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.palette.success.main }}>+15.3%</span>
            <span style={{ fontSize: 14, color: theme.palette.text.secondary, marginLeft: 8 }}>from last month</span>
          </div>
        </div>
        
        {/* Card 4 */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Pending Payments</p>
              <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>$5,240</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.error.light }}>
              <ShoppingCart style={{ color: theme.palette.error.main, width: 24, height: 24 }} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
            <TrendingUp style={{ color: theme.palette.error.main, marginRight: 6, width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.palette.error.main }}>+3.7%</span>
            <span style={{ fontSize: 14, color: theme.palette.text.secondary, marginLeft: 8 }}>from last month</span>
          </div>
        </div>
      </div>
      
      {/* Sales Chart */}
      <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], marginBottom: 32, border: `1px solid ${theme.palette.divider}` }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 16 }}>Monthly Sales</h3>
        <div style={{ height: 256 }}>
          {/* This would be a real chart in a production app */}
          <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {[35, 45, 30, 60, 75, 85, 70, 65, 80, 90, 95, 100].map((height, index) => (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  style={{ width: '100%', background: theme.palette.primary.main, borderRadius: '8px 8px 0 0' }}
                  className="rounded-t"
                  style={{ height: `${height}%` }}
                ></div>
                <div style={{ fontSize: 12, color: theme.palette.text.secondary, marginTop: 8 }}>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Top Products and Customers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 16 }}>Top Selling Products</h3>
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
                    324 units
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh.1,940.76
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Amoxicillin 250mg
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    256 units
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh.3,200.00
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Ibuprofen 400mg
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    210 units
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh.1,522.50
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Cetirizine 10mg
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    198 units
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh.1,732.50
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Omeprazole 20mg
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    175 units
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh.2,625.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 16 }}>Top Customers</h3>
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
                    32
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh.12,450.00
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    City Clinic
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    28
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh.9,875.50
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    HealthPlus Pharmacy
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    25
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh.8,320.75
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Wellness Center
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    22
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh.7,450.25
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                    Community Health
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    18
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                    Tsh.5,980.00
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