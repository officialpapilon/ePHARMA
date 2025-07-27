import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Building,
  CreditCard,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Filter,
  X
} from 'lucide-react';
import { useTheme } from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

interface Customer {
  id: number;
  customer_code: string;
  business_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  customer_type: string;
  credit_limit: number;
  current_balance: number;
  payment_terms: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const Customers: React.FC = () => {
  const theme = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    business_name: '',
    contact_person: '',
    phone_number: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: 'Tanzania',
    customer_type: 'pharmacy',
    credit_limit_type: 'limited',
    credit_limit: 0,
    payment_terms: 'immediate',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, selectedStatus, selectedType]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8000/api/wholesale/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setCustomers(result.data);
      } else {
        setError(result.message || 'Failed to fetch customers');
      }
    } catch (err) {
      console.error('Customers fetch error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone_number.includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(customer => customer.status === selectedStatus);
    }

    if (selectedType) {
      filtered = filtered.filter(customer => customer.customer_type === selectedType);
    }

    setFilteredCustomers(filtered);
  };

  const handleCreateCustomer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8000/api/wholesale/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create customer');
      }

      const result = await response.json();
      if (result.success) {
        setSuccess('Customer created successfully!');
        setShowModal(false);
        resetForm();
        fetchCustomers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'Failed to create customer');
      }
    } catch (err) {
      console.error('Create customer error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8000/api/wholesale/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update customer');
      }

      const result = await response.json();
      if (result.success) {
        setSuccess('Customer updated successfully!');
        setShowModal(false);
        setEditingCustomer(null);
        resetForm();
        fetchCustomers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'Failed to update customer');
      }
    } catch (err) {
      console.error('Update customer error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8000/api/wholesale/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete customer');
      }

      const result = await response.json();
      if (result.success) {
        setSuccess('Customer deleted successfully!');
        fetchCustomers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'Failed to delete customer');
      }
    } catch (err) {
      console.error('Delete customer error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      business_name: customer.business_name,
      contact_person: customer.contact_person,
      phone_number: customer.phone_number,
      email: customer.email || '',
      address: customer.address,
      city: customer.city,
      state: customer.state || '',
      country: customer.country,
      customer_type: customer.customer_type,
      credit_limit_type: customer.credit_limit > 0 ? 'limited' : 'unlimited',
      credit_limit: customer.credit_limit,
      payment_terms: customer.payment_terms,
      notes: ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      business_name: '',
      contact_person: '',
      phone_number: '',
      email: '',
      address: '',
      city: '',
      state: '',
      country: 'Tanzania',
      customer_type: 'pharmacy',
      credit_limit_type: 'limited',
      credit_limit: 0,
      payment_terms: 'immediate',
      notes: ''
    });
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    resetForm();
    setShowModal(true);
  };

  const formatCurrency = (amount: number) => {
    return `Tsh ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.palette.success.main;
      case 'inactive':
        return theme.palette.grey[500];
      case 'suspended':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading && customers.length === 0) {
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
          message="Loading customers..." 
          size={48}
        />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '16px', 
      background: theme.palette.background.default, 
      minHeight: '100vh' 
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24 
      }}>
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          color: theme.palette.text.primary,
          margin: 0
        }}>
          Wholesale Customers
        </h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={fetchCustomers}
            disabled={loading}
            style={{
              padding: '10px 16px',
              background: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: loading ? 0.7 : 1,
              fontWeight: 500
            }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            style={{
              padding: '10px 16px',
              background: theme.palette.success.main,
              color: theme.palette.success.contrastText,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 500
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            New Customer
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

      {success && (
        <div style={{
          padding: 16,
          background: theme.palette.success.light,
          color: theme.palette.success.main,
          borderRadius: 8,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle style={{ width: 20, height: 20 }} />
          {success}
        </div>
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
              Search Customers
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
                placeholder="Search by name, contact, or email..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 500, 
              color: theme.palette.text.secondary,
              marginBottom: 8
            }}>
              Customer Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
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
              <option value="">All Types</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="hospital">Hospital</option>
              <option value="clinic">Clinic</option>
              <option value="distributor">Distributor</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('');
                setSelectedType('');
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

      {/* Customers Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: 24 
      }}>
        {filteredCustomers.map(customer => (
          <div
            key={customer.id}
            style={{
              background: theme.palette.background.paper,
              padding: 20,
              borderRadius: 12,
              boxShadow: theme.shadows[1],
              border: `1px solid ${theme.palette.divider}`,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = theme.shadows[4];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = theme.shadows[1];
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ 
                  fontSize: 18, 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  margin: '0 0 4px 0'
                }}>
                  {customer.business_name}
                </h3>
                <p style={{ 
                  fontSize: 14, 
                  color: theme.palette.text.secondary,
                  margin: '0 0 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Building style={{ width: 14, height: 14 }} />
                  {customer.customer_type.charAt(0).toUpperCase() + customer.customer_type.slice(1)}
                </p>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 500,
                  background: getStatusColor(customer.status) + '20',
                  color: getStatusColor(customer.status)
                }}>
                  {getStatusText(customer.status)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openEditModal(customer)}
                  style={{
                    padding: '6px',
                    background: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  <Edit style={{ width: 14, height: 14 }} />
                </button>
                <button
                  onClick={() => handleDeleteCustomer(customer.id)}
                  style={{
                    padding: '6px',
                    background: theme.palette.error.main,
                    color: theme.palette.error.contrastText,
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User style={{ width: 14, height: 14, color: theme.palette.text.secondary }} />
                <span style={{ fontSize: 14, color: theme.palette.text.primary }}>
                  {customer.contact_person}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone style={{ width: 14, height: 14, color: theme.palette.text.secondary }} />
                <span style={{ fontSize: 14, color: theme.palette.text.primary }}>
                  {customer.phone_number}
                </span>
              </div>

              {customer.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail style={{ width: 14, height: 14, color: theme.palette.text.secondary }} />
                  <span style={{ fontSize: 14, color: theme.palette.text.primary }}>
                    {customer.email}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin style={{ width: 14, height: 14, color: theme.palette.text.secondary }} />
                <span style={{ fontSize: 14, color: theme.palette.text.primary }}>
                  {customer.city}, {customer.country}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard style={{ width: 14, height: 14, color: theme.palette.text.secondary }} />
                <span style={{ fontSize: 14, color: theme.palette.text.primary }}>
                  Credit: {formatCurrency(customer.credit_limit)} • Balance: {formatCurrency(customer.current_balance)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: 48,
          color: theme.palette.text.secondary,
          fontStyle: 'italic'
        }}>
          No customers found. Try adjusting your filters or create a new customer.
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
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
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: theme.palette.background.paper,
            borderRadius: 12,
            padding: 24,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ 
              fontSize: 20, 
              fontWeight: 600, 
              color: theme.palette.text.primary,
              marginBottom: 24
            }}>
              {editingCustomer ? 'Edit Customer' : 'New Customer'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Business Name *</label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontSize: 14,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Contact Person *</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontSize: 14,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Phone Number *</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontSize: 14,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontSize: 14,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontSize: 14,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontSize: 14,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontSize: 14,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Customer Type *</label>
                <select
                  value={formData.customer_type}
                  onChange={(e) => setFormData({...formData, customer_type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontSize: 14,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary
                  }}
                >
                  <option value="pharmacy">Pharmacy</option>
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="distributor">Distributor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Payment Terms *</label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontSize: 14,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary
                  }}
                >
                  <option value="immediate">Immediate</option>
                  <option value="7_days">7 Days</option>
                  <option value="15_days">15 Days</option>
                  <option value="30_days">30 Days</option>
                  <option value="60_days">60 Days</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Credit Limit Type</label>
                <select
                  value={formData.credit_limit_type}
                  onChange={(e) => setFormData({...formData, credit_limit_type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontSize: 14,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary
                  }}
                >
                  <option value="limited">Limited</option>
                  <option value="unlimited">Unlimited</option>
                </select>
              </div>

              {formData.credit_limit_type === 'limited' && (
                <div>
                  <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Credit Limit</label>
                  <input
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({...formData, credit_limit: parseFloat(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      fontSize: 14,
                      background: theme.palette.background.default,
                      color: theme.palette.text.primary
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  background: theme.palette.grey[300],
                  color: theme.palette.grey[700],
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: loading ? theme.palette.grey[300] : theme.palette.primary.main,
                  color: loading ? theme.palette.grey[600] : theme.palette.primary.contrastText,
                  border: 'none',
                  borderRadius: 8,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                {loading ? 'Saving...' : (editingCustomer ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
