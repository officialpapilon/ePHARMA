import React, { useState } from 'react';
import { Search, Plus, Trash2, Check, CreditCard, DollarSign, Smartphone } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  expiryDate: string;
  batchNumber: string;
}

const ReceiveStock = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'credit'>('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock data
  const suppliers: Supplier[] = [
    { 
      id: '1', 
      name: 'PharmaCorp', 
      phone: '123-456-7890', 
      email: 'orders@pharmacorp.com', 
      address: '123 Supplier St, Pharma City, PC 12345',
      contactPerson: 'John Williams'
    },
    { 
      id: '2', 
      name: 'MediSupply', 
      phone: '234-567-8901', 
      email: 'info@medisupply.com', 
      address: '456 Medical Ave, Supply Town, ST 23456',
      contactPerson: 'Sarah Johnson'
    },
    { 
      id: '3', 
      name: 'HealthDist', 
      phone: '345-678-9012', 
      email: 'orders@healthdist.com', 
      address: '789 Health Blvd, Distribution City, DC 34567',
      contactPerson: 'Michael Brown'
    },
    { 
      id: '4', 
      name: 'GlobalMed', 
      phone: '456-789-0123', 
      email: 'contact@globalmed.com', 
      address: '321 Global Way, Medicine Valley, MV 45678',
      contactPerson: 'Emily Davis'
    },
    { 
      id: '5', 
      name: 'LocalPharm', 
      phone: '567-890-1234', 
      email: 'supply@localpharm.com', 
      address: '654 Local Road, Pharmacy Heights, PH 56789',
      contactPerson: 'Robert Wilson'
    },
  ];

  const products: Product[] = [
    { id: '1', name: 'Paracetamol 500mg', category: 'Analgesics', price: 25.99, unit: 'Boxes' },
    { id: '2', name: 'Amoxicillin 250mg', category: 'Antibiotics', price: 45.50, unit: 'Boxes' },
    { id: '3', name: 'Ibuprofen 400mg', category: 'Analgesics', price: 30.25, unit: 'Boxes' },
    { id: '4', name: 'Cetirizine 10mg', category: 'Antihistamines', price: 28.75, unit: 'Boxes' },
    { id: '5', name: 'Omeprazole 20mg', category: 'Proton Pump Inhibitors', price: 42.00, unit: 'Boxes' },
    { id: '6', name: 'Metformin 500mg', category: 'Antidiabetics', price: 35.50, unit: 'Boxes' },
    { id: '7', name: 'Atorvastatin 10mg', category: 'Statins', price: 48.75, unit: 'Boxes' },
    { id: '8', name: 'Losartan 50mg', category: 'Antihypertensives', price: 39.99, unit: 'Boxes' },
    { id: '9', name: 'Salbutamol Inhaler', category: 'Bronchodilators', price: 65.25, unit: 'Boxes' },
    { id: '10', name: 'Fluoxetine 20mg', category: 'Antidepressants', price: 52.50, unit: 'Boxes' },
  ];

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone.includes(searchTerm) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const addToCart = () => {
    if (selectedProduct && quantity > 0 && expiryDate && batchNumber) {
      const existingItemIndex = cart.findIndex(item => 
        item.productId === selectedProduct.id && 
        item.batchNumber === batchNumber && 
        item.expiryDate === expiryDate
      );
      
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
          price: selectedProduct.price,
          expiryDate,
          batchNumber
        }]);
      }
      
      setSelectedProduct(null);
      setQuantity(1);
      setExpiryDate('');
      setBatchNumber('');
      setProductSearchTerm('');
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const handleReceiveStock = () => {
    if (selectedSupplier && cart.length > 0 && invoiceNumber) {
      setShowPaymentModal(true);
    }
  };

  const handleCompleteReceiving = () => {
    // In a real application, this would process the stock receipt and update inventory
    alert(`Stock received successfully from ${selectedSupplier?.name}!`);
    setCart([]);
    setSelectedSupplier(null);
    setShowPaymentModal(false);
    setInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Receive Stock</h2>
      
      {/* Supplier Selection */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-md font-medium mb-3">Supplier Selection</h3>
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search suppliers..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {selectedSupplier && (
            <div className="flex-shrink-0 p-3 bg-indigo-50 rounded-md border border-indigo-100">
              <p className="font-medium">{selectedSupplier.name}</p>
              <p className="text-sm text-gray-600">{selectedSupplier.contactPerson} | {selectedSupplier.phone}</p>
            </div>
          )}
        </div>
        
        {searchTerm && !selectedSupplier && (
          <div className="mt-2 border rounded-md max-h-60 overflow-y-auto">
            {filteredSuppliers.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {filteredSuppliers.map(supplier => (
                  <li key={supplier.id}>
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-gray-50"
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setSearchTerm('');
                      }}
                    >
                      <p className="font-medium">{supplier.name}</p>
                      <div className="flex text-sm text-gray-500">
                        <p className="mr-4">{supplier.contactPerson}</p>
                        <p>{supplier.phone}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">No suppliers found</div>
            )}
          </div>
        )}
      </div>
      
      {/* Invoice Details */}
      {selectedSupplier && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-md font-medium mb-3">Invoice Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter invoice number"
                required
              />
            </div>
            <div>
              <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date
              </label>
              <input
                type="date"
                id="invoiceDate"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Product Selection and Cart */}
      {selectedSupplier && (
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
                            <p className="font-bold">${product.price.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{product.unit}</p>
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
              <div className="p-4 border rounded-md bg-gray-50 space-y-3">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">{selectedProduct.name}</h4>
                  <span className="font-bold">${selectedProduct.price.toFixed(2)}</span>
                </div>
                
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    id="batchNumber"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter batch number"
                  />
                </div>
                
                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <button
                  onClick={addToCart}
                  disabled={!selectedProduct || quantity < 1 || !expiryDate || !batchNumber}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 w-full justify-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add to Cart
                </button>
              </div>
            )}
          </div>
          
          {/* Cart */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-md font-medium">Stock Receipt Cart</h3>
            
            <div className="border rounded-md overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry
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
                            {item.batchNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.expiryDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${(item.quantity * item.price).toFixed(2)}
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
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          No items in cart
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {cart.length > 0 && (
                <div className="bg-gray-50 px-6 py-4">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleReceiveStock}
                disabled={!selectedSupplier || cart.length === 0 || !invoiceNumber}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                <Check className="h-5 w-5 mr-2" />
                Complete Receipt
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Payment Details</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Supplier</p>
              <p className="font-medium">{selectedSupplier?.name}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="font-medium">{invoiceNumber}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-xl font-bold">${calculateTotal().toFixed(2)}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
              <div className="flex flex-wrap gap-2">
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
                <button
                  onClick={() => setPaymentMethod('credit')}
                  className={`flex items-center px-3 py-2 rounded-md ${
                    paymentMethod === 'credit'
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mr-1" />
                  Credit
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteReceiving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Complete Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiveStock;