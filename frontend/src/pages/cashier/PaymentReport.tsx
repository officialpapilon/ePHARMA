import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTheme } from '@mui/material/styles';
import { API_BASE_URL } from '../../../constants';

// Interface matching the exact backend payload
interface ReportItem {
  Payment_ID: number;
  Patient_ID: string;
  transaction_ID: string;
  Product_ID: string;
  status: string; // "Approved" or other
  approved_by: string;
  approved_at: string; // e.g., "2025-05-09"
  approved_quantity: string; // String in payload
  approved_amount: string; // String in payload, e.g., "300"
  approved_payment_method: string; // e.g., "CASH"
  created_at: string;
  updated_at: string;
}

interface SummaryStats {
  totalTransactions: number;
  totalAmount: number;
  completedPayments: number;
  pendingPayments: number;
  averageAmount: number;
  cashPayments: number;
  cardPayments: number;
  mobilePayments: number;
}

const PaymentReport = () => {
  const theme = useTheme();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const paymentMethods = ['All', 'CASH', 'CARD', 'MOBILE'];

  useEffect(() => {
    fetchPaymentReports();
  }, [startDate, endDate]);

  const fetchPaymentReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      const response = await fetch(`${API_BASE_URL}/api/payment-approve?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const text = await response.text();
      console.log('Raw response from /payment-approve:', text);

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

      const rawData: ReportItem[] = JSON.parse(text);
      if (!Array.isArray(rawData)) {
        throw new Error('Invalid data format: Expected an array');
      }

      setReportData(rawData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Fetch payment reports error:', errorMessage);
      setError('Unable to fetch payment reports: ' + errorMessage);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = reportData.filter((item) => {
    const matchesSearch =
      item.transaction_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Patient_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.approved_by.toLowerCase().includes(searchTerm.toLowerCase());

    const normalizedStatus = item.status === 'Paid' ? 'Paid' : 'Pending';
    const matchesStatus = statusFilter === 'All' || normalizedStatus === statusFilter;

    const matchesPaymentMethod =
      paymentMethodFilter === 'All' || item.approved_payment_method === paymentMethodFilter;

    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  // Calculate summary statistics
  const summaryStats: SummaryStats = {
    totalTransactions: filteredData.length,
    totalAmount: filteredData
      .filter((item) => item.status === 'Paid')
      .reduce((sum, item) => sum + parseFloat(item.approved_amount), 0),
    completedPayments: filteredData.filter((item) => item.status === 'Paid').length,
    pendingPayments: filteredData.filter((item) => item.status !== 'Paid').length,
    averageAmount: filteredData.filter((item) => item.status === 'Paid').length > 0 
      ? filteredData
          .filter((item) => item.status === 'Paid')
          .reduce((sum, item) => sum + parseFloat(item.approved_amount), 0) / 
        filteredData.filter((item) => item.status === 'Paid').length 
      : 0,
    cashPayments: filteredData.filter((item) => item.approved_payment_method === 'CASH' && item.status === 'Paid').length,
    cardPayments: filteredData.filter((item) => item.approved_payment_method === 'CARD' && item.status === 'Paid').length,
    mobilePayments: filteredData.filter((item) => item.approved_payment_method === 'MOBILE' && item.status === 'Paid').length,
  };

  // Pagination logic
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleExport = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Payment Report', 14, 22);

    doc.setFontSize(12);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 32);

    (doc as unknown as { autoTable: (options: unknown) => void }).autoTable({
      startY: 40,
      head: [
        ['Payment ID', 'Transaction ID', 'Patient ID', 'Date', 'Cashier', 'Payment Method', 'Amount', 'Status'],
      ],
      body: filteredData.map((item) => [
        item.Payment_ID,
        item.transaction_ID,
        item.Patient_ID,
        item.approved_at || item.created_at.split('T')[0],
        item.approved_by,
        item.approved_payment_method,
        `Tsh ${parseFloat(item.approved_amount).toFixed(2)}`,
        item.status === 'Paid' ? 'Paid' : 'Pending',
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Summary', 14, finalY);
    doc.text(`Total Transactions: ${summaryStats.totalTransactions}`, 14, finalY + 10);
    doc.text(`Total Amount: Tsh ${summaryStats.totalAmount.toFixed(2)}`, 14, finalY + 20);
    doc.text(`Completed Payments: ${summaryStats.completedPayments}`, 14, finalY + 30);
    doc.text(`Average Amount: Tsh ${summaryStats.averageAmount.toFixed(2)}`, 14, finalY + 40);

    doc.save(`Payment_Report_${startDate}_to_${endDate}.pdf`);
  };

  const summaryCards = [
    {
      title: 'Total Transactions',
      value: summaryStats.totalTransactions.toLocaleString(),
      icon: <TrendingUp style={{ color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Total Amount',
      value: `Tsh ${summaryStats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: <DollarSign style={{ color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
    },
    {
      title: 'Completed Payments',
      value: summaryStats.completedPayments.toLocaleString(),
      icon: <TrendingUp style={{ color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
    },
    {
      title: 'Pending Payments',
      value: summaryStats.pendingPayments.toLocaleString(),
      icon: <TrendingDown style={{ color: theme.palette.warning.main }} />,
      color: theme.palette.warning.main,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: theme.palette.background.default, padding: 32 }}>
      <header style={{ background: theme.palette.background.paper, boxShadow: theme.shadows[1], marginBottom: 24, borderRadius: 16 }}>
        <div style={{ maxWidth: '100%', padding: '24px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>Payment Report</h1>
          <p style={{ fontSize: 16, color: theme.palette.text.secondary, margin: '8px 0 0 0' }}>
            Comprehensive payment transaction analysis (Total Amount includes only paid transactions)
          </p>
        </div>
      </header>

      <main style={{ maxWidth: '100%' }}>
        {error && (
          <div style={{ background: theme.palette.error.light, border: `1px solid ${theme.palette.error.main}`, color: theme.palette.error.dark, padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <span style={{ display: 'block', marginBottom: 8 }}>{error}</span>
            {setTimeout(() => setError(null), 5000)}
          </div>
        )}

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 32 }}>
          {summaryCards.map((card, index) => (
            <div key={index} style={{ background: card.color, color: '#fff', padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.9 }}>{card.title}</span>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{card.value}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: '50%' }}>
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: theme.palette.background.paper, borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 16 }}>Filters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 8 }}>Start Date</label>
              <input
                type="date"
                style={{ 
                  padding: '12px 16px', 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: 8, 
                  width: '100%', 
                  boxSizing: 'border-box',
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontSize: 14
                }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 8 }}>End Date</label>
              <input
                type="date"
                style={{ 
                  padding: '12px 16px', 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: 8, 
                  width: '100%', 
                  boxSizing: 'border-box',
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontSize: 14
                }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 8 }}>Search</label>
              <input
                type="text"
                placeholder="Search by ID or cashier..."
                style={{ 
                  padding: '12px 16px', 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: 8, 
                  width: '100%', 
                  boxSizing: 'border-box',
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontSize: 14
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 8 }}>Status</label>
              <select
                style={{ 
                  padding: '12px 16px', 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: 8, 
                  width: '100%', 
                  boxSizing: 'border-box',
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontSize: 14
                }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Paid' | 'Pending')}
                disabled={loading}
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.palette.text.secondary, marginBottom: 8 }}>Payment Method</label>
              <select
                style={{ 
                  padding: '12px 16px', 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: 8, 
                  width: '100%', 
                  boxSizing: 'border-box',
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontSize: 14
                }}
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                disabled={loading}
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button
            onClick={handleExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              background: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              borderRadius: 8,
              border: 'none',
              cursor: loading || filteredData.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || filteredData.length === 0 ? 0.7 : 1,
              transition: 'background-color 0.2s ease',
              fontSize: 14,
              fontWeight: 600
            }}
            disabled={loading || filteredData.length === 0}
          >
            <Download style={{ height: 20, width: 20, marginRight: 8 }} />
            Export to PDF
          </button>
        </div>

        {/* Report Table */}
        <div style={{ background: theme.palette.background.paper, borderRadius: 16, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[1] }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
              <thead style={{ background: theme.palette.background.default, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <tr>
                  <th scope="col" style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Payment ID
                  </th>
                  <th scope="col" style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Transaction ID
                  </th>
                  <th scope="col" style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Patient ID
                  </th>
                  <th scope="col" style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Date
                  </th>
                  <th scope="col" style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Cashier
                  </th>
                  <th scope="col" style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Payment Method
                  </th>
                  <th scope="col" style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Amount
                  </th>
                  <th scope="col" style={{ padding: '16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 'wider' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody style={{ background: theme.palette.background.paper }}>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px', textAlign: 'center', fontSize: 14, color: theme.palette.text.secondary }}>
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px', textAlign: 'center', fontSize: 14, color: theme.palette.error.main }}>
                      {error}
                    </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <tr key={item.Payment_ID} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: theme.palette.text.primary }}>
                        {item.Payment_ID}
                      </td>
                      <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.secondary }}>
                        {item.transaction_ID}
                      </td>
                      <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.secondary }}>
                        {item.Patient_ID}
                      </td>
                      <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.secondary }}>
                        {item.approved_at || item.created_at.split('T')[0]}
                      </td>
                      <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.secondary }}>
                        {item.approved_by}
                      </td>
                      <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.secondary }}>
                        {item.approved_payment_method}
                      </td>
                      <td style={{ padding: '16px', fontSize: 14, color: theme.palette.text.secondary }}>
                        Tsh {parseFloat(item.approved_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            borderRadius: 12,
                            background: item.status === 'Paid' ? theme.palette.success.light : theme.palette.warning.light,
                            color: item.status === 'Paid' ? theme.palette.success.dark : theme.palette.warning.dark,
                          }}
                        >
                          {item.status === 'Paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px', textAlign: 'center', fontSize: 14, color: theme.palette.text.secondary }}>
                      No data found for the selected criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: `1px solid ${theme.palette.divider}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: theme.palette.text.secondary }}>Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  style={{ 
                    border: `1px solid ${theme.palette.divider}`, 
                    borderRadius: 8, 
                    padding: '8px 12px',
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    fontSize: 14
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ 
                    padding: 8, 
                    borderRadius: 8, 
                    border: `1px solid ${theme.palette.divider}`, 
                    color: theme.palette.text.primary, 
                    background: theme.palette.background.paper,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ChevronLeft style={{ height: 20, width: 20 }} />
                </button>
                <span style={{ fontSize: 14, color: theme.palette.text.secondary }}>
                  Page {currentPage} of {totalPages} ({totalItems} items)
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ 
                    padding: 8, 
                    borderRadius: 8, 
                    border: `1px solid ${theme.palette.divider}`, 
                    color: theme.palette.text.primary, 
                    background: theme.palette.background.paper,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ChevronRight style={{ height: 20, width: 20 }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Summary */}
        <div style={{ background: theme.palette.background.paper, borderRadius: 16, padding: 24, marginTop: 24, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[1] }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: theme.palette.text.primary }}>Detailed Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: theme.palette.text.secondary, margin: 0, marginBottom: 8 }}>Average Amount</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>
                Tsh {summaryStats.averageAmount.toFixed(2)}
              </p>
            </div>
            <div style={{ background: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: theme.palette.text.secondary, margin: 0, marginBottom: 8 }}>Cash Payments</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>
                {summaryStats.cashPayments}
              </p>
            </div>
            <div style={{ background: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: theme.palette.text.secondary, margin: 0, marginBottom: 8 }}>Card Payments</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>
                {summaryStats.cardPayments}
              </p>
            </div>
            <div style={{ background: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: theme.palette.text.secondary, margin: 0, marginBottom: 8 }}>Mobile Payments</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>
                {summaryStats.mobilePayments}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentReport;