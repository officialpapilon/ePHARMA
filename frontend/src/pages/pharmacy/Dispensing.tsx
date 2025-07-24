import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material';
import { Search, Plus, Trash2, Send, User, Pill, ShoppingCart, ChevronRight, X } from 'lucide-react';
import { API_BASE_URL } from '../../../constants';
import Spinner from '../../components/UI/Spinner/index.tsx';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  age?: number;
  gender?: string;
}

interface Medicine {
  id: string;
  product_id: string;
  product_name: string;
  current_quantity: number;
  product_price: number;
  product_category: string;
  expire_date:number;
  common?: boolean;
}

interface CartItem {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
}

const Dispensing: React.FC = () => {
  const theme = useTheme();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    age: undefined as number | undefined,
    gender: '',
  });
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomerAlert, setShowCustomerAlert] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchCustomers();
      fetchMedicines();
    }
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to fetch customers: ${response.status} - ${text}`);
      if (!text.trim()) throw new Error('Empty response received');
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Expected an array of customers');
      setCustomers(data.map((c: any) => ({ ...c, id: String(c.id) })));
    } catch (err: any) {
      setError(err.message);
      setCustomers([]);
      console.error('Error in fetchCustomers:', err);
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
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to fetch medicines: ${response.status} - ${text}`);
      if (!text.trim()) throw new Error('Empty response received');
      const data = JSON.parse(text);
      if (!Array.isArray(data.data)) throw new Error('Expected an array of medicines');
      setMedicines(
        data.data.map((m: any) => ({
          id: String(m.id),
          product_id: String(m.product_id),
          product_name: m.product_name || 'Unknown',
          product_price: parseFloat(m.product_price) || 0,
          current_quantity: parseInt(m.current_quantity, 10) || 0,
          product_category: m.product_category || 'Unknown',
          expire_date:(m.expire_date) || '',
          common: m.common || false,
        }))
      );
    } catch (err: any) {
      setError(err.message);
      setMedicines([]);
      console.error('Error in fetchMedicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const addNewPatient = async () => {
    if (!newPatient.first_name.trim() || !newPatient.last_name.trim()) {
      alert('First name and last name are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
        body: JSON.stringify(newPatient),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to add patient: ${response.status} - ${text}`);
      const newCustomer = JSON.parse(text);
      setCustomers([...customers, { ...newCustomer, id: String(newCustomer.id) }]);
      setSelectedCustomer({ ...newCustomer, id: String(newCustomer.id) });
      setShowAddPatientModal(false);
      setNewPatient({ first_name: '', last_name: '', phone: '', email: '', address: '', age: undefined, gender: '' });
    } catch (err: any) {
      setError(err.message);
      console.error('Error in addNewPatient:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (medicine: Medicine) => {
    if (medicine.current_quantity <= 0) {
      alert('This medicine is out of stock');
      return;
    }

    const existingItemIndex = cart.findIndex((item) => item.medicineId === medicine.product_id);
    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          id: Date.now().toString(),
          medicineId: medicine.product_id,
          medicineName: medicine.product_name,
          quantity: 1,
          price: medicine.product_price,
        },
      ]);
    }
  };

  const removeFromCart = (id: string) => {
    if (window.confirm('Remove this item from the cart?')) {
      setCart(cart.filter((item) => item.id !== id));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.quantity * item.price, 0).toFixed(2);
  };

  const handleSendToCashier = async () => {
    if (!selectedCustomer) {
      setShowCustomerAlert(true);
      setTimeout(() => setShowCustomerAlert(false), 3000);
      return;
    }
    if (cart.length === 0) {
      alert('Please add items to the cart first');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const cartData = {
        patient_ID: String(selectedCustomer.id),
        product_purchased: cart.map((item) => ({
          product_id: String(item.medicineId),
          product_quantity: item.quantity,
          product_price: item.price,
        })),
        total_price: parseFloat(calculateTotal()),
        status: 'sent_to_cashier',
      };
      const response = await fetch(`${API_BASE_URL}/api/carts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
        body: JSON.stringify(cartData),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to send to cashier: ${response.status} - ${text}`);
      const result = JSON.parse(text);
      if (!result.data?.transaction_ID && !result.data?.transaction_id)
        throw new Error('No transaction_ID returned from server');
      setSuccess('Cart sent to cashier!');
      setCart([]);
      fetchMedicines();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
      console.error('Error in handleSendToCashier:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    `${c.first_name} ${c.last_name} ${c.phone || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredMedicines = medicines.filter((m) =>
    m.product_name.toLowerCase().includes(medicineSearchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: theme.palette.background.default }}>
      {/* Header */}
      <header style={{ background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`, boxShadow: theme.shadows[2] }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pill style={{ color: theme.palette.primary.contrastText, width: 24, height: 24 }} />
            <span style={{ color: theme.palette.primary.contrastText, fontWeight: 600, fontSize: 20 }}>PharmaDispense</span>
            <ChevronRight style={{ color: theme.palette.primary.light, width: 20, height: 20 }} />
            <span style={{ color: theme.palette.primary.contrastText, fontWeight: 500 }}>Dispensing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', marginRight: 16 }}>
              <ShoppingCart style={{ color: theme.palette.primary.contrastText, width: 24, height: 24 }} />
              {cart.length > 0 && (
                <span style={{ position: 'absolute', top: -8, right: -8, background: theme.palette.background.paper, color: theme.palette.success.main, borderRadius: '50%', height: 20, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Customer Alert */}
      {showCustomerAlert && (
        <div className="fixed top-20 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50 animate-fade-in">
          <div className="flex items-center">
            <X className="h-5 w-5 mr-2" onClick={() => setShowCustomerAlert(false)} />
            <span>Please select a customer first</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-auto max-w-7xl px-4">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex justify-between items-center animate-fade-in">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mx-auto max-w-7xl px-4">
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-6 flex justify-between items-center animate-fade-in">
            <p>{success}</p>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {loading && <Spinner />}

      {/* Main Content */}
      <main className="mx-auto px-4 py-6 max-w-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Patient Panel - Left Side (25%) */}
          <div style={{ background: theme.palette.background.paper, borderRadius: 20, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }} className="lg:col-span-3 overflow-hidden">
            <div style={{ background: theme.palette.primary.main, padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <h2 style={{ color: theme.palette.primary.contrastText, fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center' }}>
                <User style={{ marginRight: 8, width: 20, height: 20 }} />
                Patient Selection
              </h2>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ position: 'relative', flex: 1, marginRight: 8 }}>
                  <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: theme.palette.text.secondary }} />
                  <Input
                    name="searchTerm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search patients..."
                    className="pl-10"
                  />
                </div>
                <button
                  onClick={() => setShowAddPatientModal(true)}
                  style={{ padding: 8, background: theme.palette.secondary.light, color: theme.palette.secondary.dark, borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                  title="Add Patient"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div style={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 12, overflow: 'hidden' }}>
                {filteredCustomers.length > 0 ? (
                  <ul style={{ maxHeight: 500, overflowY: 'auto' }}>
                    {filteredCustomers.map((customer) => (
                      <li key={customer.id}>
                        <button
                          style={{
                            width: '100%',
                            padding: '12px 18px',
                            textAlign: 'left',
                            background: selectedCustomer?.id === customer.id ? theme.palette.action.selected : 'transparent',
                            transition: 'background 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <p style={{ fontWeight: 600, color: theme.palette.text.primary }}>{customer.first_name} {customer.last_name}</p>
                              <p style={{ fontSize: 13, color: theme.palette.text.secondary }}>{customer.phone || 'No phone'}</p>
                            </div>
                            {selectedCustomer?.id === customer.id && (
                              <div style={{ height: 12, width: 12, borderRadius: '50%', background: theme.palette.primary.main }}></div>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ padding: 16, textAlign: 'center', color: theme.palette.text.secondary }}>No patients found</div>
                )}
              </div>
            </div>
          </div>

          {/* Main Workspace - Right Side (75%) */}
          <div className="lg:col-span-9 space-y-6">
            {/* Patient Info Card */}
            <div style={{ background: theme.palette.background.paper, borderRadius: 20, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }} className="p-5">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ color: theme.palette.text.primary, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <User style={{ marginRight: 8, width: 20, height: 20 }} />
                  {selectedCustomer ? (
                    <>
                      {selectedCustomer.first_name} {selectedCustomer.last_name}
                      <span style={{ fontSize: 13, color: theme.palette.text.secondary, marginLeft: 8 }}>
                        {selectedCustomer.age ? `• ${selectedCustomer.age} yrs` : ''}
                      </span>
                    </>
                  ) : (
                    'No patient selected'
                  )}
                </h3>
                {selectedCustomer && (
                  <span style={{ fontSize: 12, padding: '4px 12px', background: theme.palette.primary.light, color: theme.palette.primary.dark, borderRadius: 10 }}>
                    {selectedCustomer.gender || 'Unknown'}
                  </span>
                )}
              </div>
              {selectedCustomer && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 14 }}>
                  <div>
                    <p style={{ color: theme.palette.text.secondary }}>Phone</p>
                    <p style={{ color: theme.palette.text.primary }}>{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ color: theme.palette.text.secondary }}>Email</p>
                    <p style={{ color: theme.palette.text.primary }}>{selectedCustomer.email || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Medicine Selection - Takes majority of space */}
            <div style={{ background: theme.palette.background.paper, borderRadius: 20, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }} className="p-5">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ color: theme.palette.text.primary, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <Pill style={{ marginRight: 8, width: 20, height: 20 }} />
                  Medicine Selection
                </h3>
                <div style={{ position: 'relative', width: 256 }}>
                  <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: theme.palette.text.secondary }} />
                  <Input
                    name="medicineSearchTerm"
                    value={medicineSearchTerm}
                    onChange={(e) => setMedicineSearchTerm(e.target.value)}
                    placeholder="Search medicines..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12, maxHeight: 500, overflowY: 'auto', padding: '8px 0' }}>
                {filteredMedicines.map((medicine) => (
                  <div 
                    key={medicine.id}
                    style={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 12, padding: 12, transition: 'all 0.2s', cursor: 'pointer', hover: { border: `1px solid ${theme.palette.primary.main}` } }}
                    onClick={() => addToCart(medicine)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontWeight: 600, color: theme.palette.text.primary }}>{medicine.product_name}</h4>
                        <p style={{ fontSize: 13, color: theme.palette.text.secondary }}>{medicine.product_category}</p>
                       
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: theme.palette.primary.main }}>
                        Tsh {medicine.product_price.toFixed(2)}
                      </span>
                      <p style={{ fontSize: 12, color: theme.palette.text.secondary, marginTop: 4 }}>
                        Exp: {medicine.expire_date
                          ? (() => {
                              const d = new Date(medicine.expire_date);
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              return `${day}/${month}/${year}`;
                            })()
                          : 'N/A'}
                      </p>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, background: medicine.current_quantity > 0 ? theme.palette.success.light : theme.palette.error.light, color: medicine.current_quantity > 0 ? theme.palette.success.dark : theme.palette.error.dark }}>
                        {medicine.current_quantity > 0 
                          ? `${medicine.current_quantity} in stock` 
                          : 'Out of stock'}
                      </span>
                    
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispensing Cart Section with Process Button */}
            <div style={{ background: theme.palette.background.paper, borderRadius: 20, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }} className="overflow-hidden">
              <div style={{ background: theme.palette.background.paper, padding: 12, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <h3 style={{ color: theme.palette.text.primary, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <ShoppingCart style={{ marginRight: 8, width: 20, height: 20 }} />
                  Dispensing Cart
                </h3>
                <button 
                  onClick={handleSendToCashier}
                  disabled={cart.length === 0 || loading}
                  style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', background: loading ? theme.palette.action.disabledBackground : theme.palette.primary.main, color: theme.palette.primary.contrastText, borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', boxShadow: theme.shadows[1] }}
                >
                  <Send style={{ marginRight: 8, width: 20, height: 20 }} />
                  <span style={{ fontWeight: 600 }}>Process to Cashier</span>
                </button>
              </div>
              
              <div style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <div key={item.id} style={{ padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontWeight: 600, color: theme.palette.text.primary }}>{item.medicineName}</h4>
                          <p style={{ fontSize: 13, color: theme.palette.text.secondary }}>
                            {item.quantity} × Tsh {item.price.toFixed(2)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: theme.palette.text.primary, marginRight: 16 }}>
                            Tsh {(item.quantity * item.price).toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            style={{ padding: 8, background: theme.palette.error.light, color: theme.palette.error.dark, borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: theme.palette.text.secondary }}>
                    <ShoppingCart style={{ margin: '0 auto', width: 40, height: 40, color: theme.palette.text.disabled }} />
                    <p>Your cart is empty</p>
                    <p style={{ fontSize: 13, marginTop: 8 }}>Click on medicines to add them</p>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div style={{ padding: 12, background: theme.palette.background.paper, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: theme.palette.text.secondary }}>Total</span>
                    <span style={{ fontSize: 28, fontWeight: 700, color: theme.palette.primary.main }}>
                      Tsh {calculateTotal()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
          <div style={{ background: theme.palette.background.paper, borderRadius: 20, boxShadow: theme.shadows[3], width: '100%', maxWidth: 500, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 600, color: theme.palette.text.primary }}>Add New Patient</h3>
              <button 
                onClick={() => setShowAddPatientModal(false)}
                style={{ color: theme.palette.text.secondary, cursor: 'pointer', transition: 'color 0.2s' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>First Name *</label>
                  <Input
                    name="newPatientFirstName"
                    value={newPatient.first_name}
                    onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                    placeholder="Enter first name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Last Name *</label>
                  <Input
                    name="newPatientLastName"
                    value={newPatient.last_name}
                    onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                    placeholder="Enter last name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Phone</label>
                  <Input
                    name="newPatientPhone"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Email</label>
                  <Input
                    name="newPatientEmail"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full"
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Address</label>
                  <Input
                    name="newPatientAddress"
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                    placeholder="Enter address"
                    className="w-full"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Age</label>
                  <Input
                    name="newPatientAge"
                    value={newPatient.age || ''}
                    onChange={(e) => setNewPatient({ ...newPatient, age: parseInt(e.target.value) || undefined })}
                    placeholder="Enter age"
                    className="w-full"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.secondary }}>Gender</label>
                  <Select
                    name="newPatientGender"
                    value={newPatient.gender || ''}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value || '' })}
                    options={[
                      { value: '', label: 'Select' },
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div style={{ padding: 16, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowAddPatientModal(false)}
                style={{ padding: '8px 16px', background: theme.palette.action.disabledBackground, color: theme.palette.text.primary, borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                Cancel
              </button>
              <button
                onClick={addNewPatient}
                style={{ padding: '8px 16px', background: theme.palette.primary.main, color: theme.palette.primary.contrastText, borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'background 0.2s', boxShadow: theme.shadows[1] }}
              >
                Add Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dispensing;