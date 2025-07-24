import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Save, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../../../constants';

interface Batch {
  batch_no: string;
  product_quantity: number;
  manufacture_date: string;
  expire_date: string;
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
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Expected an array of medicines');
      const mappedMedicines = data.map((item: any) => ({
        id: item.id || item.product_id,
        name: item.product_name || 'Unknown Medicine',
        category: item.product_category || 'Medicine',
        product_unit: item.product_unit || 'Unit',
        price: parseFloat(item.product_price) || 0,
        created_by: item.created_by?.toString() || 'Unknown',
      }));
      if (mappedMedicines.some((m) => !m.id)) {
        throw new Error('Some medicines are missing an id/product_id');
      }
      console.log('Mapped medicines:', mappedMedicines);
      setMedicines(mappedMedicines);
    } catch (err: any) {
      console.error('Fetch medicines error:', err);
      setError('Unable to fetch medicines: ' + err.message);
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
    } catch (err: any) {
      console.error('Fetch stock-taking error:', err);
      setError('Unable to fetch stock-taking records: ' + err.message);
      setStockTakings([]);
    } finally {
      setLoading(false);
    }
  };

  const updateMedicineCache = async (products: Product[]) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found for cache update');
      return; // Silently exit if no token
    }

    for (const product of products) {
      const totalQuantity = product.batches.reduce((sum, batch) => sum + batch.product_quantity, 0);
      const latestBatch = product.batches[product.batches.length - 1];
      const payload = {
        product_id: product.product_id,
        current_quantity: totalQuantity,
        manufacture_date: latestBatch.manufacture_date,
        expire_date: latestBatch.expire_date,
      };
      console.log('Updating cache with payload:', JSON.stringify(payload, null, 2));

      try {
        const response = await fetch(`${API_BASE_URL}/api/medicines-cache`, {
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
        console.log(`Raw response from /api/medicines-cache for product ${product.product_id}:`, text);
        if (!response.ok) {
          console.error(`Cache update failed for product ${product.product_id}: HTTP ${response.status}: ${text}`);
          // Do NOT setError here to keep it silent for the user
        }
      } catch (err: any) {
        console.error('Update cache error for product', product.product_id, ':', err.message);
        // Do NOT setError here to keep it silent for the user
      }
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

      // Attempt to update cache, but don’t let it affect the UI if it fails
      await updateMedicineCache(cart);

      // Reset UI regardless of cache update success
      setCart([]);
      setSelectedProductId(null);
      setItemDetails({ batches: [] });
    } catch (err: any) {
      console.error('Add stock-taking error:', err);
      setError(err.message || 'Unable to add stock-taking record.');
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
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

        const productsMap = new Map<number, Batch[]>();
        jsonData.forEach((row: any) => {
          const productId = parseInt(row.product_id);
          if (!isNaN(productId)) {
            if (!productsMap.has(productId)) {
              productsMap.set(productId, []);
            }
            productsMap.get(productId)!.push({
              batch_no: row.batch_no || 'Unknown',
              product_quantity: parseInt(row.product_quantity) || 0,
              manufacture_date: row.manufacture_date || '',
              expire_date: row.expire_date || '',
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

        await updateMedicineCache(payload.products);

        fetchStockTakings();
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error('Upload Excel error:', err);
      setError(err.message || 'Unable to upload Excel file.');
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
    if (batches.length === 0 || !batches.every((b) => b.batch_no && b.product_quantity > 0 && b.manufacture_date && b.expire_date)) {
      setError('Please fill in all batch details correctly.');
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
      batches: [...prev.batches, { batch_no: '', product_quantity: 0, manufacture_date: '', expire_date: '' }],
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
            <p className="note">Columns: product_id, batch_no, product_quantity, manufacture_date, expire_date</p>
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
                          batches: newId !== null ? [{ batch_no: '', product_quantity: 0, manufacture_date: '', expire_date: '' }] : []
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
                  <th>Created By</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 && filteredStockTakings.length === 0 ? (
                  <tr>
                    <td colSpan={9}>No items added</td>
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

      <style jsx>{`
        .stock-taking-container {
          max-width: 100%;
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f6fa;
          border-top: 5px solid #e67e22;
        }
        h1 {
          color: #2c3e50;
          text-align: center;
          margin: 10px 0;
          font-size: 1.8em;
          padding: 10px 0;
          background: #fff;
        }
        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 10px;
          margin: 10px 20px;
          border-radius: 4px;
          text-align: center;
        }
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 0 20px 20px 20px;
          padding: 0;
        }
        .card {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 15px;
          margin: 0;
        }
        h2 {
          color: #34495e;
          margin: 0 0 15px 0;
          font-size: 1.3em;
          border-bottom: 1px solid #ecf0f1;
          padding-bottom: 10px;
        }
        .form-group {
          margin: 10px 0;
        }
        .form-group label {
          display: block;
          margin: 5px 0;
          color: #34495e;
          font-weight: 500;
        }
        .text-input, .number-input, .date-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
          font-size: 0.95em;
          transition: border-color 0.3s;
        }
        .text-input:focus, .number-input:focus, .date-input:focus {
          border-color: #3498db;
          outline: none;
        }
        .required label:after {
          content: ' *';
          color: #e74c3c;
        }
        .read-only {
          background: #f9f9f9;
          color: #7f8c8d;
        }
        .search-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 10px 0;
          padding: 8px;
          background: #f1f2f6;
          border-radius: 4px;
        }
        .search-input {
          border: none;
          background: transparent;
          width: 100%;
          font-size: 0.95em;
        }
        .search-input:focus {
          outline: none;
        }
        .scroll-container {
          max-height: 300px;
          overflow-y: auto;
          padding: 0;
        }
        .item-list {
          display: flex;
          flex-direction: column;
        }
        .item-option {
          display: flex;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .radio-input {
          margin: 0 8px 0 0;
          transform: scale(0.9);
        }
        .item-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.95em;
          color: #2c3e50;
        }
        .item-detail-form {
          margin-bottom: 20px;
          border: 1px solid #eee;
          padding: 10px;
          border-radius: 4px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 10px 0;
        }
        .add-btn {
          width: auto;
          background: #3498db;
          padding: 6px 12px;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        .add-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        .add-btn:hover:not(:disabled) {
          background: #2980b9;
        }
        .table-container {
          overflow-x: auto;
          margin-top: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95em;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background: #f1f2f6;
          color: #34495e;
          font-weight: 600;
        }
        td {
          color: #2c3e50;
        }
        .remove-btn {
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px;
          cursor: pointer;
          font-size: 0.9em;
          margin-right: 5px;
        }
        .remove-btn:hover {
          background: #c0392b;
        }
        .save-btn {
          background: #2ecc71;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px;
          cursor: pointer;
          font-size: 0.9em;
        }
        .save-btn:hover {
          background: #27ae60;
        }
        .note {
          font-size: 0.85em;
          color: #7f8c8d;
          margin-top: 5px;
        }
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
          .add-btn {
            width: 100%;
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default StockTaking;