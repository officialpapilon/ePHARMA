import React, { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
// Dynamically import dependencies
const loadJSPDF = () => import('jspdf').then(module => module.default);
const loadAutoTable = () => import('jspdf-autotable').then(module => module.default);
const loadXLSX = () => import('xlsx').then(module => module);
const loadFileSaver = () => import('file-saver').then(module => module.saveAs);

interface Transaction {
  id: string;
  supplier: string;
  items: CartItem[];
  deliveryDate: string;
  invoiceNumber: string;
  date: string;
  user: string;
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

const StockReceivingReport = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      supplier: 'PharmaCorp',
      items: [
        { id: '1a', productId: '1', name: 'Amoxicillin', quantity: 10, price: 90000, expiryDate: '2025-12-01', batchNumber: 'B001' },
        { id: '1b', productId: '2', name: 'Azithromycin', quantity: 5, price: 120000, expiryDate: '2025-11-15', batchNumber: 'B002' },
      ],
      deliveryDate: '2025-03-01',
      invoiceNumber: 'INV001',
      date: '2025-03-01T10:30:00Z',
      user: 'John Doe',
    },
    {
      id: '2',
      supplier: 'MediSupply',
      items: [
        { id: '2a', productId: '3', name: 'Chloramphenicol', quantity: 15, price: 80000, expiryDate: '2025-12-10', batchNumber: 'B003' },
      ],
      deliveryDate: '2025-03-02',
      invoiceNumber: 'INV002',
      date: '2025-03-02T14:15:00Z',
      user: 'Jane Smith',
    },
    {
      id: '3',
      supplier: 'HealthDist',
      items: [
        { id: '3a', productId: '4', name: 'CO-ARTESIANE', quantity: 20, price: 135000, expiryDate: '2025-03-15', batchNumber: 'B004' },
      ],
      deliveryDate: '2025-03-03',
      invoiceNumber: 'INV003',
      date: '2025-03-03T09:00:00Z',
      user: 'Alice Johnson',
    },
  ]);

  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [itemFilter, setItemFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  useEffect(() => {
    let result = transactions;

    if (fromDate && toDate) {
      result = result.filter(t => {
        const deliveryDate = new Date(t.deliveryDate);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        return deliveryDate >= from && deliveryDate <= to;
      });
    } else if (fromDate) {
      result = result.filter(t => new Date(t.deliveryDate) >= new Date(fromDate));
    } else if (toDate) {
      result = result.filter(t => new Date(t.deliveryDate) <= new Date(toDate));
    }

    if (itemFilter) {
      result = result.filter(t => t.items.some(item => item.name.toLowerCase().includes(itemFilter.toLowerCase())));
    }
    if (supplierFilter) {
      result = result.filter(t => t.supplier.toLowerCase().includes(supplierFilter.toLowerCase()));
    }

    setFilteredTransactions(result);
  }, [fromDate, toDate, itemFilter, supplierFilter, transactions]);

  const exportToPDF = async () => {
    try {
      const jsPDF = await loadJSPDF();
      const autoTable = await loadAutoTable();
      const doc = new jsPDF();
      doc.setFontSize(12);
      doc.text('Stock Receiving Report', 10, 10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 20);

      const tableData = filteredTransactions.flatMap((transaction, index) =>
        transaction.items.map(item => [
          `T${index + 1}`,
          transaction.supplier,
          item.name,
          item.quantity,
          item.price.toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' }),
          item.batchNumber,
          item.expiryDate,
          transaction.deliveryDate,
          transaction.invoiceNumber,
          new Date(transaction.date).toLocaleString(),
          transaction.user,
        ])
      );

      autoTable(doc, {
        head: [['Transaction #', 'Supplier', 'Item', 'Quantity', 'Buying Price (TSh)', 'Batch Number', 'Expiry Date', 'Delivery Date', 'Invoice Number', 'Transaction Date', 'User']],
        body: tableData,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [241, 242, 246], textColor: [52, 73, 94], fontSize: 10 },
        bodyStyles: { textColor: [44, 62, 80], fontSize: 9 },
        columnWidth: 'auto',
      });

      doc.save('stock_receiving_report.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export to PDF. Please ensure dependencies are installed.');
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await loadXLSX();
      const saveAs = await loadFileSaver();
      const worksheetData = filteredTransactions.flatMap((transaction, index) =>
        transaction.items.map(item => ({
          'Transaction #': `T${index + 1}`,
          'Supplier': transaction.supplier,
          'Item': item.name,
          'Quantity': item.quantity,
          'Buying Price (TSh)': item.price.toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' }),
          'Batch Number': item.batchNumber,
          'Expiry Date': item.expiryDate,
          'Delivery Date': transaction.deliveryDate,
          'Invoice Number': transaction.invoiceNumber,
          'Transaction Date': new Date(transaction.date).toLocaleString(),
          'User': transaction.user,
        }))
      );

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'StockReceivingReport');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, 'stock_receiving_report.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please ensure dependencies are installed.');
    }
  };

  return (
    <div className="report-container">
      <h1>Stock Receiving Report</h1>

      <div className="filter-section">
        <div className="form-group">
          <label>Date Range</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="date-input"
              placeholder="From"
            />
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="date-input"
              placeholder="To"
            />
          </div>
        </div>
        <div className="form-group">
          <label>Item Filter</label>
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by item name"
              value={itemFilter}
              onChange={e => setItemFilter(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="form-group">
          <label>Supplier Filter</label>
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by supplier"
              value={supplierFilter}
              onChange={e => setSupplierFilter(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="export-buttons">
          <button onClick={exportToPDF} className="export-btn">
            <Download size={16} /> Export to PDF
          </button>
          <button onClick={exportToExcel} className="export-btn">
            <Download size={16} /> Export to Excel
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Transaction #</th>
              <th>Supplier Name</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Batch Number</th>
              <th>Buying Price (TSh)</th>
              <th>Expiry Date</th>
              <th>Delivery Date</th>
              <th>Invoice Number</th>
              <th>Transaction Date</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={11}>No transactions found</td>
              </tr>
            ) : (
              filteredTransactions.flatMap((transaction, index) =>
                transaction.items.map((item, i) => (
                  <tr key={`${transaction.id}-${item.id}`}>
                    <td>T{index + 1}</td>
                    <td>{transaction.supplier}</td>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.batchNumber}</td>
                    <td>{item.price.toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' })}</td>
                    <td>{item.expiryDate}</td>
                    <td>{transaction.deliveryDate}</td>
                    <td>{transaction.invoiceNumber}</td>
                    <td>{new Date(transaction.date).toLocaleString()}</td>
                    <td>{transaction.user}</td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .report-container {
          max-width: 100%;
          margin: 0;
          padding: 0 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f6fa;
        }
        
        h1 {
          color: #2c3e50;
          text-align: center;
          margin: 10px 0;
          font-size: 1.8em;
          padding: 10px 0;
          background: #fff;
          border-bottom: 1px solid #ecf0f1;
        }

        .filter-section {
          display: flex;
          gap: 20px;
          margin: 20px 0;
          padding: 15px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .form-group {
          flex: 1;
          margin: 0;
        }

        .form-group label {
          display: block;
          margin: 5px 0;
          color: #34495e;
          font-weight: 500;
        }

        .date-input, .search-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
          font-size: 0.95em;
          transition: border-color 0.3s;
        }

        .date-input:focus, .search-input:focus {
          border-color: #3498db;
          outline: none;
        }

        .search-container {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f1f2f6;
          border-radius: 4px;
        }

        .export-buttons {
          display: flex;
          gap: 10px;
        }

        .export-btn {
          background: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.9em;
        }

        .export-btn:hover {
          background: #2980b9;
        }

        .table-container {
          overflow-x: auto;
          margin: 20px 0;
          padding: 0;
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

        @media (max-width: 768px) {
          .filter-section {
            flex-direction: column;
          }
          .export-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default StockReceivingReport;