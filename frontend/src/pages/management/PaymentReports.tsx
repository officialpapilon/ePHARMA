import React, { useState, useEffect } from 'react';
import { Calendar, Download, Filter, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { API_BASE_URL } from '../../../constants';
import { useTheme } from '@mui/material';

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

const PaymentReport = () => {
  const theme = useTheme();
  const [startDate, setStartDate] = useState('2025-01-01'); // Adjusted to include sample data
  const [endDate, setEndDate] = useState('2025-12-31'); // Adjusted to include sample data
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentMethods = ['All', 'CASH', 'CARD', 'MOBILE']; // Match backend casing

  useEffect(() => {
    fetchPaymentReports();
  }, []);

  const fetchPaymentReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/payment-approve`, {
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
    } catch (err: any) {
      console.error('Fetch payment reports error:', err.message);
      setError('Unable to fetch payment reports: ' + err.message);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = reportData.filter((item) => {
    const itemDate = new Date(item.approved_at || item.created_at.split('T')[0]);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set to end of day

    const inDateRange = itemDate >= start && itemDate <= end;

    const matchesSearch =
      item.transaction_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Patient_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.approved_by.toLowerCase().includes(searchTerm.toLowerCase());

    const normalizedStatus = item.status === 'Approved' ? 'Paid' : 'Pending';
    const matchesStatus = statusFilter === 'All' || normalizedStatus === statusFilter;

    const matchesPaymentMethod =
      paymentMethodFilter === 'All' || item.approved_payment_method === paymentMethodFilter;

    return inDateRange && matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  const handleExport = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Payment Report', 14, 22);

    doc.setFontSize(12);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 32);

    (doc as any).autoTable({
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
        item.status === 'Approved' ? 'Paid' : 'Pending',
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Summary', 14, finalY);
    doc.text(`Total Transactions: ${filteredData.length}`, 14, finalY + 10);
    doc.text(
      `Total Amount: Tsh ${filteredData
        .reduce((sum, item) => sum + parseFloat(item.approved_amount), 0)
        .toFixed(2)}`,
      14,
      finalY + 20
    );
    doc.text(
      `Completed Payments: ${filteredData.filter((item) => item.status === 'Approved').length}`,
      14,
      finalY + 30
    );

    doc.save(`Payment_Report_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.palette.background.default, padding: 32 }}>
      <header style={{ background: theme.palette.background.paper, boxShadow: theme.shadows[1], marginBottom: 24 }}>
        <div style={{ maxWidth: '100%', padding: '16px 24px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.palette.text.primary }}>Management Payment Report</h1>
        </div>
      </header>
      <main style={{ maxWidth: '100%' }}>
      {error && (
          <div style={{ background: theme.palette.error.light, border: `1px solid ${theme.palette.error.main}`, color: theme.palette.error.dark, padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '0 0 0 0', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              style={{ paddingLeft: 40, paddingRight: 10, paddingTop: 10, paddingBottom: 10, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '0 0 0 0', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              style={{ paddingLeft: 40, paddingRight: 10, paddingTop: 10, paddingBottom: 10, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '0 0 0 0', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by ID or cashier..."
              style={{ paddingLeft: 40, paddingRight: 10, paddingTop: 10, paddingBottom: 10, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '0 0 0 0', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              style={{ paddingLeft: 40, paddingRight: 10, paddingTop: 10, paddingBottom: 10, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Paid' | 'Pending')}
              disabled={loading}
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '0 0 0 0', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              style={{ paddingLeft: 40, paddingRight: 10, paddingTop: 10, paddingBottom: 10, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}
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

      {/* Export Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <button
          onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', background: theme.palette.primary.main, color: theme.palette.primary.contrastText, borderRadius: 8, cursor: 'pointer', border: 'none', fontSize: 14, fontWeight: 600, boxShadow: theme.shadows[1] }}
          disabled={loading || filteredData.length === 0}
        >
          <Download className="h-5 w-5 mr-2" />
          Export to PDF
        </button>
      </div>

      {/* Report Table */}
        <div style={{ background: theme.palette.background.paper, borderRadius: 8, overflow: 'hidden', boxShadow: theme.shadows[1] }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
              <thead style={{ background: theme.palette.background.default, color: theme.palette.text.primary }}>
              <tr>
                  <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  Payment ID
                </th>
                  <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  Transaction ID
                </th>
                  <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  Patient ID
                </th>
                  <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  Date
                </th>
                  <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  Cashier
                </th>
                  <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  Payment Method
                </th>
                  <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  Amount
                </th>
                  <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  Status
                </th>
              </tr>
            </thead>
              <tbody style={{ background: theme.palette.background.paper }}>
              {loading ? (
                <tr>
                    <td colSpan={8} style={{ padding: '16px 16px', textAlign: 'center', fontSize: 14, color: theme.palette.text.secondary }}>
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                    <td colSpan={8} style={{ padding: '16px 16px', textAlign: 'center', fontSize: 14, color: theme.palette.error.main }}>
                    {error}
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                    <tr key={item.Payment_ID} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: theme.palette.text.primary }}>
                      {item.Payment_ID}
                    </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                      {item.transaction_ID}
                    </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                      {item.Patient_ID}
                    </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                      {item.approved_at || item.created_at.split('T')[0]}
                    </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                      {item.approved_by}
                    </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                      {item.approved_payment_method}
                    </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: theme.palette.text.secondary }}>
                      Tsh {parseFloat(item.approved_amount).toFixed(2)}
                    </td>
                      <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                            color: item.status === 'Approved' ? theme.palette.success.main : theme.palette.warning.main,
                            backgroundColor: item.status === 'Approved' ? theme.palette.success.light : theme.palette.warning.light,
                          }}
                      >
                        {item.status === 'Approved' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={8} style={{ padding: '16px 16px', textAlign: 'center', fontSize: 14, color: theme.palette.text.secondary }}>
                    No data found for the selected criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
        <div style={{ background: theme.palette.background.paper, borderRadius: 8, padding: 24, marginTop: 24, boxShadow: theme.shadows[1] }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: theme.palette.text.primary }}>Report Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ background: theme.palette.background.paper, borderRadius: 8, padding: 16, boxShadow: theme.shadows[1] }}>
              <p style={{ fontSize: 14, color: theme.palette.text.secondary }}>Total Transactions</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>{filteredData.length}</p>
          </div>
            <div style={{ background: theme.palette.background.paper, borderRadius: 8, padding: 16, boxShadow: theme.shadows[1] }}>
              <p style={{ fontSize: 14, color: theme.palette.text.secondary }}>Total Amount</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>
              Tsh {filteredData.reduce((sum, item) => sum + parseFloat(item.approved_amount), 0).toFixed(2)}
            </p>
          </div>
            <div style={{ background: theme.palette.background.paper, borderRadius: 8, padding: 16, boxShadow: theme.shadows[1] }}>
              <p style={{ fontSize: 14, color: theme.palette.text.secondary }}>Completed Payments</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>
              {filteredData.filter((item) => item.status === 'Approved').length}
            </p>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
};

export default PaymentReport;