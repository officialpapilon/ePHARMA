import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ShoppingCart, CreditCard, DollarSign, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../../../constants';
import { wholesaleOrdersApi } from '../../services/wholesaleService';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  MenuItem,
  InputAdornment,
  CircularProgress,
  alpha,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

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
  customer_type: string;
  credit_limit: string;
  current_balance: string;
  payment_terms: string;
  status: string;
}

interface Product {
  id: string;
  product_id: string;
  product_name: string;
  current_quantity: number;
  product_price: number;
  product_category: string;
  product_unit: string;
  batch_no: string;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  batch_no: string;
}

interface ApiProductItem {
  id?: string | number;
  product_id?: string | number;
  product_name?: string;
  current_quantity?: string | number;
  product_price?: string | number;
  product_category?: string;
  product_unit?: string;
  batch_no?: string;
}

const Pos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);
  const [taxRate, setTaxRate] = useState(7); // Default 7% tax rate
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/api/wholesale/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setCustomers(result.data);
      } else {
        setError('Failed to fetch customers');
      }
    } catch (err) {
      console.error('Fetch customers error:', err);
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/api/medicines-cache?all=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        const mappedProducts = result.data.map((item: ApiProductItem) => ({
          id: (item.id?.toString() || item.product_id?.toString()) || '',
          product_id: item.product_id?.toString() || '',
          product_name: item.product_name || 'Unknown Product',
          current_quantity: parseInt(item.current_quantity as string) || 0,
          product_price: parseFloat(item.product_price as string) || 0,
          product_category: item.product_category || 'Unknown Category',
          product_unit: 'Units', // Default value since product_unit doesn't exist in API
          batch_no: item.batch_no || 'BATCH-001', // Default batch number - should be improved
        }));
        setProducts(mappedProducts);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone_number.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product => 
    product.product_name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.product_category.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const addToCart = () => {
    if (selectedProduct && quantity > 0) {
      if (quantity > selectedProduct.current_quantity) {
        setError(`Only ${selectedProduct.current_quantity} ${selectedProduct.product_unit} available in stock`);
        return;
      }

      const existingItemIndex = cart.findIndex(item => item.productId === selectedProduct.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedCart = [...cart];
        const newQuantity = updatedCart[existingItemIndex].quantity + quantity;
        if (newQuantity > selectedProduct.current_quantity) {
          setError(`Only ${selectedProduct.current_quantity} ${selectedProduct.product_unit} available in stock`);
          return;
        }
        updatedCart[existingItemIndex].quantity = newQuantity;
        setCart(updatedCart);
      } else {
        // Add new item
        setCart([...cart, {
          id: Date.now().toString(),
          productId: selectedProduct.product_id,
          name: selectedProduct.product_name,
          quantity,
          price: selectedProduct.product_price,
          unit: selectedProduct.product_unit,
          batch_no: selectedProduct.batch_no,
        }]);
      }
      
      setSelectedProduct(null);
      setQuantity(1);
      setProductSearchTerm('');
      setError(null);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (taxRate / 100); // Use taxRate state
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCheckout = () => {
    if (selectedCustomer && cart.length > 0) {
      setShowPaymentModal(true);
    } else {
      setError('Please select a customer and add items to cart');
    }
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountPaid(value);
    
    const paid = parseFloat(value) || 0;
    setChange(Math.max(0, paid - calculateTotal()));
  };

  const handleCompletePayment = async () => {
    if (!selectedCustomer || cart.length === 0) {
      setError('Please select a customer and add items to cart');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orderData = {
        customer_id: parseInt(selectedCustomer.id.toString()),
        order_type: 'sale',
        items: cart.map(item => ({
          product_id: item.productId,
          batch_no: item.batch_no,
          quantity_ordered: item.quantity,
          wholesale_price: item.price,
          discount_percentage: 0,
          tax_percentage: taxRate
        })),
        expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        notes: `Payment method: ${paymentMethod}`,
        shipping_amount: 0
      };

      console.log('Creating order with data:', orderData);

      const response = await wholesaleOrdersApi.create(orderData);
      console.log('Order creation response:', response);
      
      if (response.data && (response.data as { success: boolean }).success) {
        setSuccess('Order created successfully!');
        setCart([]);
        setSelectedCustomer(null);
        setShowPaymentModal(false);
        setAmountPaid('');
        setChange(0);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorMessage = (response.data as { message?: string })?.message || 'Failed to create order';
        console.error('Order creation failed:', response.data);
        setError(errorMessage);
      }
    } catch (err: unknown) {
      console.error('Create order error:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as { message?: string })?.message || 'Failed to create order';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && (customers.length === 0 || products.length === 0)) {
    return <LoadingSpinner overlay message="Loading POS system..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Wholesale Point of Sale
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTriangle className="h-5 w-5" />
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <ShoppingCart className="h-5 w-5" />
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Customer Selection */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" component="h2" gutterBottom>
              Select Customer
            </Typography>
            
            <TextField
              fullWidth
              margin="normal"
              label="Search customers..."
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <Search className="h-5 w-5 text-gray-400" />
                ),
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <List sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <ListItem key={customer.id} onClick={() => setSelectedCustomer(customer)} sx={{ cursor: 'pointer' }}>
                    <ListItemText
                      primary={customer.business_name}
                      secondary={
                        <>
                          <Chip label={customer.customer_type} size="small" />
                          <br />
                          {customer.phone_number}
                        </>
                      }
                    />
                    {selectedCustomer?.id === customer.id && (
                      <CheckCircle className="h-4 w-4 text-indigo-500" />
                    )}
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No customers found" />
                </ListItem>
              )}
            </List>

            {selectedCustomer && (
              <Box sx={{ mt: 2, p: 2, bgcolor: alpha('#007bff', 0.1) }}>
                <Typography variant="subtitle2" component="h3">
                  Selected Customer
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {selectedCustomer.business_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCustomer.phone_number}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Product Selection and Cart */}
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" component="h2" gutterBottom>
              Add Products
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                margin="normal"
                label="Search products..."
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <Search className="h-5 w-5 text-gray-400" />
                  ),
                }}
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  type="number"
                  label="Qty"
                  variant="outlined"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1 }}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={addToCart}
                  disabled={!selectedProduct || quantity <= 0}
                  startIcon={<Plus className="h-4 w-4" />}
                >
                  Add
                </Button>
              </Box>
            </Box>

            <List sx={{ maxHeight: 150, overflow: 'auto', mb: 2 }}>
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <ListItem key={product.id} onClick={() => setSelectedProduct(product)} sx={{ cursor: 'pointer' }}>
                    <ListItemText
                      primary={product.product_name}
                      secondary={
                        <>
                          <Chip label={product.product_category} size="small" />
                          <br />
                          Tsh {product.product_price.toLocaleString()}
                        </>
                      }
                    />
                    {selectedProduct?.id === product.id && (
                      <CheckCircle className="h-4 w-4 text-indigo-500" />
                    )}
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No products found" />
                </ListItem>
              )}
            </List>

            {/* Cart */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Typography variant="subtitle2" component="h3" gutterBottom>
                Cart Items
              </Typography>
              {cart.length > 0 ? (
                <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {cart.map(item => (
                    <ListItem key={item.id} sx={{ justifyContent: 'space-between' }}>
                      <ListItemText
                        primary={item.name}
                        secondary={`${item.quantity} x Tsh ${item.price.toLocaleString()}`}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          Tsh {(item.quantity * item.price).toLocaleString()}
                        </Typography>
                        <Button
                          variant="text"
                          onClick={() => removeFromCart(item.id)}
                          color="error"
                          size="small"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                  
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      Tsh {calculateSubtotal().toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Tax ({taxRate}%):</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        type="number"
                        label="Tax Rate"
                        variant="outlined"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, max: 100 }}
                        size="small"
                        sx={{ width: 80 }}
                      />
                      <Typography variant="body2">Tsh {calculateTax().toLocaleString()}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.125rem' }}>
                    <Typography variant="body2">Total:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      Tsh {calculateTotal().toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="contained"
                    onClick={handleCheckout}
                    disabled={!selectedCustomer || cart.length === 0}
                    startIcon={<CreditCard className="h-5 w-5" />}
                    sx={{ mt: 2 }}
                  >
                    Proceed to Payment
                  </Button>
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <Typography variant="body2" color="text.secondary">
                    No items in cart
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Payment Modal */}
      {showPaymentModal && (
        <Dialog open={showPaymentModal} onClose={() => setShowPaymentModal(false)}>
          <DialogTitle>Payment</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Payment Method"
                select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'mobile')}
                fullWidth
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="mobile">Mobile Money</MenuItem>
              </TextField>

              <TextField
                label="Amount Paid"
                type="number"
                fullWidth
                value={amountPaid}
                onChange={handleAmountPaidChange}
                inputProps={{ min: calculateTotal() }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">Tsh</InputAdornment>
                  ),
                }}
              />

              {change > 0 && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  <strong>Change:</strong> Tsh {change.toFixed(2)}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button
              onClick={handleCompletePayment}
              disabled={parseFloat(amountPaid) < calculateTotal() || loading}
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DollarSign className="h-4 w-4" />}
            >
              {loading ? 'Processing...' : 'Complete Payment'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Pos;