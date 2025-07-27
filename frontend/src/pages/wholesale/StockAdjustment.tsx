import React, { useState, useEffect } from 'react';
import { Search, Save, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../../../constants';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

interface Product {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  current_quantity: number;
  product_unit: string;
  batch_no: string;
  product_price: number;
}

interface ApiProductItem {
  id?: string | number;
  product_id?: string | number;
  product_name?: string;
  product_category?: string;
  current_quantity?: string | number;
  product_unit?: string;
  batch_no?: string;
  product_price?: string | number;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentRecord[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
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
          id: item.id?.toString() || item.product_id?.toString(),
          product_id: item.product_id?.toString(),
          product_name: item.product_name || 'Unknown Product',
          product_category: item.product_category || 'Unknown Category',
          current_quantity: parseInt(item.current_quantity as string) || 0,
          product_unit: 'Units', // Default value since product_unit doesn't exist in API
          batch_no: item.batch_no || 'N/A',
          product_price: parseFloat(item.product_price as string) || 0,
        }));
        setProducts(mappedProducts);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdjustment = async () => {
    if (!selectedProduct || adjustmentQuantity <= 0 || !adjustmentReason.trim()) {
      setError('Please select a product, enter a valid quantity, and provide a reason');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const adjustmentData = {
        product_id: selectedProduct.product_id,
        adjustment_type: adjustmentType,
        quantity: adjustmentQuantity,
        reason: adjustmentReason,
        previous_quantity: selectedProduct.current_quantity,
        new_quantity: adjustmentType === 'increase' 
          ? selectedProduct.current_quantity + adjustmentQuantity
          : Math.max(0, selectedProduct.current_quantity - adjustmentQuantity)
      };

      const response = await fetch(`${API_BASE_URL}/api/stock-adjustments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(adjustmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save adjustment');
      }

      const result = await response.json();
      
      if (result.success) {
        // Add to adjustment history
        const newAdjustment: AdjustmentRecord = {
          id: Date.now().toString(),
          productId: selectedProduct.id,
          productName: selectedProduct.product_name,
          previousStock: selectedProduct.current_quantity,
          adjustedStock: adjustmentData.new_quantity,
          adjustmentType,
          reason: adjustmentReason,
          date: new Date().toLocaleString(),
          user: 'Current User' // In a real app, this would be the logged-in user
        };
        
        setAdjustmentHistory([newAdjustment, ...adjustmentHistory]);
        
        // Update the product's current quantity in the list
        setProducts(products.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, current_quantity: adjustmentData.new_quantity }
            : p
        ));
        
        // Reset form
        setSelectedProduct(null);
        setAdjustmentType('increase');
        setAdjustmentQuantity(0);
        setAdjustmentReason('');
        setSuccess('Stock adjustment saved successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'Failed to save adjustment');
      }
    } catch (err) {
      console.error('Save adjustment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save adjustment');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.batch_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && products.length === 0) {
    return <LoadingSpinner overlay message="Loading products..." />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Stock Adjustment</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <Save className="h-5 w-5" />
          {success}
        </div>
      )}
      
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
                        onClick={() => setSelectedProduct(product)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 ${
                          selectedProduct?.id === product.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">{product.product_name}</div>
                        <div className="text-sm text-gray-500">
                          {product.product_category} • Stock: {product.current_quantity} {product.product_unit}
                        </div>
                        <div className="text-xs text-gray-400">Batch: {product.batch_no}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-3 text-gray-500">No products found</div>
              )}
            </div>
          </div>

          {/* Adjustment Details */}
          <div className="space-y-4">
            {selectedProduct && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">Selected Product</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Name:</strong> {selectedProduct.product_name}</p>
                  <p><strong>Category:</strong> {selectedProduct.product_category}</p>
                  <p><strong>Current Stock:</strong> {selectedProduct.current_quantity} {selectedProduct.product_unit}</p>
                  <p><strong>Batch:</strong> {selectedProduct.batch_no}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adjustment Type
              </label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as 'increase' | 'decrease')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="increase">Increase Stock</option>
                <option value="decrease">Decrease Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Enter reason for adjustment"
              />
            </div>

            <button
              onClick={handleSaveAdjustment}
              disabled={!selectedProduct || adjustmentQuantity <= 0 || !adjustmentReason.trim() || loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Adjustment
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Adjustment History */}
      {adjustmentHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-md font-medium mb-4">Recent Adjustments</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adjustmentHistory.map((adjustment) => (
                  <tr key={adjustment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {adjustment.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        adjustment.adjustmentType === 'increase' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {adjustment.adjustmentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {adjustment.previousStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {adjustment.adjustedStock}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {adjustment.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {adjustment.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAdjustment;