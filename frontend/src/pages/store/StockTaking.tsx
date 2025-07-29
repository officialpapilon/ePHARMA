import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../../../constants';
import './StockTaking.css';

interface Batch {
  batch_no: string;
  product_quantity: number;
  manufacture_date: string;
  expire_date: string;
  buying_price: number;
}

interface Product {
  product_id: number;
  batches: Batch[];
}

interface StockTaking {
  id: number;
  products: Product[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Medicine {
  id: number;
  name: string;
  category: string;
  product_unit: string;
  price: number;
  created_by: string;
}

interface ApiResponse {
  success: boolean;
  data: MedicineApiItem[];
  message: string;
}

interface MedicineApiItem {
  id?: number;
  product_id?: number;
  product_name?: string;
  product_category?: string;
  product_unit?: string;
  product_price?: string | number;
  created_by?: number | string;
}

interface ExcelRow {
  product_id?: string | number;
  batch_no?: string;
  product_quantity?: string | number;
  manufacture_date?: string;
  expire_date?: string;
  buying_price?: string | number;
}

const StockTaking = () => {
  const [stockTakings, setStockTakings] = useState<StockTaking[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [cart, setCart] = useState<Product[]>([]);
  const [itemDetails, setItemDetails] = useState<{ batches: Batch[] }>({ batches: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchMedicines();
      fetchStockTakings();
    }
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/medicines`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      console.log('Raw response from /api/medicines:', text);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
      }
      if (!text) {
        setMedicines([]);
        return;
      }
      const data: ApiResponse = JSON.parse(text);
      
      // Handle both direct array and wrapped response formats
      let medicinesData: MedicineApiItem[];
      if (data.success && Array.isArray(data.data)) {
        // New API format with success/data wrapper
        medicinesData = data.data;
      } else if (Array.isArray(data)) {
        // Direct array format (fallback)
        medicinesData = data;
      } else {
        throw new Error('Invalid API response format');
      }
      
      const mappedMedicines = medicinesData.map((item: MedicineApiItem) => ({
        id: item.id || item.product_id || 0,
        name: item.product_name || 'Unknown Medicine',
        category: item.product_category || 'Medicine',
        product_unit: item.product_unit || 'Unit',
        price: parseFloat(String(item.product_price)) || 0,
        created_by: item.created_by?.toString() || 'Unknown',
      }));
      if (mappedMedicines.some((m) => !m.id)) {
        throw new Error('Some medicines are missing an id/product_id');
      }
      console.log('Mapped medicines:', mappedMedicines);
      setMedicines(mappedMedicines);
    } catch (err: unknown) {
      console.error('Fetch medicines error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Unable to fetch medicines: ' + errorMessage);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockTakings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/stock-taking`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      console.log('Raw response from /api/stock-taking:', text);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
      }
      if (!text) {
        setStockTakings([]);
        return;
      }
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid data format');
      setStockTakings(data);
    } catch (err: unknown) {
      console.error('Fetch stock-taking error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Unable to fetch stock-taking records: ' + errorMessage);
      setStockTakings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStockTaking = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      if (cart.length === 0) {
        throw new Error('Please add at least one product with batches.');
      }

      const payload = {
        products: cart.map((item) => ({
          product_id: item.product_id,
          batches: item.batches,
        })),
        created_by: localStorage.getItem('username') || 'Admin',
      };
      console.log('Payload being sent to /api/stock-taking:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/stock-taking`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      console.log('Raw response from /api/stock-taking POST:', text);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
      }
      const addedStockTaking = JSON.parse(text);
      setStockTakings([...stockTakings, addedStockTaking]);

      // Reset UI
      setCart([]);
      setSelectedProductId(null);
      setItemDetails({ batches: [] });
    } catch (err: unknown) {
      console.error('Add stock-taking error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage || 'Unable to add stock-taking record.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

        const productsMap = new Map<number, Batch[]>();
        jsonData.forEach((row: ExcelRow) => {
          const productId = parseInt(String(row.product_id));
          if (!isNaN(productId)) {
            if (!productsMap.has(productId)) {
              productsMap.set(productId, []);
            }
            productsMap.get(productId)!.push({
              batch_no: row.batch_no || 'Unknown',
              product_quantity: parseInt(String(row.product_quantity)) || 0,
              manufacture_date: row.manufacture_date || '',
              expire_date: row.expire_date || '',
              buying_price: parseFloat(String(row.buying_price)) || 0,
            });
          }
        });

        if (productsMap.size === 0) {
          throw new Error('No valid product IDs found in the Excel file.');
        }

        const payload = {
          products: Array.from(productsMap.entries()).map(([product_id, batches]) => ({
            product_id,
            batches,
          })),
          created_by: localStorage.getItem('username') || 'Admin',
        };
        console.log('Payload being sent to /api/stock-taking:', JSON.stringify(payload, null, 2));

        const response = await fetch(`${API_BASE_URL}/api/stock-taking`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(payload),
        });
        const text = await response.text();
        console.log('Raw response from /api/stock-taking POST:', text);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
        }
        const addedStockTaking = JSON.parse(text);
        setStockTakings([...stockTakings, addedStockTaking]);

        fetchStockTakings();
      };
      reader.readAsArrayBuffer(file);
    } catch (err: unknown) {
      console.error('Upload Excel error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage || 'Unable to upload Excel file.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (selectedProductId === null) {
      setError('Please select a product.');
      return;
    }
    const product = medicines.find((p) => p.id === selectedProductId);
    if (!product) {
      setError('Selected product not found.');
      return;
    }
    const batches = itemDetails.batches;
    if (batches.length === 0 || !batches.every((b) => b.batch_no && b.product_quantity > 0 && b.manufacture_date && b.expire_date && b.buying_price > 0)) {
      setError('Please fill in all batch details correctly including buying price.');
      return;
    }
    setCart((prevCart) => [...prevCart, { product_id: selectedProductId, batches }]);
    setSelectedProductId(null);
    setItemDetails({ batches: [] });
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const addBatch = () => {
    setItemDetails((prev) => ({
      batches: [...prev.batches, { batch_no: '', product_quantity: 0, manufacture_date: '', expire_date: '', buying_price: 0 }],
    }));
  };

  const filteredMedicines = medicines.filter((medicine) =>
    medicine.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    medicine.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const filteredStockTakings = stockTakings.filter((stock) =>
    stock.products.some((product) =>
      medicines.find((m) => m.id === product.product_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || stock.created_by.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="stock-taking-container">
      <h1>Stock Taking</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="main-grid">
        {/* Left Section - Upload */}
        <div className="left-section">
          <div className="card">
            <h2>Upload Excel</h2>
            <div className="form-group">
              <label>Upload File</label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleUploadExcel}
                className="text-input"
                disabled={loading}
              />
            </div>
            <p className="note">Columns: product_id, batch_no, product_quantity, manufacture_date, expire_date, buying_price</p>
          </div>
        </div>

        {/* Right Section - Select Item */}
        <div className="right-section">
          <div className="card">
            <h2>Select Item</h2>
            <div className="search-container">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="search-input"
                disabled={loading}
              />
            </div>
            <div className="scroll-container item-list">
              {filteredMedicines.length === 0 ? (
                <p>No medicines available</p>
              ) : (
                filteredMedicines.map((medicine) => (
                  <div key={medicine.id} className="item-option">
                    <input
                      type="radio"
                      id={`product-${medicine.id}`}
                      name="product-selection"
                      checked={selectedProductId === medicine.id}
                      onChange={(e) => {
                        const newId = e.target.checked ? medicine.id : null;
                        console.log(`Radio changed: selectedProductId set to ${newId} (${medicine.name})`);
                        setSelectedProductId(newId);
                        setItemDetails({
                          batches: newId !== null ? [{ batch_no: '', product_quantity: 0, manufacture_date: '', expire_date: '', buying_price: 0 }] : []
                        });
                      }}
                      className="radio-input"
                      disabled={loading}
                    />
                    <label htmlFor={`product-${medicine.id}`} className="item-label">{medicine.name}</label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Item Details */}
      <div className="bottom-section">
        <div className="card item-details">
          <h2>Item Details</h2>
          {selectedProductId !== null ? (
            <div className="item-detail-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Selected Item *</label>
                  <input
                    type="text"
                    value={medicines.find((p) => p.id === selectedProductId)?.name || 'Unknown'}
                    readOnly
                    className="read-only text-input"
                  />
                </div>
                <div className="form-group">
                  <label>Unit of Measure</label>
                  <input
                    type="text"
                    value={medicines.find((p) => p.id === selectedProductId)?.product_unit || ''}
                    readOnly
                    className="read-only text-input"
                  />
                </div>
                {itemDetails.batches.map((batch, batchIndex) => (
                  <React.Fragment key={batchIndex}>
                    <div className="form-group required">
                      <label>Batch Number *</label>
                      <input
                        type="text"
                        value={batch.batch_no}
                        onChange={(e) =>
                          setItemDetails((prev) => ({
                            batches: prev.batches.map((b, i) =>
                              i === batchIndex ? { ...b, batch_no: e.target.value } : b
                            ),
                          }))
                        }
                        className="text-input"
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group required">
                      <label>Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={batch.product_quantity}
                        onChange={(e) =>
                          setItemDetails((prev) => ({
                            batches: prev.batches.map((b, i) =>
                              i === batchIndex ? { ...b, product_quantity: parseInt(e.target.value) || 0 } : b
                            ),
                          }))
                        }
                        className="number-input"
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group required">
                      <label>Manufacture Date *</label>
                      <input
                        type="date"
                        value={batch.manufacture_date}
                        onChange={(e) =>
                          setItemDetails((prev) => ({
                            batches: prev.batches.map((b, i) =>
                              i === batchIndex ? { ...b, manufacture_date: e.target.value } : b
                            ),
                          }))
                        }
                        className="date-input"
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group required">
                      <label>Expiry Date *</label>
                      <input
                        type="date"
                        value={batch.expire_date}
                        onChange={(e) =>
                          setItemDetails((prev) => ({
                            batches: prev.batches.map((b, i) =>
                              i === batchIndex ? { ...b, expire_date: e.target.value } : b
                            ),
                          }))
                        }
                        className="date-input"
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group required">
                      <label>Buying Price *</label>
                      <input
                        type="number"
                        min="0"
                        value={batch.buying_price}
                        onChange={(e) =>
                          setItemDetails((prev) => ({
                            batches: prev.batches.map((b, i) =>
                              i === batchIndex ? { ...b, buying_price: parseFloat(e.target.value) || 0 } : b
                            ),
                          }))
                        }
                        className="number-input"
                        disabled={loading}
                      />
                    </div>
                    {itemDetails.batches.length > 1 && (
                      <button
                        className="remove-btn"
                        onClick={() =>
                          setItemDetails((prev) => ({
                            batches: prev.batches.filter((_, i) => i !== batchIndex),
                          }))
                        }
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <button className="add-btn" onClick={addBatch} disabled={loading}>
                <Plus size={14} /> Add Batch
              </button>
            </div>
          ) : (
            <p>No item selected</p>
          )}
          <button
            className="add-btn"
            onClick={addToCart}
            disabled={loading || selectedProductId === null}
          >
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* Bottom Section - Stock Taking History */}
      <div className="bottom-section">
        <div className="card">
          <h2>Stock Taking History</h2>
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              disabled={loading}
            />
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Batch Number</th>
                  <th>Quantity</th>
                  <th>Manufacture Date</th>
                  <th>Expiry Date</th>
                  <th>Buying Price</th>
                  <th>Created By</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 && filteredStockTakings.length === 0 ? (
                  <tr>
                    <td colSpan={10}>No items added</td>
                  </tr>
                ) : (
                    <>
                    {cart.map((item, index) =>
                      item.batches.map((batch, batchIndex) => (
                      <tr key={`${item.product_id}-${batchIndex}`}>
                        <td>{index + batchIndex + 1}</td>
                        <td>N/A</td>
                        <td>{medicines.find((m) => m.id === item.product_id)?.name || 'Unknown'}</td>
                        <td>{batch.batch_no}</td>
                        <td>{batch.product_quantity}</td>
                        <td>{batch.manufacture_date}</td>
                        <td>{batch.expire_date}</td>
                        <td>Tsh {(batch.buying_price || 0).toLocaleString()}</td>
                        <td>{localStorage.getItem('username') || 'Admin'}</td>
                        <td>{new Date().toLocaleString()}</td>
                        <td>
                        <button
                          className="remove-btn"
                          onClick={() => removeFromCart(item.product_id)}
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                        {index === cart.length - 1 && batchIndex === item.batches.length - 1 && (
                          <button className="save-btn" onClick={handleAddStockTaking} disabled={loading}>
                          <Save size={16} /> Save
                          </button>
                        )}
                        </td>
                      </tr>
                      ))
                    )}
                    {filteredStockTakings.map((stock, stockIndex) =>
                      stock.products.map((product) =>
                      product.batches.map((batch, batchIndex) => {
                        const cartItemsCount = cart.reduce((sum, item) => sum + item.batches.length, 0);
                        const currentIndex = stockIndex + batchIndex + cartItemsCount + 1;
                        return (
                        <tr key={`${stock.id}-${product.product_id}-${batchIndex}`}>
                          <td>{currentIndex}</td>
                          <td>{stock.id}</td>
                          <td>{medicines.find((m) => m.id === product.product_id)?.name || 'Unknown'}</td>
                          <td>{batch.batch_no}</td>
                          <td>{batch.product_quantity}</td>
                          <td>{batch.manufacture_date}</td>
                          <td>{batch.expire_date}</td>
                          <td>Tsh {(batch.buying_price || 0).toLocaleString()}</td>
                          <td>{stock.created_by}</td>
                          <td>{new Date(stock.created_at).toLocaleString()}</td>
                          <td></td>
                        </tr>
                        );
                      })
                      )
                    )}
                    </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTaking;