import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  Package,
  Building,
  User,
  Phone
} from 'lucide-react';
import { useTheme } from '@mui/material';
import { API_BASE_URL } from '../../../constants';
import DataTable from '../../components/common/DataTable/DataTable';
import { TableColumn } from '../../../types';

interface StockTransfer {
  id: number;
  product_id: string;
  batch_no: string;
  adjustment_date: string;
  adjustment_type: 'transfer' | 'donation';
  quantity_adjusted: number;
  reason: string;
  created_by: string;
  created_at: string;
  destination: string;
  recipient_name: string;
  recipient_contact: string;
  medicine?: {
    product_name: string;
    product_category: string;
    product_price: string;
  };
}

interface Medicine {
  id: number;
  product_id: string;
  product_name: string;
  current_quantity: number;
  batch_no: string;
  product_price: string;
  product_category: string;
  expire_date: string;
}

const StockTransfer: React.FC = () => {
  const theme = useTheme();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [transferData, setTransferData] = useState({
    product_id: '',
    batch_no: '',
    adjustment_type: 'transfer' as const,
    quantity_adjusted: 0,
    reason: '',
    destination: '',
    recipient_name: '',
    recipient_contact: ''
  });

  useEffect(() => {
    fetchTransfers();
    fetchMedicines();
  }, []);

  useEffect(() => {
    filterTransfers();
  }, [transfers, searchTerm, typeFilter]);

  const filterTransfers = () => {
    let filtered = transfers;

    if (searchTerm) {
      filtered = filtered.filter(transfer =>
        transfer.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.batch_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.medicine?.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(transfer => transfer.adjustment_type === typeFilter);
    }

    setFilteredTransfers(filtered);
  };

  const fetchTransfers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/api/stock-adjustments/transfers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transfers: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setTransfers(result.data);
      } else {
        setTransfers([]);
      }
    } catch (err: any) {
      console.error('Fetch transfers error:', err);
      setError(err.message);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/api/medicines-cache`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch medicines: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setMedicines(result.data);
      } else {
        setMedicines([]);
      }
    } catch (err: any) {
      console.error('Fetch medicines error:', err);
      setError(err.message);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async () => {
    if (!transferData.product_id || !transferData.quantity_adjusted || !transferData.reason || 
        !transferData.destination || !transferData.recipient_name) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const payload = {
        product_id: transferData.product_id,
        batch_no: transferData.batch_no,
        adjustment_date: new Date().toISOString().split('T')[0],
        adjustment_type: transferData.adjustment_type,
        quantity_adjusted: transferData.quantity_adjusted,
        reason: transferData.reason,
        created_by: String(user.id || '1'),
        destination: transferData.destination,
        recipient_name: transferData.recipient_name,
        recipient_contact: transferData.recipient_contact
      };

      const response = await fetch(`${API_BASE_URL}/api/stock-adjustments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create transfer: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        await fetchTransfers();
        await fetchMedicines();
        setIsAddModalOpen(false);
        resetForm();
        setSuccess(`${transferData.adjustment_type === 'transfer' ? 'Transfer' : 'Donation'} created successfully`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.message || 'Failed to create transfer');
      }
    } catch (err: any) {
      console.error('Create transfer error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTransferData({
      product_id: '',
      batch_no: '',
      adjustment_type: 'transfer',
      quantity_adjusted: 0,
      reason: '',
      destination: '',
      recipient_name: '',
      recipient_contact: ''
    });
    setSelectedMedicine(null);
  };

  const getTransferIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return <ArrowRight style={{ color: theme.palette.info.main, width: 16, height: 16 }} />;
      case 'donation':
        return <Package style={{ color: theme.palette.warning.main, width: 16, height: 16 }} />;
      default:
        return <Package style={{ color: theme.palette.text.secondary, width: 16, height: 16 }} />;
    }
  };

  const getTransferColor = (type: string) => {
    switch (type) {
      case 'transfer':
        return theme.palette.info.main;
      case 'donation':
        return theme.palette.warning.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  // DataTable columns
  const columns: TableColumn[] = [
    {
      key: 'adjustment_type',
      header: 'Type',
      sortable: true,
      width: '12%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8 
          }}>
            {getTransferIcon(row.adjustment_type)}
            <span style={{ 
              color: getTransferColor(row.adjustment_type),
              fontWeight: 500,
              textTransform: 'capitalize'
            }}>
              {row.adjustment_type}
            </span>
          </div>
        );
      }
    },
    {
      key: 'product_name',
      header: 'Product',
      sortable: true,
      width: '18%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <div>
            <div style={{ fontWeight: 500, color: theme.palette.text.primary }}>
              {row.medicine?.product_name || row.product_id}
            </div>
            <div style={{ fontSize: 12, color: theme.palette.text.secondary }}>
              {row.product_id}
            </div>
          </div>
        );
      }
    },
    {
      key: 'batch_no',
      header: 'Batch',
      sortable: true,
      width: '10%'
    },
    {
      key: 'quantity_adjusted',
      header: 'Quantity',
      sortable: true,
      width: '10%',
      render: (row: any) => {
        if (!row) return '-';
        return (
          <span style={{ 
            color: theme.palette.error.main,
            fontWeight: 600
          }}>
            -{row.quantity_adjusted}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      width: '12%',
      render: (row: any) => {
        if (!row) return '-';
        return row.created_at ? new Date(row.created_at).toLocaleDateString() : '-';
      }
    }
  ];

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
            Stock Transfers & Donations
          </h2>
          <p style={{ 
            fontSize: 14, 
            color: theme.palette.text.secondary,
            margin: 0
          }}>
            Manage stock transfers to other locations and donations to organizations
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={fetchTransfers}
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
            onClick={() => setIsAddModalOpen(true)}
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
            <Plus style={{ width: 16, height: 16 }} />
            New Transfer
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div style={{
          background: theme.palette.success.light,
          border: `1px solid ${theme.palette.success.main}`,
          color: theme.palette.success.dark,
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle style={{ width: 16, height: 16 }} />
          {success}
        </div>
      )}

      {error && (
        <div style={{
          background: theme.palette.error.light,
          border: `1px solid ${theme.palette.error.main}`,
          color: theme.palette.error.dark,
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertCircle style={{ width: 16, height: 16 }} />
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ 
        background: theme.palette.background.paper, 
        padding: 24, 
        borderRadius: 16, 
        boxShadow: theme.shadows[1], 
        marginBottom: 24,
        border: `1px solid ${theme.palette.divider}`
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200 }}>
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
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  background: theme.palette.background.default,
                  color: theme.palette.text.primary,
                  fontSize: 14
                }}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div style={{ minWidth: 150 }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                background: theme.palette.background.default,
                color: theme.palette.text.primary,
                fontSize: 14
              }}
            >
              <option value="">All Types</option>
              <option value="transfer">Transfer</option>
              <option value="donation">Donation</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div style={{ 
          marginTop: 16, 
          padding: '12px 0', 
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ 
            fontSize: 14, 
            color: theme.palette.text.secondary,
            margin: 0
          }}>
            Showing {filteredTransfers.length} of {transfers.length} transfers
          </p>
        </div>
      </div>

      {/* Transfers Table */}
      <div style={{ 
        background: theme.palette.background.paper, 
        borderRadius: 16, 
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden'
      }}>
        <DataTable
          columns={columns}
          data={filteredTransfers}
          loading={loading}
          emptyMessage="No transfers found. Create your first transfer to get started."
        />
      </div>

      {/* Add Transfer Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: theme.palette.background.paper,
            borderRadius: 16,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 24 
            }}>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 600, 
                color: theme.palette.text.primary,
                margin: 0
              }}>
                New {transferData.adjustment_type === 'transfer' ? 'Transfer' : 'Donation'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.palette.text.secondary
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Transfer Type */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Type *
                </label>
                <select
                  value={transferData.adjustment_type}
                  onChange={(e) => setTransferData(prev => ({ 
                    ...prev, 
                    adjustment_type: e.target.value as 'transfer' | 'donation'
                  }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                >
                  <option value="transfer">Transfer to Another Location</option>
                  <option value="donation">Donation to Organization</option>
                </select>
              </div>

              {/* Product Selection */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Product *
                </label>
                <select
                  value={transferData.product_id}
                  onChange={(e) => {
                    setTransferData(prev => ({ ...prev, product_id: e.target.value }));
                    const medicine = medicines.find(m => m.product_id === e.target.value);
                    setSelectedMedicine(medicine || null);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                >
                  <option value="">Select a product</option>
                  {medicines.map(medicine => (
                    <option key={medicine.id} value={medicine.product_id}>
                      {medicine.product_name} (Stock: {medicine.current_quantity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Number */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Batch Number *
                </label>
                <input
                  type="text"
                  value={transferData.batch_no}
                  onChange={(e) => setTransferData(prev => ({ ...prev, batch_no: e.target.value }))}
                  placeholder="Enter batch number"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                />
              </div>

              {/* Quantity */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedMedicine?.current_quantity || 999}
                  value={transferData.quantity_adjusted}
                  onChange={(e) => setTransferData(prev => ({ 
                    ...prev, 
                    quantity_adjusted: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="Enter quantity"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                />
                {selectedMedicine && (
                  <p style={{ 
                    fontSize: 12, 
                    color: theme.palette.text.secondary,
                    margin: '4px 0 0 0'
                  }}>
                    Available stock: {selectedMedicine.current_quantity}
                  </p>
                )}
              </div>

              {/* Destination/Organization */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  {transferData.adjustment_type === 'transfer' ? 'Destination' : 'Organization'} *
                </label>
                <input
                  type="text"
                  value={transferData.destination}
                  onChange={(e) => setTransferData(prev => ({ ...prev, destination: e.target.value }))}
                  placeholder={transferData.adjustment_type === 'transfer' ? 'Enter destination location' : 'Enter organization name'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                />
              </div>

              {/* Contact Person */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={transferData.recipient_name}
                  onChange={(e) => setTransferData(prev => ({ ...prev, recipient_name: e.target.value }))}
                  placeholder="Enter contact person name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                />
              </div>

              {/* Contact Number */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Contact Number
                </label>
                <input
                  type="text"
                  value={transferData.recipient_contact}
                  onChange={(e) => setTransferData(prev => ({ ...prev, recipient_contact: e.target.value }))}
                  placeholder="Enter contact number"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                />
              </div>

              {/* Reason */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Reason *
                </label>
                <textarea
                  value={transferData.reason}
                  onChange={(e) => setTransferData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={`Enter reason for ${transferData.adjustment_type}`}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: 14,
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: 12, 
                justifyContent: 'flex-end',
                marginTop: 24,
                paddingTop: 16,
                borderTop: `1px solid ${theme.palette.divider}`
              }}>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  style={{
                    padding: '12px 24px',
                    background: theme.palette.grey[300],
                    color: theme.palette.text.primary,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTransfer}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    border: 'none',
                    borderRadius: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Creating...' : `Create ${transferData.adjustment_type === 'transfer' ? 'Transfer' : 'Donation'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransfer; 