
import React, { useState, useEffect } from 'react';
import { Download, Search, Filter } from 'lucide-react';
import { API_BASE_URL } from '../../../constants';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable'; // Updated import
import * as XLSX from 'xlsx';
import Spinner from '../../components/UI/Spinner/index.tsx';
import { useTheme } from '@mui/material';

interface Medicine {
  product_name: string;
  product_category: string;
  current_quantity: number;
  product_price: number;
  expiry_date: string;
  batch_no: string;
}

const StockStatusReport: React.FC = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('All');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
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
        product_name: item.product_name || 'Unknown Product',
        product_category: item.product_category || 'N/A',
        current_quantity: parseInt(item.current_quantity, 10) || 0,
        product_price: parseFloat(item.product_price) || 0,
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
    doc.setTextColor(theme.palette.text.primary); // Tailwind gray-900
    doc.text(title, margin, 20, { align: 'left' });

    doc.setFontSize(10);
    doc.setTextColor(theme.palette.text.secondary); // Tailwind gray-500
    doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, margin, 30);
    doc.text(`Total Items: ${data.length}`, margin, 36);

    const tableData = data.map((item, index) => [
      index + 1, // S/N
      item.product_name,
      item.product_category,
      item.current_quantity,
      item.product_price.toFixed(2),
      formatDate(item.expiry_date),
      item.batch_no,
    ]);

    // Use the imported autoTable function
    autoTable(doc, {
      head: [['S/N', 'Name', 'Category', 'Qty', 'Price (Tsh)', 'Expiry Date', 'Batch No']],
      body: tableData,
      startY: 44,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3, textColor: theme.palette.text.primary }, // Tailwind gray-600
      headStyles: { fillColor: theme.palette.primary.main, textColor: theme.palette.common.white, fontSize: 10 }, // Tailwind gray-900
      alternateRowStyles: { fillColor: theme.palette.action.hover }, // Tailwind gray-50
      columnStyles: {
        0: { cellWidth: 15 }, // S/N
        1: { cellWidth: 40 }, // Name
        2: { cellWidth: 30 }, // Category
        3: { cellWidth: 15 }, // Qty
        4: { cellWidth: 20 }, // Price
        5: { cellWidth: 25 }, // Expiry Date
        6: { cellWidth: 25 }, // Batch No
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
    const worksheetData = data.map((item, index) => ({
      'S/N': index + 1,
      'Name': item.product_name,
      'Category': item.product_category,
      'Quantity': item.current_quantity,
      'Price (Tsh)': item.product_price.toFixed(2),
      'Expiry Date': formatDate(item.expiry_date),
      'Batch No': item.batch_no,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    XLSX.writeFile(workbook, `${title.toLowerCase().replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderSection = (items: Medicine[], title: string) => (
    <section style={{ marginBottom: 24, background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 12, boxShadow: theme.shadows[1] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${theme.palette.divider}` }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: theme.palette.text.primary }}>{title}</h3>
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
            <thead style={{ background: theme.palette.action.hover }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>S/N</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>Category</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>Quantity</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>Price (Tsh)</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>Expiry Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>Batch No</th>
              </tr>
            </thead>
            <tbody style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
              {items.length > 0 ? (
                items.map((medicine, index) => (
                  <tr key={`${medicine.product_name}-${index}`} style={{ transition: 'background-color 0.15s ease-in-out' }}>
                    <td style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}` }}>{index + 1}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 500, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}` }}>{medicine.product_name}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}` }}>{medicine.product_category}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}` }}>{medicine.current_quantity}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}` }}>{medicine.product_price.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}` }}>{formatDate(medicine.expiry_date)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}` }}>{medicine.batch_no}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>
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
    <div style={{ minHeight: '100vh', background: theme.palette.background.default, padding: 32 }}>
      <header style={{ background: theme.palette.background.paper, boxShadow: theme.shadows[1], marginBottom: 24 }}>
        <div style={{ maxWidth: '100%', padding: '16px 24px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.palette.text.primary }}>Wholesale Stock Status Report</h1>
      </div>
      </header>
      <main style={{ maxWidth: '100%' }}>
      {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
              <div style={{ position: 'absolute', inset: '0 0 0 0', display: 'flex', alignItems: 'center', paddingLeft: 10, pointerEvents: 'none' }}>
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search medicines..."
                style={{
                  paddingLeft: 40,
                  paddingRight: 16,
                  paddingTop: 12,
                  paddingBottom: 12,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  width: '100%',
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  boxShadow: theme.shadows[1],
                  transition: 'all 0.2s ease-in-out',
                  '&::placeholder': {
                    color: theme.palette.text.secondary,
                  },
                  '&:focus': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 2px ${theme.palette.primary.main}, 0 0 0 4px ${theme.palette.primary.main}`,
                  },
                }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>
            <div style={{ position: 'relative', width: '100%', maxWidth: 200 }}>
              <div style={{ position: 'absolute', inset: '0 0 0 0', display: 'flex', alignItems: 'center', paddingLeft: 10, pointerEvents: 'none' }}>
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
                style={{
                  paddingLeft: 40,
                  paddingRight: 16,
                  paddingTop: 12,
                  paddingBottom: 12,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  width: '100%',
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  boxShadow: theme.shadows[1],
                  transition: 'all 0.2s ease-in-out',
                  '&::placeholder': {
                    color: theme.palette.text.secondary,
                  },
                  '&:focus': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 2px ${theme.palette.primary.main}, 0 0 0 4px ${theme.palette.primary.main}`,
                  },
                }}
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
      </div>

      {/* Loading and Error States */}
      {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 64 }}>
          <Spinner className="h-8 w-8 text-blue-600" />
        </div>
      )}
      {error && (
          <div style={{ textAlign: 'center', color: theme.palette.error.main, background: theme.palette.error.light, padding: 24, borderRadius: 12, boxShadow: theme.shadows[1] }}>
          {error}
        </div>
      )}

      {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {filterType === 'All'
          ? sections.map((section) => renderSection(section.items, section.title))
          : renderSection(
              sections.find((s) => s.title === filterType)!.items,
              filterType
            )}
      </div>
      </main>
    </div>
  );
};

export default StockStatusReport;