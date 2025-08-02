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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useApiCall } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

interface Product {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  current_quantity: number;
  product_price: number;
  batch_no: string;
}

interface Customer {
  id: number;
  business_name: string;
  contact_person: string;
  phone_number: string;
}

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const Pos: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    business_name: '',
    contact_person: '',
    phone_number: '',
    email: '',
    address: '',
    city: '',
    customer_type: 'pharmacy' as const,
    credit_limit_type: 'limited' as const,
    credit_limit: 1000000,
    payment_terms: 'immediate' as const,
    status: 'active' as const
  });

  const { apiCall } = useApiCall();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching POS data...');
      
      const [productsResponse, customersResponse] = await Promise.all([
        apiCall('/api/wholesale/products'),
        apiCall('/api/wholesale/customers'),
        apiCall('/api/wholesale/customers', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })
      ]);

      console.log('Products response:', productsResponse);
      console.log('Customers response:', customersResponse);

      if (productsResponse.success) {
        setProducts(productsResponse.data || []);
      }

      if (customersResponse.success) {
        setCustomers(customersResponse.data || []);
      }
    } catch (error) {
      console.error('POS fetch error:', error);
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.product_id === product.product_id);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      updatedCart[existingItemIndex].total = updatedCart[existingItemIndex].quantity * updatedCart[existingItemIndex].unit_price;
      setCart(updatedCart);
    } else {
      // Add new item
      const newItem = {
        product_id: product.product_id,
        product_name: product.product_name,
        unit_price: parseFloat(product.product_price),
        quantity: 1,
        total: parseFloat(product.product_price)
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      setCart(cart.filter((_, i) => i !== index));
    } else {
      const updatedCart = [...cart];
      updatedCart[index].quantity = newQuantity;
      updatedCart[index].total = newQuantity * updatedCart[index].unit_price;
      setCart(updatedCart);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCreateOrder = async () => {
    if (!selectedCustomer) {
      showError('Please select a customer');
      return;
    }

    if (cart.length === 0) {
      showError('Please add items to cart');
      return;
    }

    try {
      setSubmitting(true);
      const orderData = {
        customer_id: selectedCustomer,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        payment_method: paymentMethod,
        delivery_type: deliveryType,
        expected_delivery_date: expectedDeliveryDate?.toISOString().split('T')[0],
        notes
      };

      const response = await apiCall('/api/wholesale/create-order', {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        data: orderData
      });

      if (response.success) {
        showSuccess('Order created successfully!');
        setCart([]);
        setSelectedCustomer('');
        setNotes('');
        setExpectedDeliveryDate(new Date());
      }
    } catch (error) {
      showError('Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCustomer = async () => {
    try {
      const response = await apiCall('/api/wholesale/customers', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data: newCustomer
      });

      if (response.success) {
        showSuccess('Customer added successfully!');
        setShowAddCustomerModal(false);
        setNewCustomer({
          business_name: '',
          contact_person: '',
          phone_number: '',
          email: '',
          address: '',
          city: '',
          customer_type: 'pharmacy',
          credit_limit_type: 'limited',
          credit_limit: 1000000,
          payment_terms: 'immediate',
          status: 'active'
        });
        fetchData(); // Refresh customers list
      } else {
        showError(response.message || 'Failed to add customer');
      }
    } catch (error) {
      console.error('Add customer error:', error);
      showError('Failed to add customer');
    }
  };

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner overlay message="Loading POS..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Point of Sale
      </Typography>

      <Grid container spacing={3}>
        {/* Products Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Products
            </Typography>
            
            {/* Search Products */}
            <TextField
              fullWidth
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
              {filteredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => addToCart(product)}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {product.product_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {product.product_category}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {formatCurrency(product.product_price)}
                      </Typography>
                      <Chip 
                        label={`Stock: ${product.current_quantity}`} 
                        size="small" 
                        color={product.current_quantity > 0 ? 'success' : 'error'}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Cart Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              <CartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Cart
            </Typography>

            {cart.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CartIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  No items in cart
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item, index) => (
                        <TableRow key={item.product_id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {item.product_name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <IconButton
                                size="small"
                                onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                              >
                                <RemoveIcon />
                              </IconButton>
                              <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                              <IconButton
                                size="small"
                                onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                              >
                                <AddIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeFromCart(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" align="right">
                    Total: {formatCurrency(getTotal())}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Customer and Order Details */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Customer & Order Details
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Customer</InputLabel>
              <Select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                label="Customer"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.business_name} - {customer.contact_person}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowAddCustomerModal(true)}
              sx={{ mt: 1 }}
            >
              Add New Customer
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Payment Method"
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Delivery Type</InputLabel>
              <Select
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value)}
                label="Delivery Type"
              >
                <MenuItem value="delivery">Delivery</MenuItem>
                <MenuItem value="pickup">Customer Pickup</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Expected Delivery Date"
                value={expectedDeliveryDate}
                onChange={setExpectedDeliveryDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PaymentIcon />}
            onClick={handleCreateOrder}
            disabled={submitting || cart.length === 0 || !selectedCustomer}
          >
            {submitting ? 'Creating Order...' : 'Create Order'}
          </Button>
        </Box>
      </Paper>

      {/* Add Customer Modal */}
      <Dialog open={showAddCustomerModal} onClose={() => setShowAddCustomerModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Business Name"
                value={newCustomer.business_name}
                onChange={(e) => setNewCustomer({...newCustomer, business_name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={newCustomer.contact_person}
                onChange={(e) => setNewCustomer({...newCustomer, contact_person: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={newCustomer.phone_number}
                onChange={(e) => setNewCustomer({...newCustomer, phone_number: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                value={newCustomer.city}
                onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddCustomerModal(false)}>Cancel</Button>
          <Button onClick={handleAddCustomer} variant="contained">
            Add Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Pos; 