import React, { useState, useEffect } from 'react';
import { Download, Search, Filter } from 'lucide-react';
import { API_BASE_URL } from '../../../constants';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Medicine {
  product_id: string;
  product_name: string;
  product_category: string;
  current_quantity: number;
  product_price: number;
  unit?: string;
  expiry_date: string;
  batch_no: string;
}

const StockStatusReport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All'); // Filter for section type
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thresholds
  const LOW_STOCK_THRESHOLD = 10;
  const NEAR_EXPIRY_DAYS = 30;

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchMedicines();
    }
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const response = await fetch(`${API_BASE_URL}/api/medicines-cache`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      console.log('Raw response from /medicines-cache:', text);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(`Failed to fetch medicines: ${response.status} - ${text || 'No response data'}`);
      }
      if (!text) {
        setMedicines([]);
        return;
      }
      const rawData = JSON.parse(text);
      if (!Array.isArray(rawData)) throw new Error('Expected an array of medicines.');

      const parsedData: Medicine[] = rawData.map((item: any) => ({
        product_id: String(item.product_id),
        product_name: item.product_name || 'Unknown Product',
        product_category: item.product_category || 'N/A',
        current_quantity: parseInt(item.current_quantity, 10) || 0,
        product_price: parseFloat(item.product_price) || 0,
        unit: item.unit || 'N/A',
        expiry_date: item.expire_date || 'N/A',
        batch_no: item.batch_no || 'N/A',
      }));

      console.log('Parsed medicines:', parsedData);
      setMedicines(parsedData);
    } catch (err: any) {
      console.error('Fetch medicines error:', err);
      setError(err.message);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter medicines based on status
  const today = new Date();
  const nearExpiryThreshold = new Date();
  nearExpiryThreshold.setDate(today.getDate() + NEAR_EXPIRY_DAYS);

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.product_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.batch_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const expiredItems = filteredMedicines.filter(
    (m) => m.expiry_date !== 'N/A' && new Date(m.expiry_date) < today
  );
  const nearExpiringItems = filteredMedicines.filter(
    (m) =>
      m.expiry_date !== 'N/A' &&
      new Date(m.expiry_date) >= today &&
      new Date(m.expiry_date) <= nearExpiryThreshold
  );
  const lowStockItems = filteredMedicines.filter(
    (m) => m.current_quantity > 0 && m.current_quantity <= LOW_STOCK_THRESHOLD
  );
  const outOfStockItems = filteredMedicines.filter((m) => m.current_quantity === 0);

  // Section definitions
  const sections = [
    { title: 'Expired Items', items: expiredItems },
    { title: 'Near Expiring Items', items: nearExpiringItems },
    { title: 'Low Stock Items', items: lowStockItems },
    { title: 'Out of Stock Items', items: outOfStockItems },
  ];

  // Export functions
  const exportToPDF = (data: Medicine[], title: string) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    doc.setFontSize(18);
    doc.setTextColor('#2d3748');
    doc.text(title, margin, 20, { align: 'left' });

    doc.setFontSize(10);
    doc.setTextColor('#4a5568');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 30);
    doc.text(`Total Items: ${data.length}`, margin, 36);

    const tableData = data.map((item) => [
      item.product_id,
      item.product_name,
      item.product_category,
      item.current_quantity,
      item.product_price.toFixed(2),
      item.unit,
      item.expiry_date !== 'N/A' ? new Date(item.expiry_date).toLocaleDateString() : 'N/A',
      item.batch_no,
    ]);

    (doc as any).autoTable({
      head: [['ID', 'Name', 'Category', 'Qty', 'Price (Tsh)', 'Unit', 'Expiry Date', 'Batch No']],
      body: tableData,
      startY: 44,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2, textColor: '#4a5568' },
      headStyles: { fillColor: '#4a5568', textColor: '#ffffff', fontSize: 10 },
      alternateRowStyles: { fillColor: '#f7fafc' },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 },
      },
      didDrawPage: (data: any) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, {
          align: 'right',
        });
      },
    });

    doc.save(`${title.toLowerCase().replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = (data: Medicine[], title: string) => {
    const worksheetData = data.map((item) => ({
      'Product ID': item.product_id,
      'Name': item.product_name,
      'Category': item.product_category,
      'Quantity': item.current_quantity,
      'Price (Tsh)': item.product_price.toFixed(2),
      'Unit': item.unit,
      'Expiry Date': item.expiry_date !== 'N/A' ? new Date(item.expiry_date).toLocaleDateString() : 'N/A',
      'Batch No': item.batch_no,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    XLSX.writeFile(workbook, `${title.toLowerCase().replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderSection = (items: Medicine[], title: string) => (
    <section className="mb-10 bg-white p-6 rounded-lg shadow-sm border border-[#e2e8f0]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-[#2d3748]">{title}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => exportToPDF(items, title)}
            className="flex items-center px-4 py-2 bg-[#38a169] text-white rounded-md hover:bg-[#2f855a] disabled:bg-[#a0aec0] transition-colors"
            disabled={loading || items.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </button>
          <button
            onClick={() => exportToExcel(items, title)}
            className="flex items-center px-4 py-2 bg-[#4c8bf5] text-white rounded-md hover:bg-[#3b7ae0] disabled:bg-[#a0aec0] transition-colors"
            disabled={loading || items.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </button>
        </div>
      </div>
      <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e2e8f0]">
            <thead className="bg-[#f7fafc]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Price (Tsh)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Batch No</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {items.length > 0 ? (
                items.map((medicine) => (
                  <tr key={medicine.product_id} className="hover:bg-[#edf2f7] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">{medicine.product_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2d3748]">{medicine.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">{medicine.product_category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">{medicine.current_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">{medicine.product_price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">{medicine.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                      {medicine.expiry_date !== 'N/A' ? new Date(medicine.expiry_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">{medicine.batch_no}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-[#4a5568]">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  return (
    <div className="space-y-6 p-6 bg-[#f5f7fa] min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#2d3748]">Stock Status Report</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#a0aec0]" />
          </div>
          <input
            type="text"
            placeholder="Search medicines..."
            className="pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-md w-full focus:ring-[#4c8bf5] focus:border-[#4c8bf5] bg-white text-[#4a5568]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-[#a0aec0]" />
          </div>
          <select
            className="pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-md w-full focus:ring-[#4c8bf5] focus:border-[#4c8bf5] bg-white text-[#4a5568]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            disabled={loading}
          >
            <option value="All">All Sections</option>
            <option value="Expired Items">Expired Items</option>
            <option value="Near Expiring Items">Near Expiring Items</option>
            <option value="Low Stock Items">Low Stock Items</option>
            <option value="Out of Stock Items">Out of Stock Items</option>
          </select>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && <div className="text-center text-[#4a5568]">Loading stock data...</div>}
      {error && <div className="text-center text-red-700 bg-red-50 p-3 rounded-md">{error}</div>}

      {/* Sections */}
      <div className="space-y-10">
        {filterType === 'All'
          ? sections.map((section) => renderSection(section.items, section.title))
          : renderSection(
              sections.find((s) => s.title === filterType)!.items,
              filterType
            )}
      </div>
    </div>
  );
};

export default StockStatusReport;