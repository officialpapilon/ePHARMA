import React, { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  unit: string;
  price: number;
  created_by: string;
}

const StockTakingReport = () => {
  const [stockTakings, setStockTakings] = useState<StockTaking[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [nameSearch, setNameSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [createdBySearch, setCreatedBySearch] = useState('');
  const [limit, setLimit] = useState<number | 'all'>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchMedicines();
      fetchStockTakings();
    }
  }, [limit]);

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
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
      }
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Expected an array of medicines');
      const mappedMedicines = data.map((item: any) => ({
        id: item.id || item.product_id,
        name: item.product_name || 'Unknown Medicine',
        category: item.product_category || 'Medicine',
        unit: item.unit || 'Unit',
        price: parseFloat(item.product_price) || 0,
        created_by: item.created_by?.toString() || 'Unknown',
      }));
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
      const url = limit === 'all' 
        ? `${API_BASE_URL}/api/stock-taking`
        : `${API_BASE_URL}/api/stock-taking?limit=${limit}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
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

  const exportToExcel = () => {
    const reportData = filteredStockTakings.flatMap((stock) =>
      stock.products.flatMap((product) =>
        product.batches.map((batch) => ({
          'Stock Taking ID': stock.id,
          'Product Name': medicines.find((m) => m.id === product.product_id)?.name || 'Unknown',
          'Category': medicines.find((m) => m.id === product.product_id)?.category || 'Unknown',
          'Unit': medicines.find((m) => m.id === product.product_id)?.unit || 'Unknown',
          'Batch Number': batch.batch_no,
          'Quantity': batch.product_quantity,
          'Manufacture Date': batch.manufacture_date,
          'Expiry Date': batch.expire_date,
          'Created By': stock.created_by,
          'Created At': new Date(stock.created_at).toLocaleString(),
          'Updated At': new Date(stock.updated_at).toLocaleString(),
        }))
      )
    );

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Taking Report');
    XLSX.writeFile(workbook, `Stock_Taking_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Stock Taking Report', 14, 10);

    const tableData = filteredStockTakings.flatMap((stock) =>
      stock.products.flatMap((product) =>
        product.batches.map((batch) => [
          stock.id.toString(),
          medicines.find((m) => m.id === product.product_id)?.name || 'Unknown',
          medicines.find((m) => m.id === product.product_id)?.category || 'Unknown',
          medicines.find((m) => m.id === product.product_id)?.unit || 'Unknown',
          batch.batch_no,
          batch.product_quantity.toString(),
          batch.manufacture_date,
          batch.expire_date,
          stock.created_by,
          new Date(stock.created_at).toLocaleString(),
          new Date(stock.updated_at).toLocaleString(),
        ])
      )
    );

    (doc as any).autoTable({
      head: [['Stock Taking ID', 'Product Name', 'Category', 'Unit', 'Batch Number', 'Quantity', 'Manufacture Date', 'Expiry Date', 'Created By', 'Created At', 'Updated At']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 73, 94] },
    });

    doc.save(`Stock_Taking_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredStockTakings = stockTakings.filter((stock) =>
    stock.products.some((product) => {
      const medicine = medicines.find((m) => m.id === product.product_id);
      return (
        (nameSearch === '' || medicine?.name.toLowerCase().includes(nameSearch.toLowerCase())) &&
        (categorySearch === '' || medicine?.category.toLowerCase().includes(categorySearch.toLowerCase())) &&
        (createdBySearch === '' || stock.created_by.toLowerCase().includes(createdBySearch.toLowerCase()))
      );
    })
  );

  return (
    <div className="stock-taking-report-container">
      <h1>Stock Taking Report</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="controls">
        <div className="search-filters">
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by Medicine  name"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="search-input"
              disabled={loading}
            />
          </div>
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by Category"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="search-input"
              disabled={loading}
            />
          </div>
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by User"
              value={createdBySearch}
              onChange={(e) => setCreatedBySearch(e.target.value)}
              className="search-input"
              disabled={loading}
            />
          </div>
        </div>
        <div className="limit-filter">
          <label>Show: </label>
          <select
            value={limit}
            onChange={(e) => setLimit(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="limit-select"
            disabled={loading}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="export-buttons">
          <button
            onClick={exportToExcel}
            className="export-btn excel"
            disabled={loading || filteredStockTakings.length === 0}
          >
            <Download size={16} /> Excel
          </button>
          <button
            onClick={exportToPDF}
            className="export-btn pdf"
            disabled={loading || filteredStockTakings.length === 0}
          >
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="report-section">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : filteredStockTakings.length === 0 ? (
          <div className="no-data">No stock taking records found</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
              <tr>
                <th>S/N</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Batch Number</th>
                <th>Quantity</th>
                <th>Manufacture Date</th>
                <th>Expiry Date</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Updated At</th>
              </tr>
              </thead>
              <tbody>
              {filteredStockTakings.flatMap((stock, stockIndex) =>
                stock.products.flatMap((product, productIndex) =>
                product.batches.map((batch, batchIndex) => {
                  const serialNumber = stockIndex * 1 + productIndex * 1 + batchIndex + 1;
                  return (
                  <tr key={`${stock.id}-${product.product_id}-${batchIndex}`}>
                    <td>{serialNumber}</td>
                    <td>{medicines.find((m) => m.id === product.product_id)?.name || 'Unknown'}</td>
                    <td>{medicines.find((m) => m.id === product.product_id)?.category || 'Unknown'}</td>
                    <td>{medicines.find((m) => m.id === product.product_id)?.unit || 'Unknown'}</td>
                    <td>{batch.batch_no}</td>
                    <td>{batch.product_quantity}</td>
                    <td>{batch.manufacture_date}</td>
                    <td>{batch.expire_date}</td>
                    <td>{stock.created_by}</td>
                    <td>{new Date(stock.created_at).toLocaleString()}</td>
                    <td>{new Date(stock.updated_at).toLocaleString()}</td>
                  </tr>
                  );
                })
                )
              )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .stock-taking-report-container {
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
        .controls {
          margin: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          align-items: center;
        }
        .search-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          flex: 2;
        }
        .search-container {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: #f1f2f6;
          border-radius: 4px;
          flex: 1;
          min-width: 200px;
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
        .limit-filter {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .limit-select {
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.95em;
        }
        .export-buttons {
          display: flex;
          gap: 10px;
        }
        .export-btn {
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 0.9em;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .export-btn.excel {
          background: #2ecc71;
        }
        .export-btn.pdf {
          background: #e74c3c;
        }
        .export-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        .export-btn.excel:hover:not(:disabled) {
          background: #27ae60;
        }
        .export-btn.pdf:hover:not(:disabled) {
          background: #c0392b;
        }
        .report-section {
          margin: 0 20px 20px 20px;
        }
        .loading, .no-data {
          text-align: center;
          padding: 20px;
          color: #7f8c8d;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .table-container {
          overflow-x: auto;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95em;
        }
        th, td {
          padding: 12px;
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
        @media (max-width: 768px) {
          .controls {
            flex-direction: column;
            align-items: stretch;
          }
          .search-filters {
            flex-direction: column;
          }
          .search-container {
            width: 100%;
          }
          .export-buttons {
            flex-direction: column;
            width: 100%;
          }
          .export-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default StockTakingReport;