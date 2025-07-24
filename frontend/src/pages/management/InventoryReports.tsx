import React, { useState, useEffect } from 'react';
import { Calendar, Download, Filter, Search, BarChart3, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { API_BASE_URL } from '../../../constants'; // Adjust path as needed
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTheme } from '@mui/material';

interface ReportItem {
  id: string; // Maps to product_id
  name: string; // Maps to product_name
  category: string; // Maps to product_category
  stock: number; // Maps to current_quantity
  price: number; // Maps to product_price
  unit?: string; // Optional, not in /api/medicines-cache
  expiryDate: string; // Maps to expire_date
  batchNumber: string; // Maps to batch_no
}

const Reports = () => {
  const theme = useTheme();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [reportType, setReportType] = useState<'all' | 'lowStock' | 'expiring'>('all');
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thresholds (since minStock isn't available)
  const LOW_STOCK_THRESHOLD = 10; // Define a default low stock threshold

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchCategories();
      fetchReportData();
    }
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
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
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
      }
      if (!text) {
        setReportData([]);
        return;
      }
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Expected an array of medicines');

      const mappedData: ReportItem[] = data.map((item: any) => ({
        id: String(item.product_id),
        name: item.product_name || 'Unknown Item',
        category: item.product_category || 'N/A',
        stock: parseInt(item.current_quantity, 10) || 0,
        price: parseFloat(item.product_price) || 0,
        unit: item.unit, 
        expiryDate: item.expire_date || 'N/A',
        batchNumber: item.batch_no || 'N/A',
      }));

      console.log('Mapped report data:', mappedData);
      setReportData(mappedData);
    } catch (err: any) {
      console.error('Fetch report error:', err.message);
      setError('Unable to fetch inventory report. Please try again later.');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
      const data = JSON.parse(text);
      setCategories(['All', ...data.map((cat: any) => cat.name || cat)]);
    } catch (err: any) {
      console.error('Fetch categories error:', err.message);
      setCategories(['All']); // Fallback
    }
  };

  const filteredData = reportData.filter((item) => {
    const expiryDate = new Date(item.expiryDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

    const isLowStock = item.stock <= LOW_STOCK_THRESHOLD;
    const isExpiring = item.expiryDate !== 'N/A' && expiryDate >= start && expiryDate <= end;

    if (reportType === 'lowStock') return isLowStock && matchesSearch && matchesCategory;
    if (reportType === 'expiring') return isExpiring && matchesSearch && matchesCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExport = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 14;
    const title = `Inventory Report - ${reportType === 'all' ? 'All Items' : reportType === 'lowStock' ? 'Low Stock' : 'Expiring Items'}`;

    doc.setFontSize(18);
    doc.setTextColor(theme.palette.text.primary);
    doc.text(title, margin, 20);

    doc.setFontSize(10);
    doc.setTextColor(theme.palette.text.secondary);
    doc.text(`Date Range: ${startDate} to ${endDate}`, margin, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 36);

    const tableData = filteredData.map((item) => [
      item.name,
      item.category,
      item.stock,
      item.price.toFixed(2),
      (item.stock * item.price).toFixed(2),
      item.expiryDate !== 'N/A' ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
      item.batchNumber,
      item.stock <= LOW_STOCK_THRESHOLD
        ? 'Low Stock'
        : item.expiryDate !== 'N/A' && new Date(item.expiryDate) < new Date()
        ? 'Expired'
        : 'In Stock',
    ]);

    (doc as any).autoTable({
      head: [['Name', 'Category', 'Stock', 'Price (Tsh)', 'Value (Tsh)', 'Expiry Date', 'Batch No', 'Status']],
      body: tableData,
      startY: 44,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2, textColor: theme.palette.text.secondary },
      headStyles: { fillColor: theme.palette.primary.main, textColor: theme.palette.common.white, fontSize: 10 },
      alternateRowStyles: { fillColor: theme.palette.action.hover },
      columnStyles: {
        0: { cellWidth: 40 }, // Name
        1: { cellWidth: 30 }, // Category
        2: { cellWidth: 15 }, // Stock
        3: { cellWidth: 15 }, // Price
        4: { cellWidth: 15 }, // Value
        5: { cellWidth: 25 }, // Expiry Date
        6: { cellWidth: 25 }, // Batch No
        7: { cellWidth: 20 }, // Status
      },
    });

    doc.save(`inventory_report_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalItems = filteredData.length;
  const totalStock = filteredData.reduce((sum, item) => sum + item.stock, 0);
  const totalValue = filteredData.reduce((sum, item) => sum + item.stock * item.price, 0);
  const lowStockItems = filteredData.filter((item) => item.stock <= LOW_STOCK_THRESHOLD);
  const expiringItems = filteredData.filter((item) => {
    const expiryDate = new Date(item.expiryDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return item.expiryDate !== 'N/A' && expiryDate >= start && expiryDate <= end;
  });

  return (
    <div style={{ minHeight: '100vh', background: theme.palette.background.default, padding: 32 }}>
      <header style={{ background: theme.palette.background.paper, boxShadow: theme.shadows[1], marginBottom: 24 }}>
        <div style={{ maxWidth: '100%', padding: '16px 24px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.palette.text.primary }}>Management Inventory Reports</h1>
        </div>
      </header>
      <main style={{ maxWidth: '100%' }}>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportType === 'expiring' && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Start Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-[#a0aec0]" />
                  </div>
                  <input
                    type="date"
                    className="pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-md w-full focus:ring-[#4c8bf5] focus:border-[#4c8bf5] bg-white text-[#4a5568]"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">End Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-[#a0aec0]" />
                  </div>
                  <input
                    type="date"
                    className="pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-md w-full focus:ring-[#4c8bf5] focus:border-[#4c8bf5] bg-white text-[#4a5568]"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-[#4a5568] mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#a0aec0]" />
              </div>
              <input
                type="text"
                placeholder="Search items..."
                className="pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-md w-full focus:ring-[#4c8bf5] focus:border-[#4c8bf5] bg-white text-[#4a5568]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a5568] mb-1">Category</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-[#a0aec0]" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-md w-full focus:ring-[#4c8bf5] focus:border-[#4c8bf5] bg-white text-[#4a5568]"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                disabled={loading}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && <div className="text-center text-[#4a5568]">Loading report data...</div>}
        {error && <div className="text-center text-red-700 bg-red-50 p-3 rounded-md">{error}</div>}

        {/* Export Button */}
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-[#4c8bf5] text-white rounded-md hover:bg-[#3b7ae0] disabled:bg-[#a0aec0]"
            disabled={loading || filteredData.length === 0}
          >
            <Download className="h-5 w-5 mr-2" />
            Export Report
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#4a5568]">Total Items</p>
                <p className="mt-2 text-3xl font-semibold text-[#2d3748]">{totalItems}</p>
              </div>
              <div className="p-3 rounded-full bg-[#e6f0ff]">
                <Package className="h-6 w-6 text-[#4c8bf5]" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#4a5568]">Total Stock</p>
                <p className="mt-2 text-3xl font-semibold text-[#2d3748]">{totalStock}</p>
              </div>
              <div className="p-3 rounded-full bg-[#e6ffe6]">
                <BarChart3 className="h-6 w-6 text-[#38a169]" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#4a5568]">Low Stock Items</p>
                <p className="mt-2 text-3xl font-semibold text-[#2d3748]">{lowStockItems.length}</p>
              </div>
              <div className="p-3 rounded-full bg-[#fff7e6]">
                <AlertTriangle className="h-6 w-6 text-[#d97706]" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#4a5568]">Inventory Value</p>
                <p className="mt-2 text-3xl font-semibold text-[#2d3748]">Tsh {totalValue.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-full bg-[#f3e8ff]">
                <DollarSign className="h-6 w-6 text-[#805ad5]" />
              </div>
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div className="border border-[#e2e8f0] rounded-md overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e2e8f0]">
              <thead className="bg-[#f7fafc]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Total Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Batch No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4a5568] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => {
                    const expiryDate = new Date(item.expiryDate);
                    const today = new Date();
                    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    let statusColor = '';
                    let statusText = '';

                    if (item.stock <= LOW_STOCK_THRESHOLD) {
                      statusColor = 'bg-[#fff7e6] text-[#d97706]';
                      statusText = 'Low Stock';
                    } else if (item.expiryDate !== 'N/A' && daysUntilExpiry < 90) {
                      statusColor = 'bg-[#fee2e2] text-[#dc2626]';
                      statusText = `Expires in ${daysUntilExpiry} days`;
                    } else {
                      statusColor = 'bg-[#e6ffe6] text-[#38a169]';
                      statusText = 'In Stock';
                    }

                    return (
                      <tr key={item.id} className="hover:bg-[#edf2f7] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2d3748]">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">{item.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                          <span className={item.stock <= LOW_STOCK_THRESHOLD ? 'text-[#d97706] font-medium' : ''}>
                            {item.stock} {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">Tsh {item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">{(item.stock * item.price).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">
                          {item.expiryDate !== 'N/A' ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">{item.batchNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-[#4a5568]">
                      No data found for the selected criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-[#f7fafc] p-4 rounded-md border border-[#e2e8f0]">
          <h3 className="text-md font-medium text-[#2d3748] mb-2">Report Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-[#4a5568]">Total Items</p>
              <p className="text-xl font-semibold text-[#2d3748]">{totalItems}</p>
            </div>
            <div>
              <p className="text-sm text-[#4a5568]">Total Stock</p>
              <p className="text-xl font-semibold text-[#2d3748]">{totalStock} units</p>
            </div>
            <div>
              <p className="text-sm text-[#4a5568]">Total Value</p>
              <p className="text-xl font-semibold text-[#2d3748]">Tsh {totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;