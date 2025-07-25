import React from 'react';
import { Package, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { useTheme } from '@mui/material';

const Dashboard = () => {
  const theme = useTheme();
  // Mock data
  const stockStatus = {
    inStock: 65,
    lowStock: 25,
    outOfStock: 10
  };
  
  const expiringItems = [
    { id: '1', name: 'Amoxicillin 250mg (Box of 50)', expiryDate: '2025-04-15', stock: 30 },
    { id: '2', name: 'Omeprazole 20mg (Box of 50)', expiryDate: '2025-04-30', stock: 25 },
    { id: '3', name: 'Fluoxetine 20mg (Box of 30)', expiryDate: '2025-05-10', stock: 18 }
  ];
  
  const lowStockItems = [
    { id: '4', name: 'Salbutamol Inhaler (Box of 10)', stock: 15, minStock: 20 },
    { id: '5', name: 'Losartan 50mg (Box of 50)', stock: 22, minStock: 30 },
    { id: '6', name: 'Atorvastatin 10mg (Box of 30)', stock: 28, minStock: 40 }
  ];
  
  const totalItems = 3872;
  const totalValue = 124568.50;
  
  return (
    <div style={{ padding: '16px', background: theme.palette.background.default, minHeight: '100vh', width: '100%', maxWidth: '100vw', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 24 }}>Store Manager Dashboard</h2>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Card 1 */}
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Total Items</p>
              <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>3872</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.primary.light }}>
              <Package style={{ color: theme.palette.primary.main, width: 24, height: 24 }} />
            </div>
          </div>
          <p style={{ marginTop: 8, fontSize: 14, color: theme.palette.text.secondary }}>Across all categories</p>
        </div>
        
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Inventory Value</p>
              <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>Tsh {totalValue.toLocaleString()}</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.success.light }}>
              <BarChart3 style={{ color: theme.palette.success.main, width: 24, height: 24 }} />
            </div>
          </div>
          <p style={{ marginTop: 8, fontSize: 14, color: theme.palette.text.secondary }}>Total value of all items</p>
        </div>
        
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Low Stock Items</p>
              <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>{lowStockItems.length}</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.warning.light }}>
              <AlertTriangle style={{ color: theme.palette.warning.main, width: 24, height: 24 }} />
            </div>
          </div>
          <p style={{ marginTop: 8, fontSize: 14, color: theme.palette.text.secondary }}>Below minimum stock level</p>
        </div>
        
        <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Expiring Soon</p>
              <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: theme.palette.text.primary }}>{expiringItems.length}</p>
            </div>
            <div style={{ padding: 12, borderRadius: '50%', background: theme.palette.error.light }}>
              <Clock style={{ color: theme.palette.error.main, width: 24, height: 24 }} />
            </div>
          </div>
          <p style={{ marginTop: 8, fontSize: 14, color: theme.palette.text.secondary }}>Within next 90 days</p>
        </div>
      </div>
      
      {/* Stock Status Chart */}
      <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], marginBottom: 32, border: `1px solid ${theme.palette.divider}` }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 16 }}>Stock Status</h3>
        <div style={{ height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 128, height: 128, borderRadius: '50%', border: `8px solid ${theme.palette.success.main}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 700 }}>{stockStatus.inStock}%</span>
                </div>
                <span style={{ marginTop: 8, fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>In Stock</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 128, height: 128, borderRadius: '50%', border: `8px solid ${theme.palette.warning.main}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 700 }}>{stockStatus.lowStock}%</span>
                </div>
                <span style={{ marginTop: 8, fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Low Stock</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 128, height: 128, borderRadius: '50%', border: `8px solid ${theme.palette.error.main}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 700 }}>{stockStatus.outOfStock}%</span>
                </div>
                <span style={{ marginTop: 8, fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Out of Stock</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expiring Items */}
      <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], marginBottom: 32, border: `1px solid ${theme.palette.divider}` }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 16 }}>Items Expiring Soon</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
            <thead style={{ background: theme.palette.background.default }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Item Name
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Expiry Date
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Stock
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody style={{ background: theme.palette.background.paper }}>
              {expiringItems.map(item => {
                const expiryDate = new Date(item.expiryDate);
                const today = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                let statusColor = theme.palette.warning.light;
                if (daysUntilExpiry < 30) {
                  statusColor = theme.palette.error.light;
                }
                
                return (
                  <tr key={item.id}>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                      {item.stock}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, borderRadius: 12, background: statusColor, color: statusColor.includes('warning') ? theme.palette.warning.dark : statusColor.includes('error') ? theme.palette.error.dark : theme.palette.text.primary }}>
                        Expires in {daysUntilExpiry} days
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Low Stock Items */}
      <div style={{ background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], marginBottom: 32, border: `1px solid ${theme.palette.divider}` }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 16 }}>Low Stock Items</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
            <thead style={{ background: theme.palette.background.default }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Item Name
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Current Stock
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Minimum Stock
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody style={{ background: theme.palette.background.paper }}>
              {lowStockItems.map(item => {
                const stockDifference = item.minStock - item.stock;
                
                return (
                  <tr key={item.id}>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                      {item.stock}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                      {item.minStock}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, borderRadius: 12, background: theme.palette.warning.light, color: theme.palette.warning.dark }}>
                        {stockDifference} below minimum
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;