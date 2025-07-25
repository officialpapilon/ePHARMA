import React, { useState, useEffect } from 'react';
import { Calendar, Download, Search, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../../../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transition } from 'react-transition-group';
import Spinner from '../../components/UI/Spinner/index.tsx';
import { useTheme } from '@mui/material';

interface ReportItem {
  transaction_ID: string;
  Patient_ID: string;
  patient_name: string;
  patient_phone: string;
  approved_at: string;
  approved_amount: string;
  approved_payment_method: string;
  approved_payment_method_id: string;
  status: string;
  items: {
    id: string;
    name: string;
    quantity: string;
  }[];
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const DispensingReport: React.FC = () => {
  const theme = useTheme();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      fetchReportData();
    }
  }, []);

  // Format date to dd/mm/yyyy HH:MM
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return 'N/A';
    }
  };

  // Format amount with currency
  const formatAmount = (amount: string): string => {
    if (!amount) return 'N/A';
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? 'N/A' : `Tsh ${parsed.toFixed(2)}`;
  };

  const fetchReportData = async (page: number = 1, perPage: number = meta.per_page) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const url = `${API_BASE_URL}/api/dispensing-report?start_date=${startDate}&end_date=${endDate}&page=${page}&per_page=${perPage}&search=${encodeURIComponent(searchTerm)}`;
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
      console.log('Raw response from /api/dispensing-report:', text);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/login';
          return;
        }
        if (response.status === 404) {
          console.warn('No data found for the given criteria');
          setReportData([]);
          setMeta({ current_page: 1, last_page: 1, per_page, total: 0 });
          return;
        }
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
      }

      if (!text) {
        console.warn('Empty response received');
        setReportData([]);
        setMeta({ current_page: 1, last_page: 1, per_page, total: 0 });
        return;
      }

      const responseData = JSON.parse(text);
      console.log('Parsed response data:', responseData);

      // Extract data and meta from the new payload structure
      const data = Array.isArray(responseData.data) ? responseData.data : [];
      const metaData = responseData.meta || { current_page: 1, last_page: 1, per_page, total: data.length };

      // Map the data to match the new ReportItem interface
      const mappedData: ReportItem[] = data.map((item: any) => ({
        transaction_ID: String(item.transaction_ID || 'N/A'),
        Patient_ID: String(item.Patient_ID || 'N/A'),
        patient_name: item.patient_name || 'Unknown Patient',
        patient_phone: item.patient_phone || 'N/A',
        approved_at: item.approved_at || new Date().toISOString(),
        approved_amount: item.approved_amount || '0.00',
        approved_payment_method: item.approved_payment_method || 'Unknown',
        approved_payment_method_id: item.approved_payment_method_id || 'unknown',
        status: item.status || 'Unknown',
        items: Array.isArray(item.items)
          ? item.items.map((med: any) => ({
              id: String(med.id || 'N/A'),
              name: med.name || 'Unknown Product',
              quantity: String(med.quantity || '1'),
            }))
          : [],
      }));

      console.log('Mapped report data:', mappedData);
      setReportData(mappedData);
      setMeta(metaData);
    } catch (err: any) {
      console.error('Fetch report error:', err.message);
      setError(
        err.message === 'No authentication token found'
          ? 'Please log in to access this page.'
          : `Unable to fetch dispensing report: ${err.message}`
      );
      setReportData([]);
      setMeta({ current_page: 1, last_page: 1, per_page, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData.length) {
      setError('No data available to export');
      return;
    }
    const doc = new jsPDF();
    const title = 'Pharmacy Dispensing Report';
    const dateRange = `Date Range: ${startDate} to ${endDate}`;
    const generatedOn = `Generated on: ${new Date().toLocaleString()}`;

    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(dateRange, 14, 30);
    doc.setFontSize(10);
    doc.text(generatedOn, 14, 40);

    const tableData = reportData.map((item, index) => [
      ((meta.current_page - 1) * meta.per_page + index + 1).toString(),
      item.transaction_ID,
      formatDate(item.approved_at),
      `${item.patient_name} (${item.patient_phone})`,
      formatAmount(item.approved_amount),
      item.approved_payment_method_id,
      item.status,
      item.items.map((med) => `${med.name} x ${med.quantity}`).join(', '),
    ]);

    autoTable(doc, {
      head: [['S/N', 'Transaction ID', 'Date', 'Customer', 'Amount', 'Payment Method', 'Status', 'Items Dispensed']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    const summaryY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Report Summary', 14, summaryY);
    doc.setFontSize(10);
    doc.text(`Total Transactions: ${meta.total}`, 14, summaryY + 10);
    doc.text(
      `Total Customers: ${new Set(reportData.map((item) => item.Patient_ID)).size}`,
      14,
      summaryY + 20
    );
    doc.text(
      `Total Items Dispensed: ${reportData.reduce(
        (total, item) => total + item.items.reduce((sum, med) => sum + parseInt(med.quantity, 10), 0),
        0
      )}`,
      14,
      summaryY + 30
    );
    doc.text(
      `Total Amount: ${formatAmount(reportData.reduce((total, item) => total + parseFloat(item.approved_amount), 0).toString())}`,
      14,
      summaryY + 40
    );

    doc.save(`dispensing_report_${startDate}_to_${endDate}.pdf`);
  };

  const exportToExcel = () => {
    if (!reportData.length) {
      setError('No data available to export');
      return;
    }
    const worksheetData = reportData.map((item, index) => ({
      'S/N': ((meta.current_page - 1) * meta.per_page + index + 1),
      'Transaction ID': item.transaction_ID,
      Date: formatDate(item.approved_at),
      'Customer Name': item.patient_name,
      'Customer Phone': item.patient_phone,
      Amount: formatAmount(item.approved_amount),
      'Payment Method': item.approved_payment_method_id,
      Status: item.status,
      'Items Dispensed': item.items.map((med) => `${med.name} x ${med.quantity}`).join(', '),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispensing Report');
    XLSX.writeFile(workbook, `dispensing_report_${startDate}_to_${endDate}.xlsx`);
  };

  const transitionStyles = {
    entering: { opacity: 0, transform: 'translateY(-10px)' },
    entered: { opacity: 1, transform: 'translateY(0)' },
    exiting: { opacity: 0, transform: 'translateY(-10px)' },
    exited: { opacity: 0, transform: 'translateY(-10px)' },
  };

  return (
    <main style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', background: theme.palette.background.default, boxSizing: 'border-box', padding: '16px' }}>
      <header style={{ background: theme.palette.background.paper, boxShadow: theme.shadows[1], marginBottom: 24 }}>
        <div style={{ maxWidth: '100%', padding: '16px 24px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.palette.text.primary }}>Dispensing Report</h1>
        </div>
      </header>

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
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
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

      {/* Summary Statistics */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Summary Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="text-2xl font-semibold text-gray-800">{meta.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-600">Unique Customers</p>
            <p className="text-2xl font-semibold text-gray-800">
              {new Set(reportData.map((item) => item.Patient_ID)).size}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-600">Total Items Dispensed</p>
            <p className="text-2xl font-semibold text-gray-800">
              {reportData.reduce(
                (total, item) => total + item.items.reduce((sum, med) => sum + parseInt(med.quantity, 10), 0),
                0
              )}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-semibold text-gray-800">
              {formatAmount(reportData.reduce((total, item) => total + parseFloat(item.approved_amount), 0).toString())}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by customer or ID..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => fetchReportData(1, meta.per_page)}
              className="w-full px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-teal-300 hover:text-black disabled:opacity-50 transition-colors shadow-md"
              disabled={loading}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex justify-end space-x-4 mb-6">
        <button
          onClick={exportToPDF}
          className="flex items-center px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-teal-300 hover:text-black disabled:opacity-50 transition-colors shadow-md"
          disabled={loading || reportData.length === 0}
        >
          <Download className="h-5 w-5 mr-2" />
          Export as PDF
        </button>
        <button
          onClick={exportToExcel}
          className="flex items-center px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-teal-300 hover:text-black disabled:opacity-50 transition-colors shadow-md"
          disabled={loading || reportData.length === 0}
        >
          <Download className="h-5 w-5 mr-2" />
          Export as Excel
        </button>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Dispensing Records</h2>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    S/N
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Items Dispensed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.length > 0 ? (
                  reportData.map((item, index) => (
                    <tr key={item.transaction_ID} className="hover:bg-indigo-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {(meta.current_page - 1) * meta.per_page + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {item.transaction_ID}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(item.approved_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>
                          <p className="font-medium">{item.patient_name}</p>
                          <p className="text-xs text-gray-500">{item.patient_phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatAmount(item.approved_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.approved_payment_method_id === 'cash' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.approved_payment_method_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <ul className="list-disc list-inside">
                          {item.items.map((medicine) => (
                            <li key={medicine.id}>
                              {medicine.name} x {medicine.quantity}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-sm text-gray-600"
                    >
                      No dispensing records found for the selected criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row justify-between items-center mt-6">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={meta.per_page}
              onChange={(e) => fetchReportData(1, Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-800"
              disabled={loading}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchReportData(meta.current_page - 1, meta.per_page)}
              disabled={meta.current_page === 1 || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              onClick={() => fetchReportData(meta.current_page + 1, meta.per_page)}
              disabled={meta.current_page === meta.last_page || loading}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DispensingReport;