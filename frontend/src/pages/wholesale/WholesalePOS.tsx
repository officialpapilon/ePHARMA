import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Package, 
  DollarSign, 
  CreditCard,
  Truck,
  Calendar,
  Plus,
  Minus,
  X,
  Trash2,
  Save,
  Printer,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useTheme } from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

interface Product {
  id: number;
  product_id: string;
  product_name: string;
  product_category: string;
  batch_no: string;
  current_quantity: number;
  product_price: string;
  buying_price: string | null;
}

interface Customer {
  id: number;
  business_name: string;
  contact_person: string;
  phone_number: string;
  customer_type: string;
  credit_limit: number;
  current_balance: number;
  payment_terms: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  wholesale_price: number;
  discount_percentage: number;
  tax_percentage: number;
  subtotal: number;
  total: number;
}

const WholesalePOS: React.FC = () => {
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Order details
  const [orderType, setOrderType] = useState<'sale' | 'quotation' | 'reservation'>('sale');
  const [shippingAmount, setShippingAmount] = useState(0);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8000/api/wholesale/products?per_page=50`, {
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
        setProducts(result.data);
      } else {
        setError(result.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Products fetch error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8000/api/wholesale/customers?per_page=50`, {
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
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const wholesalePrice = parseFloat(product.product_price) * 0.8; // 20% discount
      const newItem: CartItem = {
        product,
        quantity: 1,
        wholesale_price: wholesalePrice,
        discount_percentage: 0,
        tax_percentage: 18, // VAT
        subtotal: wholesalePrice,
        total: wholesalePrice * 1.18
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItem = (productId: number, field: keyof CartItem, value: any) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate totals
        const subtotal = updatedItem.wholesale_price * updatedItem.quantity;
        const discount = (subtotal * updatedItem.discount_percentage) / 100;
        const taxableAmount = subtotal - discount;
        const tax = (taxableAmount * updatedItem.tax_percentage) / 100;
        
        return {
          ...updatedItem,
          subtotal,
          total: subtotal - discount + tax
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setOrderType('sale');
    setShippingAmount(0);
    setExpectedDeliveryDate('');
    setNotes('');
    setDeliveryInstructions('');
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = cart.reduce((sum, item) => sum + (item.subtotal * item.discount_percentage / 100), 0);
    const totalTax = cart.reduce((sum, item) => sum + (item.subtotal - (item.subtotal * item.discount_percentage / 100)) * item.tax_percentage / 100, 0);
    const total = subtotal - totalDiscount + totalTax + shippingAmount;

    return {
      subtotal,
      totalDiscount,
      totalTax,
      shippingAmount,
      total
    };
  };

  const handleCreateOrder = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    if (cart.length === 0) {
      setError('Please add items to cart');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const orderData = {
        customer_id: selectedCustomer.id,
        order_type: orderType,
        items: cart.map(item => ({
          product_id: item.product.product_id,
          batch_no: item.product.batch_no,
          quantity_ordered: item.quantity,
          wholesale_price: item.wholesale_price,
          discount_percentage: item.discount_percentage,
          tax_percentage: item.tax_percentage,
        })),
        shipping_amount: shippingAmount,
        expected_delivery_date: expectedDeliveryDate,
        notes,
        delivery_instructions,
      };

      const response = await fetch(`http://localhost:8000/api/wholesale/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const result = await response.json();
      if (result.success) {
        setSuccess('Order created successfully!');
        clearCart();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Create order error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Tsh ${amount.toLocaleString()}`;
  };

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.batch_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    customer.business_name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.contact_person.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const totals = calculateTotals();

  return (
    <div style={{ 
      padding: '16px', 
      background: theme.palette.background.default, 
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: 24
    }}>
      {/* Left Panel - Products and Customer Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Customer Selection */}
        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 20, 
          borderRadius: 12, 
          boxShadow: theme.shadows[1], 
          border: `1px solid ${theme.palette.divider}` 
        }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: theme.palette.text.primary, 
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <User style={{ width: 20, height: 20 }} />
            Customer Selection
          </h3>

          {selectedCustomer ? (
            <div style={{ 
              padding: 16, 
              background: theme.palette.primary.light, 
              borderRadius: 8,
              border: `1px solid ${theme.palette.primary.main}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: theme.palette.primary.main,
                    margin: '0 0 4px 0'
                  }}>
                    {selectedCustomer.business_name}
                  </p>
                  <p style={{ 
                    fontSize: 14, 
                    color: theme.palette.primary.main,
                    margin: '0 0 4px 0'
                  }}>
                    {selectedCustomer.contact_person} • {selectedCustomer.phone_number}
                  </p>
                  <p style={{ 
                    fontSize: 12, 
                    color: theme.palette.primary.main,
                    margin: 0
                  }}>
                    Credit Limit: {formatCurrency(selectedCustomer.credit_limit)} • 
                    Balance: {formatCurrency(selectedCustomer.current_balance)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  style={{
                    padding: '4px 8px',
                    background: theme.palette.error.main,
                    color: theme.palette.error.contrastText,
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative', marginBottom: 12 }}>
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
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  placeholder="Search customers..."
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
              
              <div style={{ 
                maxHeight: 200, 
                overflowY: 'auto',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}>
                {filteredCustomers.slice(0, 5).map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.palette.grey[50]}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <p style={{ 
                      fontSize: 14, 
                      fontWeight: 600, 
                      color: theme.palette.text.primary,
                      margin: '0 0 4px 0'
                    }}>
                      {customer.business_name}
                    </p>
                    <p style={{ 
                      fontSize: 12, 
                      color: theme.palette.text.secondary,
                      margin: 0
                    }}>
                      {customer.contact_person} • {customer.customer_type}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Products */}
        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 20, 
          borderRadius: 12, 
          boxShadow: theme.shadows[1], 
          border: `1px solid ${theme.palette.divider}`,
          flex: 1
        }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: theme.palette.text.primary, 
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Package style={{ width: 20, height: 20 }} />
            Products
          </h3>

          <div style={{ position: 'relative', marginBottom: 16 }}>
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
              placeholder="Search products..."
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

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: 12,
            maxHeight: 400,
            overflowY: 'auto'
          }}>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                style={{
                  padding: 12,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  background: theme.palette.background.default,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = theme.palette.grey[50]}
                onMouseLeave={(e) => e.currentTarget.style.background = theme.palette.background.default}
                onClick={() => addToCart(product)}
              >
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
                  margin: '0 0 4px 0'
                }}>
                  {product.product_id} • {product.batch_no}
                </p>
                <p style={{ 
                  fontSize: 12, 
                  color: theme.palette.text.secondary,
                  margin: '0 0 4px 0'
                }}>
                  Stock: {product.current_quantity} • {product.product_category}
                </p>
                <p style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: theme.palette.primary.main,
                  margin: 0
                }}>
                  {formatCurrency(parseFloat(product.product_price))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart and Order Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Cart */}
        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 20, 
          borderRadius: 12, 
          boxShadow: theme.shadows[1], 
          border: `1px solid ${theme.palette.divider}`,
          flex: 1
        }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: theme.palette.text.primary, 
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <ShoppingCart style={{ width: 20, height: 20 }} />
            Cart ({cart.length} items)
          </h3>

          {cart.length === 0 ? (
            <p style={{ 
              textAlign: 'center', 
              color: theme.palette.text.secondary,
              fontStyle: 'italic',
              margin: 0
            }}>
              No items in cart
            </p>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 12,
              maxHeight: 300,
              overflowY: 'auto'
            }}>
              {cart.map(item => (
                <div
                  key={item.product.id}
                  style={{
                    padding: 12,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    background: theme.palette.background.default
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        margin: '0 0 4px 0'
                      }}>
                        {item.product.product_name}
                      </p>
                      <p style={{ 
                        fontSize: 12, 
                        color: theme.palette.text.secondary,
                        margin: 0
                      }}>
                        {item.product.product_id} • {item.product.batch_no}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      style={{
                        padding: '4px',
                        background: theme.palette.error.main,
                        color: theme.palette.error.contrastText,
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 style={{ width: 12, height: 12 }} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: theme.palette.text.secondary }}>Quantity</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={() => updateCartItem(item.product.id, 'quantity', Math.max(1, item.quantity - 1))}
                          style={{
                            padding: '2px 6px',
                            background: theme.palette.grey[300],
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                          }}
                        >
                          <Minus style={{ width: 12, height: 12 }} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateCartItem(item.product.id, 'quantity', parseInt(e.target.value) || 1)}
                          style={{
                            width: 50,
                            padding: '4px',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 4,
                            textAlign: 'center',
                            fontSize: 12
                          }}
                        />
                        <button
                          onClick={() => updateCartItem(item.product.id, 'quantity', item.quantity + 1)}
                          style={{
                            padding: '2px 6px',
                            background: theme.palette.grey[300],
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                          }}
                        >
                          <Plus style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: theme.palette.text.secondary }}>Price</label>
                      <input
                        type="number"
                        value={item.wholesale_price}
                        onChange={(e) => updateCartItem(item.product.id, 'wholesale_price', parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '4px',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 4,
                          fontSize: 12
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: theme.palette.text.secondary }}>Discount %</label>
                      <input
                        type="number"
                        value={item.discount_percentage}
                        onChange={(e) => updateCartItem(item.product.id, 'discount_percentage', parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '4px',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 4,
                          fontSize: 12
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: theme.palette.text.secondary }}>Total</label>
                      <p style={{ 
                        fontSize: 12, 
                        fontWeight: 600, 
                        color: theme.palette.primary.main,
                        margin: 0
                      }}>
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Details */}
        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 20, 
          borderRadius: 12, 
          boxShadow: theme.shadows[1], 
          border: `1px solid ${theme.palette.divider}` 
        }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: theme.palette.text.primary, 
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CreditCard style={{ width: 20, height: 20 }} />
            Order Details
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Order Type</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as any)}
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
                <option value="sale">Sale</option>
                <option value="quotation">Quotation</option>
                <option value="reservation">Reservation</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Shipping Amount</label>
              <input
                type="number"
                value={shippingAmount}
                onChange={(e) => setShippingAmount(parseFloat(e.target.value) || 0)}
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
              <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
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
              <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              <label style={{ fontSize: 12, color: theme.palette.text.secondary }}>Delivery Instructions</label>
              <textarea
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
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
          </div>
        </div>

        {/* Totals and Actions */}
        <div style={{ 
          background: theme.palette.background.paper, 
          padding: 20, 
          borderRadius: 12, 
          boxShadow: theme.shadows[1], 
          border: `1px solid ${theme.palette.divider}` 
        }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: theme.palette.text.primary, 
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <DollarSign style={{ width: 20, height: 20 }} />
            Totals
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: theme.palette.text.secondary }}>Subtotal:</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: theme.palette.text.secondary }}>Discount:</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: theme.palette.success.main }}>
                -{formatCurrency(totals.totalDiscount)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: theme.palette.text.secondary }}>Tax:</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{formatCurrency(totals.totalTax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: theme.palette.text.secondary }}>Shipping:</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{formatCurrency(totals.shippingAmount)}</span>
            </div>
            <hr style={{ border: 'none', borderTop: `1px solid ${theme.palette.divider}`, margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: theme.palette.text.primary }}>Total:</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: theme.palette.primary.main }}>
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleCreateOrder}
              disabled={loading || cart.length === 0 || !selectedCustomer}
              style={{
                width: '100%',
                padding: '12px',
                background: loading || cart.length === 0 || !selectedCustomer 
                  ? theme.palette.grey[300] 
                  : theme.palette.primary.main,
                color: loading || cart.length === 0 || !selectedCustomer 
                  ? theme.palette.grey[600] 
                  : theme.palette.primary.contrastText,
                border: 'none',
                borderRadius: 8,
                cursor: loading || cart.length === 0 || !selectedCustomer ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {loading ? (
                <LoadingSpinner loading={true} size={16} />
              ) : (
                <Save style={{ width: 16, height: 16 }} />
              )}
              Create Order
            </button>

            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              style={{
                width: '100%',
                padding: '8px',
                background: cart.length === 0 ? theme.palette.grey[300] : theme.palette.error.main,
                color: cart.length === 0 ? theme.palette.grey[600] : theme.palette.error.contrastText,
                border: 'none',
                borderRadius: 8,
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <Trash2 style={{ width: 14, height: 14 }} />
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          padding: 16,
          background: theme.palette.error.light,
          color: theme.palette.error.main,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 1000,
          maxWidth: 300
        }}>
          <AlertCircle style={{ width: 20, height: 20 }} />
          {error}
        </div>
      )}

      {success && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          padding: 16,
          background: theme.palette.success.light,
          color: theme.palette.success.main,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 1000,
          maxWidth: 300
        }}>
          <CheckCircle style={{ width: 20, height: 20 }} />
          {success}
        </div>
      )}
    </div>
  );
};

export default WholesalePOS; 