import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Package,
  FilterList
} from 'lucide-react';
import { useTheme } from '@mui/material';
import { API_BASE_URL } from '../../../constants';
import DataTable from '../../components/common/DataTable/DataTable';
import ProfessionalModal from '../../components/common/ProfessionalModal/ProfessionalModal';
import ProductSelector from '../../components/common/ProductSelector/ProductSelector';
import { TableColumn } from '../../../types';

interface StockAdjustment {
  id: number;
  product_id: string;
  batch_no: string;
  adjustment_date: string;
  adjustment_type: 'increase' | 'decrease' | 'transfer' | 'donation';
  quantity_adjusted: number;
  reason: string;
  created_by: string;
  created_at: string;
  destination?: string;
  recipient_name?: string;
  recipient_contact?: string;
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

const StockAdjustments: React.FC = () => {
  const theme = useTheme();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredAdjustments, setFilteredAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    product_id: '',
    batch_no: '',
    adjustment_type: 'increase' as const,
    quantity_adjusted: 0,
    reason: '',
    destination: '',
    recipient_name: '',
    recipient_contact: ''
  });

  useEffect(() => {
    fetchAdjustments();
    fetchMedicines();
  }, []);

  useEffect(() => {
    filterAdjustments();
  }, [adjustments, searchTerm, typeFilter]);

  const filterAdjustments = () => {
    let filtered = adjustments;

    if (searchTerm) {
      filtered = filtered.filter(adj =>
        adj.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adj.batch_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adj.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adj.medicine?.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(adj => adj.adjustment_type === typeFilter);
    }

    setFilteredAdjustments(filtered);
  };

  const fetchAdjustments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/api/stock-adjustments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch adjustments: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setAdjustments(result.data);
      } else {
        setAdjustments([]);
      }
    } catch (err: any) {
      console.error('Fetch adjustments error:', err);
      setError(err.message);
      setAdjustments([]);
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

  const handleCreateAdjustment = async () => {
    if (!adjustmentData.product_id || !adjustmentData.quantity_adjusted || !adjustmentData.reason) {
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
        product_id: adjustmentData.product_id,
        batch_no: adjustmentData.batch_no,
        adjustment_date: new Date().toISOString().split('T')[0],
        adjustment_type: adjustmentData.adjustment_type,
        quantity_adjusted: adjustmentData.quantity_adjusted,
        reason: adjustmentData.reason,
        created_by: String(user.id || '1'),
        destination: adjustmentData.destination,
        recipient_name: adjustmentData.recipient_name,
        recipient_contact: adjustmentData.recipient_contact
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
        throw new Error(`Failed to create adjustment: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        await fetchAdjustments();
        await fetchMedicines();
        setIsAddModalOpen(false);
        resetForm();
        setSuccess('Stock adjustment created successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.message || 'Failed to create adjustment');
      }
    } catch (err: any) {
      console.error('Create adjustment error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAdjustmentData({
      product_id: '',
      batch_no: '',
      adjustment_type: 'increase',
      quantity_adjusted: 0,
      reason: '',
      destination: '',
      recipient_name: '',
      recipient_contact: ''
    });
    setSelectedMedicine(null);
  };

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case 'increase':
        return <TrendingUp style={{ color: theme.palette.success.main, width: 16, height: 16 }} />;
      case 'decrease':
        return <TrendingDown style={{ color: theme.palette.error.main, width: 16, height: 16 }} />;
      case 'transfer':
        return <ArrowRight style={{ color: theme.palette.info.main, width: 16, height: 16 }} />;
      case 'donation':
        return <Package style={{ color: theme.palette.warning.main, width: 16, height: 16 }} />;
      default:
        return <Package style={{ color: theme.palette.text.secondary, width: 16, height: 16 }} />;
    }
  };

  const getAdjustmentColor = (type: string) => {
    switch (type) {
      case 'increase':
        return theme.palette.success.main;
      case 'decrease':
        return theme.palette.error.main;
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
            {getAdjustmentIcon(row.adjustment_type)}
            <span style={{ 
              color: getAdjustmentColor(row.adjustment_type),
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
        const color = row.adjustment_type === 'increase' ? theme.palette.success.main : theme.palette.error.main;
        const prefix = row.adjustment_type === 'increase' ? '+' : '-';
        return (
          <span style={{ 
            color: color,
            fontWeight: 600
          }}>
            {prefix}{row.quantity_adjusted}
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
            Stock Adjustments
          </h2>
          <p style={{ 
            fontSize: 14, 
            color: theme.palette.text.secondary,
            margin: 0
          }}>
            Manage stock adjustments, transfers, and donations
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={fetchAdjustments}
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
            New Adjustment
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
                placeholder="Search adjustments..."
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
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
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
            Showing {filteredAdjustments.length} of {adjustments.length} adjustments
          </p>
        </div>
      </div>

      {/* Adjustments Table */}
      <div style={{ 
        background: theme.palette.background.paper, 
        borderRadius: 16, 
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden'
      }}>
        <DataTable
          columns={columns}
          data={filteredAdjustments}
          loading={loading}
          emptyMessage="No adjustments found. Create your first adjustment to get started."
        />
      </div>

      {/* Add Adjustment Modal */}
      {isAddModalOpen && (
        <ProfessionalModal
          open={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            resetForm();
          }}
          title="New Stock Adjustment"
          onSubmit={handleCreateAdjustment}
          loading={loading}
          submitText="Create Adjustment"
        >
          <ProductSelector
            products={medicines}
            selectedProduct={selectedMedicine}
            onSelect={(product) => {
              setAdjustmentData(prev => ({ ...prev, product_id: product.product_id }));
              setSelectedMedicine(product);
            }}
            placeholder="Select a product"
          />
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
              value={adjustmentData.batch_no}
              onChange={(e) => setAdjustmentData(prev => ({ ...prev, batch_no: e.target.value }))}
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

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontWeight: 500, 
              color: theme.palette.text.primary 
            }}>
              Adjustment Type *
            </label>
            <select
              value={adjustmentData.adjustment_type}
              onChange={(e) => setAdjustmentData(prev => ({ 
                ...prev, 
                adjustment_type: e.target.value as any 
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
              <option value="increase">Increase Stock</option>
              <option value="decrease">Decrease Stock</option>
              <option value="transfer">Transfer to Another Location</option>
              <option value="donation">Donation</option>
            </select>
          </div>

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
              value={adjustmentData.quantity_adjusted}
              onChange={(e) => setAdjustmentData(prev => ({ 
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
          </div>

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
              value={adjustmentData.reason}
              onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for adjustment"
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

          {/* Conditional fields for transfer/donation */}
          {(adjustmentData.adjustment_type === 'transfer' || adjustmentData.adjustment_type === 'donation') && (
            <>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  {adjustmentData.adjustment_type === 'transfer' ? 'Destination' : 'Recipient Organization'}
                </label>
                <input
                  type="text"
                  value={adjustmentData.destination}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, destination: e.target.value }))}
                  placeholder={adjustmentData.adjustment_type === 'transfer' ? 'Enter destination' : 'Enter organization name'}
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

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 500, 
                  color: theme.palette.text.primary 
                }}>
                  Contact Person
                </label>
                <input
                  type="text"
                  value={adjustmentData.recipient_name}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, recipient_name: e.target.value }))}
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
                  value={adjustmentData.recipient_contact}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, recipient_contact: e.target.value }))}
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
            </>
          )}
        </ProfessionalModal>
      )}
    </div>
  );
};

export default StockAdjustments;