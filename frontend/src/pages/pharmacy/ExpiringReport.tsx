import React, { useState, useEffect, useCallback } from 'react';
import { Download, Search, Filter, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../../../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transition } from 'react-transition-group';
import Spinner from '../../components/UI/Spinner/index.tsx';
import { useTheme } from '@mui/material';

interface Medicine {
  product_name: string;
  product_category: string;
  current_quantity: number;
  product_price: number;
  expire_date: string;
  batch_no: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Custom debounce function
function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const StockStatusReport: React.FC = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('All');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [meta, setMeta] = useState<Meta>({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Thresholds
  const LOW_STOCK_THRESHOLD = 10;
  const NEAR_EXPIRY_DAYS = 30;

  // Helper function to format dates as DD/MM/YYYY
  const formatDate = (date: string | null): string => {
    if (!date || date === 'N/A') return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to format amounts
  const formatAmount = (amount: number): string => {
    return `Tsh ${amount.toFixed(2)}`;
  };

  // Auto-dismiss error after 1 second
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchMedicines();
    }
  }, []);

  const fetchMedicines = async (page: number = 1, perPage: number = meta.per_page) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const url = `${API_BASE_URL}/api/medicines-cache?page=${page}&per_page=${perPage}&search=${encodeURIComponent(searchTerm)}`;
      console.log('Fetching from:', url);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      console.log('Raw response from /api/medicines-cache:', text);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        if (response.status === 404) {
          console.warn('No medicines found');
          setMedicines([]);
          setMeta({ current_page: 1, last_page: 1, per_page: perPage, total: 0 });
          return;
        }
        throw new Error(`Failed to fetch medicines: ${response.status} - ${text || 'No response data'}`);
      }

      if (!text) {
        console.warn('Empty response received');
        setMedicines([]);
        setMeta({ current_page: 1, last_page: 1, per_page: perPage, total: 0 });
        return;
      }

      const rawData = JSON.parse(text);
      console.log('Parsed response data:', rawData);

      const data = Array.isArray(rawData) ? rawData : Array.isArray(rawData.data) ? rawData.data : [];
      const metaData = rawData.meta || { current_page: 1, last_page: 1, per_page: perPage, total: data.length };

      if (!Array.isArray(data)) {
        throw new Error('Expected an array of medicines.');
      }

      const parsedData: Medicine[] = data.map((item: Record<string, unknown>) => ({
        product_name: (item.product_name as string) || 'Unknown Product',
        product_category: (item.product_category as string) || 'N/A',
        current_quantity: parseInt(String(item.current_quantity), 10) || 0,
        product_price: parseFloat(String(item.product_price)) || 0,
        expire_date: (item.expire_date as string) || 'N/A',
        batch_no: (item.batch_no as string) || 'N/A',
      }));

      console.log('Parsed medicines:', parsedData);
      setMedicines(parsedData);
      setMeta(metaData);
    } catch (err: unknown) {
      console.error('Fetch medicines error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setMedicines([]);
      setMeta({ current_page: 1, last_page: 1, per_page: perPage, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedFetch = useCallback(
    debounce((page: number, perPage: number) => fetchMedicines(page, perPage), 500),
    [searchTerm]
  );

  useEffect(() => {
    debouncedFetch(1, meta.per_page);
  }, [searchTerm, debouncedFetch]);

  useEffect(() => {
    fetchMedicines(1, meta.per_page);
  }, [filterType]);

  // Filter medicines based on status
  const today = new Date();
  const nearExpiryThreshold = new Date();
  nearExpiryThreshold.setDate(today.getDate() + NEAR_EXPIRY_DAYS);

  const filteredMedicines = medicines;

  const expiredItems = filteredMedicines.filter(
    (m) => m.expire_date !== 'N/A' && new Date(m.expire_date) < today
  );
  const nearExpiringItems = filteredMedicines.filter(
    (m) =>
      m.expire_date !== 'N/A' &&
      new Date(m.expire_date) >= today &&
      new Date(m.expire_date) <= nearExpiryThreshold
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
    if (!data.length) {
      setError('No data available to export');
      return;
    }
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    doc.setFontSize(18);
    doc.setTextColor('#1F2937');
    doc.text(title, margin, 20, { align: 'left' });

    doc.setFontSize(10);
    doc.setTextColor('#6B7280');
    doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, margin, 30);
    doc.text(`Total Items: ${data.length}`, margin, 36);

    const totalValue = data.reduce((sum, item) => sum + item.current_quantity * item.product_price, 0).toFixed(2);

    const tableData = data.map((item, index) => [
      (meta.current_page - 1) * meta.per_page + index + 1,
      item.product_name,
      item.product_category,
      item.current_quantity,
      item.product_price.toFixed(2),
      formatDate(item.expire_date),
      item.batch_no,
    ]);

    autoTable(doc, {
      head: [['S/N', 'Name', 'Category', 'Qty', 'Price (Tsh)', 'Expiry Date', 'Batch No']],
      body: tableData,
      foot: [[ '', '', '', '', `Total Value: ${totalValue}`, '', '' ]],
      startY: 44,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3, textColor: '#4B5563' },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontSize: 10 },
      footStyles: { fillColor: [243, 244, 246], textColor: '#1F2937', fontSize: 9, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: '#F9FAFB' },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
      },
      didDrawPage: (data: { pageNumber: number }) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, {
          align: 'right',
        });
      },
    });

    const summaryY = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Report Summary', margin, summaryY);
    doc.setFontSize(10);
    doc.text(`Total Medicines: ${meta.total}`, margin, summaryY + 10);
    doc.text(`Expired Items: ${expiredItems.length}`, margin, summaryY + 20);
    doc.text(`Near Expiring Items: ${nearExpiringItems.length}`, margin, summaryY + 30);
    doc.text(`Low Stock Items: ${lowStockItems.length}`, margin, summaryY + 40);
    doc.text(`Out of Stock Items: ${outOfStockItems.length}`, margin, summaryY + 50);
    doc.text(`Total Value (Tsh): ${sections.reduce((sum, section) => sum + section.items.reduce((s, item) => s + item.current_quantity * item.product_price, 0), 0).toFixed(2)}`, margin, summaryY + 60);

    doc.save(`${title.toLowerCase().replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = (data: Medicine[], title: string) => {
    if (!data.length) {
      setError('No data available to export');
      return;
    }
    const totalValue = data.reduce((sum, item) => sum + item.current_quantity * item.product_price, 0).toFixed(2);

    const worksheetData = data.map((item, index) => ({
      'S/N': (meta.current_page - 1) * meta.per_page + index + 1,
      'Name': item.product_name,
      'Category': item.product_category,
      'Quantity': item.current_quantity,
      'Price (Tsh)': item.product_price.toFixed(2),
      'Expiry Date': formatDate(item.expire_date),
      'Batch No': item.batch_no,
    }));

    // Add total value row
    worksheetData.push({
      'S/N': 0,
      'Name': '',
      'Category': '',
      'Quantity': 0,
      'Price (Tsh)': `Total Value: ${totalValue}`,
      'Expiry Date': '',
      'Batch No': '',
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    XLSX.writeFile(workbook, `${title.toLowerCase().replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderSection = (items: Medicine[], title: string) => {
    const totalAmount = items.reduce((sum, item) => sum + (item.current_quantity * item.product_price), 0);
    
    return (
      <section style={{ marginBottom: 24, background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 16, boxShadow: theme.shadows[1], padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: theme.palette.text.primary }}>{title}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => exportToPDF(items, title)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                background: theme.palette.success.main,
                color: theme.palette.common.white,
                borderRadius: 8,
                cursor: loading || items.length === 0 ? 'not-allowed' : 'pointer',
                opacity: loading || items.length === 0 ? 0.7 : 1,
                transition: 'all 0.2s ease-in-out',
                boxShadow: theme.shadows[1],
                border: 'none',
              }}
              disabled={loading || items.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </button>
            <button
              onClick={() => exportToExcel(items, title)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                background: theme.palette.info.main,
                color: theme.palette.common.white,
                borderRadius: 8,
                cursor: loading || items.length === 0 ? 'not-allowed' : 'pointer',
                opacity: loading || items.length === 0 ? 0.7 : 1,
                transition: 'all 0.2s ease-in-out',
                boxShadow: theme.shadows[1],
                border: 'none',
              }}
              disabled={loading || items.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </button>
          </div>
        </div>
        <div style={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
              <thead style={{ background: theme.palette.primary.main }}>
                <tr>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 1 }}>S/N</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 1 }}>Name</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 1 }}>Category</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 1 }}>Quantity</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 1 }}>Price (Tsh)</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 1 }}>Expiry Date</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 1 }}>Batch No</th>
                </tr>
              </thead>
              <tbody style={{ background: theme.palette.background.paper }}>
                {items.length > 0 ? (
                  items.map((medicine, index) => (
                    <tr key={`${medicine.product_name}-${index}`} style={{ transition: 'background-color 0.15s ease-in-out', background: index % 2 === 0 ? theme.palette.background.paper : theme.palette.action.hover }}>
                      <td style={{ padding: '16px 20px', color: theme.palette.text.primary }}>{index + 1}</td>
                      <td style={{ padding: '16px 20px', color: theme.palette.text.primary, fontWeight: 500 }}>{medicine.product_name}</td>
                      <td style={{ padding: '16px 20px', color: theme.palette.text.primary }}>{medicine.product_category}</td>
                      <td style={{ padding: '16px 20px', color: theme.palette.text.primary }}>{medicine.current_quantity}</td>
                      <td style={{ padding: '16px 20px', color: theme.palette.text.primary }}>{formatAmount(medicine.product_price)}</td>
                      <td style={{ padding: '16px 20px', color: theme.palette.text.primary }}>{formatDate(medicine.expire_date)}</td>
                      <td style={{ padding: '16px 20px', color: theme.palette.text.primary }}>{medicine.batch_no}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '16px 20px', textAlign: 'center', fontSize: 15, color: theme.palette.text.secondary }}>
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Total Amount Section */}
        {items.length > 0 && (
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            background: theme.palette.primary.light, 
            borderRadius: 8, 
            border: `1px solid ${theme.palette.primary.main}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: 16, fontWeight: 600, color: theme.palette.primary.contrastText }}>
                Total Items: {items.length}
              </span>
            </div>
            <div>
              <span style={{ fontSize: 18, fontWeight: 700, color: theme.palette.primary.contrastText }}>
                Total Amount: {formatAmount(totalAmount)}
              </span>
            </div>
          </div>
        )}
      </section>
    );
  };

  const transitionStyles: Record<string, React.CSSProperties> = {
    entering: { opacity: 0, transform: 'translateY(-10px)' },
    entered: { opacity: 1, transform: 'translateY(0)' },
    exiting: { opacity: 0, transform: 'translateY(-10px)' },
    exited: { opacity: 0, transform: 'translateY(-10px)' },
    unmounted: { opacity: 0, transform: 'translateY(-10px)' },
  };

  return (
    <main style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', background: theme.palette.background.default, boxSizing: 'border-box', padding: '16px' }}>
      <header style={{ background: theme.palette.background.paper, boxShadow: theme.shadows[1], marginBottom: 24 }}>
        <div style={{ maxWidth: '100%', padding: '16px 24px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.palette.text.primary }}>Stock Status Report</h1>
        </div>
      </header>

      <main style={{ maxWidth: '100%' }}>
        <Transition in={!!error} timeout={300} unmountOnExit>
          {(state) => (
            <div
              className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 flex justify-between items-center transition-all duration-300"
              style={{ ...transitionStyles[state] }}
            >
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700" aria-label="Close error">
                <X size={20} />
              </button>
            </div>
          )}
        </Transition>

        {loading && !error && (
          <div className="text-center py-6">
            <Spinner />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Summary Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl shadow-sm">
              <p className="text-sm text-gray-600">Total Medicines</p>
              <p className="text-2xl font-semibold text-gray-800">{meta.total}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl shadow-sm">
              <p className="text-sm text-gray-600">Expired Items</p>
              <p className="text-2xl font-semibold text-gray-800">{expiredItems.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl shadow-sm">
              <p className="text-sm text-gray-600">Near Expiring Items</p>
              <p className="text-2xl font-semibold text-gray-800">{nearExpiringItems.length}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl shadow-sm">
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-semibold text-gray-800">{lowStockItems.length}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-xl shadow-sm">
              <p className="text-sm text-gray-600">Out of Stock Items</p>
              <p className="text-2xl font-semibold text-gray-800">{outOfStockItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Report</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, category, or batch no..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                  aria-label="Search medicines"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Filter Type</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  disabled={loading}
                  aria-label="Filter by section"
                >
                  <option value="All">All Sections</option>
                  <option value="Expired Items">Expired Items</option>
                  <option value="Near Expiring Items">Near Expiring Items</option>
                  <option value="Low Stock Items">Low Stock Items</option>
                  <option value="Out of Stock Items">Out of Stock Items</option>
                </select>
              </div>
            </div>
            <div className="flex items-end justify-end gap-4">
              <button
                onClick={() => fetchMedicines(1, meta.per_page)}
                className="px-3 py-1 bg-indigo-900 text-white text-sm rounded-lg hover:bg-teal-300 hover:text-black disabled:opacity-50 transition-colors shadow-md"
                disabled={loading}
                aria-label="Apply filters"
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('All');
                }}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-md"
                disabled={loading || (!searchTerm && filterType === 'All')}
                aria-label="Clear filters"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {filterType === 'All'
            ? sections.map((section) => renderSection(section.items, section.title))
            : renderSection(
                sections.find((s) => s.title === filterType)!.items,
                filterType
              )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row justify-between items-center mt-6">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={meta.per_page}
              onChange={(e) => fetchMedicines(1, Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
              disabled={loading}
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchMedicines(meta.current_page - 1, meta.per_page)}
              disabled={meta.current_page === 1 || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              onClick={() => fetchMedicines(meta.current_page + 1, meta.per_page)}
              disabled={meta.current_page === meta.last_page || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>
    </main>
  );
};

export default StockStatusReport;