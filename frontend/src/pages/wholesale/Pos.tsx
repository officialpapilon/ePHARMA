import React, { useState } from 'react';
import { Search, Plus, Trash2, Check, CreditCard, DollarSign, Smartphone } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: string;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
  category: string;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

const Pos = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);

  // Mock data
  const customers: Customer[] = [
    { id: '1', name: 'MediCare Hospital', phone: '123-456-7890', email: 'info@medicare.com', type: 'Hospital' },
    { id: '2', name: 'City Clinic', phone: '234-567-8901', email: 'contact@cityclinic.com', type: 'Clinic' },
    { id: '3', name: 'HealthPlus Pharmacy', phone: '345-678-9012', email: 'orders@healthplus.com', type: 'Pharmacy' },
    { id: '4', name: 'Wellness Center', phone: '456-789-0123', email: 'wellness@center.com', type: 'Clinic' },
    { id: '5', name: 'Community Health', phone: '567-890-1234', email: 'community@health.org', type: 'Non-profit' },
  ];

  const products: Product[] = [
    { id: '1', name: 'Paracetamol 500mg (Box of 100)', stock: 500, price: 25.99, category: 'Analgesics' },
    { id: '2', name: 'Amoxicillin 250mg (Box of 50)', stock: 300, price: 45.50, category: 'Antibiotics' },
    { id: '3', name: 'Ibuprofen 400mg (Box of 100)', stock: 400, price: 30.25, category: 'Analgesics' },
    { id: '4', name: 'Cetirizine 10mg (Box of 100)', stock: 350, price: 28.75, category: 'Antihistamines' },
    { id: '5', name: 'Omeprazole 20mg (Box of 50)', stock: 250, price: 42.00, category: 'Proton Pump Inhibitors' },
    { id: '6', name: 'Metformin 500mg (Box of 100)', stock: 320, price: 35.50, category: 'Antidiabetics' },
    { id: '7', name: 'Atorvastatin 10mg (Box of 30)', stock: 280, price: 48.75, category: 'Statins' },
    { id: '8', name: 'Losartan 50mg (Box of 50)', stock: 220, price: 39.99, category: 'Antihypertensives' },
    { id: '9', name: 'Salbutamol Inhaler (Box of 10)', stock: 150, price: 65.25, category: 'Bronchodilators' },
    { id: '10', name: 'Fluoxetine 20mg (Box of 30)', stock: 180, price: 52.50, category: 'Antidepressants' },
  ];

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const addToCart = () => {
    if (selectedProduct && quantity > 0) {
      const existingItemIndex = cart.findIndex(item => item.productId === selectedProduct.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += quantity;
        setCart(updatedCart);
      } else {
        // Add new item
        setCart([...cart, {
          id: Date.now().toString(),
          productId: selectedProduct.id,
          name: selectedProduct.name,
          quantity,
          price: selectedProduct.price
        }]);
      }
      
      setSelectedProduct(null);
      setQuantity(1);
      setProductSearchTerm('');
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.07; // 7% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCheckout = () => {
    if (selectedCustomer && cart.length > 0) {
      setShowPaymentModal(true);
    }
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountPaid(value);
    
    const paid = parseFloat(value) || 0;
    setChange(Math.max(0, paid - calculateTotal()));
  };

  const handleCompletePayment = () => {
    // In a real application, this would process the payment and update inventory
    alert(`Payment completed successfully for ${selectedCustomer?.name}!`);
    setCart([]);
    setSelectedCustomer(null);
    setShowPaymentModal(false);
    setAmountPaid('');
    setChange(0);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Point of Sale</h2>
      
      {/* Customer Selection */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-md font-medium mb-3">Customer Selection</h3>
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search customers..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {selectedCustomer && (
            <div className="flex-shrink-0 p-3 bg-indigo-50 rounded-md border border-indigo-100">
              <p className="font-medium">{selectedCustomer.name}</p>
              <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
            </div>
          )}
        </div>
        
        {searchTerm && !selectedCustomer && (
          <div className="mt-2 border rounded-md max-h-60 overflow-y-auto">
            {filteredCustomers.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {filteredCustomers.map(customer => (
                  <li key={customer.id}>
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-gray-50"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setSearchTerm('');
                      }}
                    >
                      <p className="font-medium">{customer.name}</p>
                      <div className="flex text-sm text-gray-500">
                        <p className="mr-4">{customer.phone}</p>
                        <p>{customer.type}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">No customers found</div>
            )}
          </div>
        )}
      </div>
      
      {/* Product Selection and Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-md font-medium">Product Selection</h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="border rounded-md max-h-96 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <li key={product.id}>
                    <button
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${
                        selectedProduct?.id === product.id ? 'bg-indigo-50' : ''
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">Tsh {product.price.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">No products found</div>
            )}
          </div>
          
          {selectedProduct && (
            <div className="p-4 border rounded-md bg-gray-50">
              <div className="flex justify-between mb-2">
                <h4 className="font-medium">{selectedProduct.name}</h4>
                <span className="font-bold">Tsh {selectedProduct.price.toFixed(2)}</span>
              </div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-24 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={addToCart}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex-1"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add to Cart
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Cart */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-md font-medium">Shopping Cart</h3>
          
          <div className="border rounded-md overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cart.length > 0 ? (
                    cart.map(item => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Tsh {item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Tsh {(item.quantity * item.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No items in cart
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {cart.length > 0 && (
              <div className="bg-gray-50 px-6 py-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal:</span>
                  <span>Tsh {calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tax (7%):</span>
                  <span>Tsh {calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>Tsh {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleCheckout}
              disabled={!selectedCustomer || cart.length === 0}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              <Check className="h-5 w-5 mr-2" />
              Complete Payment
            </button>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Payment Details</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium">{selectedCustomer?.name}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-xl font-bold">Tsh {calculateTotal().toFixed(2)}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center px-3 py-2 rounded-md ${
                    paymentMethod === 'cash'
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  <DollarSign className="h-5 w-5 mr-1" />
                  Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center px-3 py-2 rounded-md ${
                    paymentMethod === 'card'
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mr-1" />
                  Card
                </button>
                <button
                  onClick={() => setPaymentMethod('mobile')}
                  className={`flex items-center px-3 py-2 rounded-md ${
                    paymentMethod === 'mobile'
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  <Smartphone className="h-5 w-5 mr-1" />
                  Mobile
                </button>
              </div>
            </div>
            
            {paymentMethod === 'cash' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    min={calculateTotal()}
                    step="0.01"
                    value={amountPaid}
                    onChange={handleAmountPaidChange}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Change
                  </label>
                  <input
                    type="text"
                    value={`Tsh ${change.toFixed(2)}`}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompletePayment}
                disabled={paymentMethod === 'cash' && (!amountPaid || parseFloat(amountPaid) < calculateTotal())}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                Complete Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pos;