import React, { useState } from 'react';
import { Search, Plus, Save, AlertTriangle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  batchNumber: string;
}

interface AdjustmentRecord {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  adjustedStock: number;
  adjustmentType: 'increase' | 'decrease';
  reason: string;
  date: string;
  user: string;
}

const StockAdjustment = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentRecord[]>([
    {
      id: '1',
      productId: '1',
      productName: 'Paracetamol 500mg (Box of 100)',
      previousStock: 480,
      adjustedStock: 500,
      adjustmentType: 'increase',
      reason: 'Received additional stock from supplier',
      date: '2025-02-25 09:30 AM',
      user: 'John Doe'
    },
    {
      id: '2',
      productId: '3',
      productName: 'Ibuprofen 400mg (Box of 100)',
      previousStock: 420,
      adjustedStock: 400,
      adjustmentType: 'decrease',
      reason: 'Damaged inventory',
      date: '2025-02-24 02:15 PM',
      user: 'Jane Smith'
    },
    {
      id: '3',
      productId: '5',
      productName: 'Omeprazole 20mg (Box of 50)',
      previousStock: 240,
      adjustedStock: 250,
      adjustmentType: 'increase',
      reason: 'Inventory count correction',
      date: '2025-02-23 11:45 AM',
      user: 'John Doe'
    }
  ]);

  // Mock data
  const products: Product[] = [
    { id: '1', name: 'Paracetamol 500mg (Box of 100)', stock: 500, category: 'Analgesics', unit: 'Boxes', batchNumber: 'B12345' },
    { id: '2', name: 'Amoxicillin 250mg (Box of 50)', stock: 300, category: 'Antibiotics', unit: 'Boxes', batchNumber: 'B23456' },
    { id: '3', name: 'Ibuprofen 400mg (Box of 100)', stock: 400, category: 'Analgesics', unit: 'Boxes', batchNumber: 'B34567' },
    { id: '4', name: 'Cetirizine 10mg (Box of 100)', stock: 350, category: 'Antihistamines', unit: 'Boxes', batchNumber: 'B45678' },
    { id: '5', name: 'Omeprazole 20mg (Box of 50)', stock: 250, category: 'Proton Pump Inhibitors', unit: 'Boxes', batchNumber: 'B56789' },
    { id: '6', name: 'Metformin 500mg (Box of 100)', stock: 320, category: 'Antidiabetics', unit: 'Boxes', batchNumber: 'B67890' },
    { id: '7', name: 'Atorvastatin 10mg (Box of 30)', stock: 280, category: 'Statins', unit: 'Boxes', batchNumber: 'B78901' },
    { id: '8', name: 'Losartan 50mg (Box of 50)', stock: 220, category: 'Antihypertensives', unit: 'Boxes', batchNumber: 'B89012' },
    { id: '9', name: 'Salbutamol Inhaler (Box of 10)', stock: 150, category: 'Bronchodilators', unit: 'Boxes', batchNumber: 'B90123' },
    { id: '10', name: 'Fluoxetine 20mg (Box of 30)', stock: 180, category: 'Antidepressants', unit: 'Boxes', batchNumber: 'B01234' },
  ];

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveAdjustment = () => {
    if (selectedProduct && adjustmentQuantity > 0) {
      const previousStock = selectedProduct.stock;
      let adjustedStock = previousStock;
      
      if (adjustmentType === 'increase') {
        adjustedStock = previousStock + adjustmentQuantity;
      } else {
        adjustedStock = Math.max(0, previousStock - adjustmentQuantity);
      }
      
      // In a real application, this would update the product stock in the database
      
      // Add to adjustment history
      const newAdjustment: AdjustmentRecord = {
        id: (adjustmentHistory.length + 1).toString(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        previousStock,
        adjustedStock,
        adjustmentType,
        reason: adjustmentReason,
        date: new Date().toLocaleString(),
        user: 'Current User' // In a real app, this would be the logged-in user
      };
      
      setAdjustmentHistory([newAdjustment, ...adjustmentHistory]);
      
      // Reset form
      setSelectedProduct(null);
      setAdjustmentType('increase');
      setAdjustmentQuantity(0);
      setAdjustmentReason('');
      
      alert('Stock adjustment saved successfully!');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Stock Adjustment</h2>
      
      {/* Stock Adjustment Form */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-md font-medium mb-4">Adjust Stock</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Product
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="border rounded-md max-h-60 overflow-y-auto">
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
                            <p className="font-bold">{product.stock} {product.unit}</p>
                            <p className="text-xs text-gray-500">Batch: {product.batchNumber}</p>
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
          </div>
          
          {/* Adjustment Details */}
          <div className="space-y-4">
            {selectedProduct ? (
              <>
                <div className="p-4 bg-indigo-50 rounded-md">
                  <h4 className="font-medium">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-600">Current Stock: {selectedProduct.stock} {selectedProduct.unit}</p>
                  <p className="text-sm text-gray-600">Batch: {selectedProduct.batchNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adjustment Type
                  </label>
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="increase"
                        name="adjustmentType"
                        value="increase"
                        checked={adjustmentType === 'increase'}
                        onChange={() => setAdjustmentType('increase')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <label htmlFor="increase" className="ml-2 text-sm text-gray-700">
                        Increase
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="decrease"
                        name="adjustmentType"
                        value="decrease"
                        checked={adjustmentType === 'decrease'}
                        onChange={() => setAdjustmentType('decrease')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <label htmlFor="decrease" className="ml-2 text-sm text-gray-700">
                        Decrease
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Adjustment
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter reason for adjustment"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveAdjustment}
                    disabled={!selectedProduct || adjustmentQuantity <= 0 || !adjustmentReason}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Save Adjustment
                  </button>
                </div>
                
                {adjustmentType === 'decrease' && selectedProduct.stock < adjustmentQuantity && (
                  <div className="flex items-start p-4 bg-yellow-50 rounded-md">
                    <AlertTriangle className="text-yellow-500 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-yellow-800">Warning</h3>
                      <p className="text-sm text-yellow-700">
                        The adjustment quantity exceeds the current stock. The stock will be reduced to 0.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Plus className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Product Selected</h3>
                <p className="text-gray-500 mt-2 text-center">
                  Select a product from the list to adjust its stock.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Adjustment History */}
      <div>
        <h3 className="text-md font-medium mb-4">Adjustment History</h3>
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Previous Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adjusted Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adjustment
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adjustmentHistory.length > 0 ? (
                  adjustmentHistory.map(record => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.previousStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.adjustedStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.adjustmentType === 'increase' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.adjustmentType === 'increase' ? 'Increase' : 'Decrease'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {record.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.user}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No adjustment history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustment;