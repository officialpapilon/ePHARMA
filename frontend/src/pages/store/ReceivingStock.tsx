import React, { useState } from 'react';
import { Search, Plus, Trash2, Save } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: '1', name: 'PharmaCorp', contact: '123-456-7890', email: 'orders@pharmacorp.com' },
    { id: '2', name: 'MediSupply', contact: '234-567-8901', email: 'sales@medisupply.com' },
    { id: '3', name: 'HealthDist', contact: '345-678-9012', email: 'info@healthdist.com' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [itemDetails, setItemDetails] = useState<{ [key: string]: { quantity: number; buyingPrice: number; expiryDate: string; batchNumber: string } }>({});
  const [deliveryDate, setDeliveryDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const products: Product[] = [
    { id: '1', name: 'Amoxicillin', stock: 300, price: 90000, category: 'Antibiotics', unit: 'Boxes' },
    { id: '2', name: 'Azithromycin', stock: 250, price: 120000, category: 'Antibiotics', unit: 'Boxes' },
    { id: '3', name: 'Chloramphenicol', stock: 200, price: 80000, category: 'Antibiotics', unit: 'Boxes' },
    { id: '4', name: 'CO-ARTESIANE', stock: 150, price: 135000, category: 'Antimalarials', unit: 'Boxes' },
    { id: '5', name: 'Diclofenac', stock: 400, price: 68000, category: 'Analgesics', unit: 'Boxes' },
    { id: '6', name: 'Diclopar', stock: 180, price: 77000, category: 'Analgesics', unit: 'Boxes' },
    { id: '7', name: 'Eye Ointment Tetracycline', stock: 120, price: 40000, category: 'Ophthalmic', unit: 'Tubes' },
    { id: '8', name: 'Fluoxetine', stock: 200, price: 115000, category: 'Antidepressants', unit: 'Boxes' },
    { id: '9', name: 'Turamide', stock: 150, price: 95000, category: 'Antidiabetics', unit: 'Boxes' },
    { id: '10', name: 'Inj Chlorpromazine', stock: 100, price: 160000, category: 'Antipsychotics', unit: 'Vials' },
  ];

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact.includes(searchTerm) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const addNewSupplier = () => {
    const newSupplierName = prompt('Enter new supplier name:');
    const newSupplierContact = prompt('Enter supplier contact:');
    const newSupplierEmail = prompt('Enter supplier email:');
    if (newSupplierName && newSupplierContact && newSupplierEmail) {
      const newSupplier = {
        id: (suppliers.length + 1).toString(),
        name: newSupplierName,
        contact: newSupplierContact,
        email: newSupplierEmail,
      };
      setSuppliers([...suppliers, newSupplier]);
      setSelectedSupplier(newSupplier);
    }
  };

  const addToCart = () => {
    selectedProducts.forEach(productId => {
      const product = products.find(p => p.id === productId);
      const details = itemDetails[productId] || { quantity: 1, buyingPrice: 0, expiryDate: '', batchNumber: '' };
      if (product && details.quantity > 0 && details.expiryDate && details.batchNumber && details.buyingPrice > 0) {
        const newItem = {
          id: Date.now().toString() + productId,
          productId,
          name: product.name,
          quantity: details.quantity,
          price: details.buyingPrice,
          expiryDate: details.expiryDate,
          batchNumber: details.batchNumber,
        };
        setCart(prevCart => [...prevCart, newItem]);
      }
    });
    setSelectedProducts([]);
    setItemDetails({});
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getSubtotal = (item: CartItem) => item.quantity * item.price;

  const saveTransaction = () => {
    if (selectedSupplier && cart.length > 0) {
      const transaction = {
        supplier: selectedSupplier.name,
        items: cart,
        deliveryDate,
        invoiceNumber,
        date: new Date().toISOString(),
      };
      console.log('Transaction saved:', transaction);
      alert('Transaction saved successfully!');
      setCart([]);
      setDeliveryDate('');
      setInvoiceNumber('');
    } else {
      alert('Please select a supplier and add items before saving.');
    }
  };

  return (
    <div className="receive-stock-container">
      <h1>Receive Stock</h1>

      <div className="main-grid">
        {/* Left Section - Supplier */}
        <div className="left-section">
          <div className="card">
            <h2>Supplier</h2>
            <div className="form-group">
              <label>Supplier *</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  value={selectedSupplier?.id || ''}
                  onChange={e => setSelectedSupplier(suppliers.find(s => s.id === e.target.value) || null)}
                  className="select-input"
                >
                  <option value="">Select</option>
                  {filteredSuppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
                <button onClick={addNewSupplier} className="add-supplier-btn">
                  <Plus size={14} /> Add Supplier
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Delivery Date *</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="form-group">
              <label>Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="text-input"
              />
            </div>
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
                onChange={e => setProductSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="scroll-container item-list">
              {filteredProducts.map(product => (
                <div key={product.id} className="item-option">
                  <input
                    type="checkbox"
                    name="selectedProduct"
                    id={product.id}
                    checked={selectedProducts.includes(product.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedProducts([...selectedProducts, product.id]);
                        setItemDetails(prev => ({
                          ...prev,
                          [product.id]: { quantity: 1, buyingPrice: 0, expiryDate: '', batchNumber: '' },
                        }));
                      } else {
                        setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                        setItemDetails(prev => {
                          const { [product.id]: _, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    className="checkbox-input"
                  />
                  <label htmlFor={product.id} className="item-label">{product.name}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Item Details */}
      <div className="bottom-section">
        <div className="card item-details">
          <h2>Item Details</h2>
          {selectedProducts.map(productId => {
            const product = products.find(p => p.id === productId);
            const details = itemDetails[productId] || { quantity: 1, buyingPrice: 0, expiryDate: '', batchNumber: '' };
            return (
              <div key={productId} className="item-detail-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Selected Item *</label>
                    <input
                      type="text"
                      value={product?.name || ''}
                      readOnly
                      className="read-only text-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit of Measure</label>
                    <input
                      type="text"
                      value={product?.unit || ''}
                      readOnly
                      className="read-only text-input"
                    />
                  </div>
                  <div className="form-group required">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={details.quantity}
                      onChange={e => setItemDetails(prev => ({
                        ...prev,
                        [productId]: { ...prev[productId], quantity: Math.max(1, parseInt(e.target.value) || 1) },
                      }))}
                      className="number-input"
                    />
                  </div>
                  <div className="form-group required">
                    <label>Buying Price (TSh) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={details.buyingPrice}
                      onChange={e => setItemDetails(prev => ({
                        ...prev,
                        [productId]: { ...prev[productId], buyingPrice: parseFloat(e.target.value) || 0 },
                      }))}
                      className="number-input"
                    />
                  </div>
                  <div className="form-group required">
                    <label>Expiry Date *</label>
                    <input
                      type="date"
                      value={details.expiryDate}
                      onChange={e => setItemDetails(prev => ({
                        ...prev,
                        [productId]: { ...prev[productId], expiryDate: e.target.value },
                      }))}
                      className="date-input"
                    />
                  </div>
                  <div className="form-group required">
                    <label>Batch Number *</label>
                    <input
                      type="text"
                      value={details.batchNumber}
                      onChange={e => setItemDetails(prev => ({
                        ...prev,
                        [productId]: { ...prev[productId], batchNumber: e.target.value },
                      }))}
                      className="text-input"
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <button className="add-btn" onClick={addToCart}>
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* Bottom Section - Stock Receiving History */}
      <div className="bottom-section">
        <div className="card">
          <h2>Stock Receiving History</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>S/N</th>
                  <th>Brand Name</th>
                  <th>UoM</th>
                  <th>Quantity</th>
                  <th>Batch Number</th>
                  <th>Buying Price (TSh)</th>
                  <th>Expiry Date</th>
                  <th>Subtotal (TSh)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={10}>No items added</td>
                  </tr>
                ) : (
                  cart.map((item, index) => (
                    <tr key={item.id}>
                      <td>{selectedSupplier?.name || 'N/A'}</td>
                      <td>{index + 1}</td>
                      <td>{item.name}</td>
                      <td>{products.find(p => p.id === item.productId)?.unit || ''}</td>
                      <td>{item.quantity}</td>
                      <td>{item.batchNumber}</td>
                      <td>{item.price.toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' })}</td>
                      <td>{item.expiryDate}</td>
                      <td>{getSubtotal(item).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' })}</td>
                      <td>
                        <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                          <Trash2 size={16} />
                        </button>
                        {index === cart.length - 1 && (
                          <button className="save-btn" onClick={saveTransaction}>
                            <Save size={16} /> Save
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .receive-stock-container {
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

        .select-input, .text-input, .number-input, .date-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
          font-size: 0.95em;
          transition: border-color 0.3s;
        }

        .select-input:focus, .text-input:focus, .number-input:focus, .date-input:focus {
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

        .checkbox-input {
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
          float: right;
        }

        .add-supplier-btn {
          background: #2ecc71;
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

        .add-supplier-btn:hover {
          background: #27ae60;
        }

        .add-btn:hover {
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

        .save-btn {
          background: #2ecc71;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px;
          cursor: pointer;
          font-size: 0.9em;
        }

        .remove-btn:hover {
          background: #c0392b;
        }

        .save-btn:hover {
          background: #27ae60;
        }

        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
          .add-btn, .add-supplier-btn {
            float: none;
            width: 100%;
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiveStock;