// import React, { useState } from 'react';
// import { Calendar, Download, Filter, Search, Package, Check, Clock, DollarSign } from 'lucide-react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable'; // Explicitly import autoTable
// import * as XLSX from 'xlsx';

// interface ReportItem {
//   id: string;
//   date: string;
//   customer: {
//     id: string;
//     name: string;
//     phone: string;
//   };
//   pharmacist: string;
//   items: {
//     id: string;
//     name: string;
//     quantity: number;
//     price: number;
//   }[];
//   total: number;
//   status: 'Paid' | 'Pending';
// }

// const DispensingReport = () => {
//   const [startDate, setStartDate] = useState('2025-02-01');
//   const [endDate, setEndDate] = useState('2025-02-28');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [pharmacistFilter, setPharmacistFilter] = useState('All');
//   const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');

//   const reportData: ReportItem[] = [
//     { id: 'TRX-001', date: '2025-02-28 10:30 AM', customer: { id: '1', name: 'John Smith', phone: '123-456-7890' }, pharmacist: 'Dr. Jane Wilson', items: [{ id: '1', name: 'Paracetamol 500mg', quantity: 2, price: 5.99 }, { id: '2', name: 'Amoxicillin 250mg', quantity: 1, price: 12.50 }], total: 24.48, status: 'Paid' },
//     { id: 'TRX-002', date: '2025-02-28 11:45 AM', customer: { id: '2', name: 'Sarah Johnson', phone: '234-567-8901' }, pharmacist: 'Dr. Robert Taylor', items: [{ id: '3', name: 'Ibuprofen 400mg', quantity: 1, price: 7.25 }, { id: '4', name: 'Cetirizine 10mg', quantity: 2, price: 8.75 }], total: 24.75, status: 'Pending' },
//     { id: 'TRX-003', date: '2025-02-27 02:15 PM', customer: { id: '3', name: 'Michael Brown', phone: '345-678-9012' }, pharmacist: 'Dr. Jane Wilson', items: [{ id: '5', name: 'Omeprazole 20mg', quantity: 1, price: 15.00 }], total: 15.00, status: 'Paid' },
//     { id: 'TRX-004', date: '2025-02-26 03:30 PM', customer: { id: '4', name: 'Emily Davis', phone: '456-789-0123' }, pharmacist: 'Dr. Robert Taylor', items: [{ id: '1', name: 'Paracetamol 500mg', quantity: 3, price: 5.99 }, { id: '3', name: 'Ibuprofen 400mg', quantity: 1, price: 7.25 }], total: 25.22, status: 'Pending' },
//     { id: 'TRX-005', date: '2025-02-25 09:15 AM', customer: { id: '1', name: 'John Smith', phone: '123-456-7890' }, pharmacist: 'Dr. Jane Wilson', items: [{ id: '3', name: 'Ibuprofen 400mg', quantity: 1, price: 7.25 }, { id: '5', name: 'Omeprazole 20mg', quantity: 1, price: 15.00 }], total: 22.25, status: 'Paid' }
//   ];

//   const pharmacists = ['All', 'Dr. Jane Wilson', 'Dr. Robert Taylor'];

//   const filteredData = reportData.filter(item => {
//     const itemDate = new Date(item.date.split(' ')[0]);
//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     end.setHours(23, 59, 59, 999);

//     return (
//       itemDate >= start &&
//       itemDate <= end &&
//       (item.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         item.customer.phone.includes(searchTerm)) &&
//       (pharmacistFilter === 'All' || item.pharmacist === pharmacistFilter) &&
//       (statusFilter === 'All' || item.status === statusFilter)
//     );
//   });

//   const totalSales = filteredData.reduce((sum, item) => sum + item.total, 0);
//   const totalItems = filteredData.reduce((sum, item) => sum + item.items.reduce((itemSum, product) => itemSum + product.quantity, 0), 0);
//   const paidTransactions = filteredData.filter(item => item.status === 'Paid');
//   const pendingTransactions = filteredData.filter(item => item.status === 'Pending');
//   const paidAmount = paidTransactions.reduce((sum, item) => sum + item.total, 0);
//   const pendingAmount = pendingTransactions.reduce((sum, item) => sum + item.total, 0);

//   const salesByPharmacist = pharmacists.slice(1).map(pharmacist => ({
//     pharmacist,
//     sales: filteredData.filter(item => item.pharmacist === pharmacist).reduce((sum, item) => sum + item.total, 0)
//   }));

//   const salesByDay: { day: string; sales: number }[] = [];
//   const startDateObj = new Date(startDate);
//   const endDateObj = new Date(endDate);
//   for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
//     const day = d.toISOString().split('T')[0];
//     const daySales = filteredData
//       .filter(item => item.date.split(' ')[0] === day)
//       .reduce((sum, item) => sum + item.total, 0);
//     salesByDay.push({
//       day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
//       sales: daySales
//     });
//   }

//   // Export to PDF (Fixed)
//   const exportToPDF = () => {
//     const doc = new jsPDF();
//     doc.text('Dispensing Report', 10, 10);
//     doc.text(`Date Range: ${startDate} to ${endDate}`, 10, 20);

//     const tableData = filteredData.map(item => [
//       item.id,
//       item.date,
//       `${item.customer.name} (${item.customer.phone})`,
//       item.pharmacist,
//       item.items.map(i => `${i.name} x ${i.quantity}`).join(', '),
//       `$${item.total.toFixed(2)}`,
//       item.status
//     ]);

//     autoTable(doc, {
//       head: [['ID', 'Date', 'Customer', 'Pharmacist', 'Items', 'Total', 'Status']],
//       body: tableData,
//       startY: 30,
//       styles: { fontSize: 10 },
//       headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
//     });

//     doc.save(`Dispensing_Report_${startDate}_to_${endDate}.pdf`);
//   };

//   // Export to Excel (Unchanged)
//   const exportToExcel = () => {
//     const worksheetData = filteredData.map(item => ({
//       'Transaction ID': item.id,
//       'Date': item.date,
//       'Customer': `${item.customer.name} (${item.customer.phone})`,
//       'Pharmacist': item.pharmacist,
//       'Items': item.items.map(i => `${i.name} x ${i.quantity}`).join(', '),
//       'Total': item.total.toFixed(2),
//       'Status': item.status
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(worksheetData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispensing Report');
//     XLSX.writeFile(workbook, `Dispensing_Report_${startDate}_to_${endDate}.xlsx`);
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 p-6">
//       <div className="max-w-auto mx-auto space-y-6">
//         <h2 className="text-2xl font-bold text-gray-800">Dispensing Report</h2>

//         {/* Filters */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
//             <div className="relative">
//               <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="date"
//                 className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//               />
//             </div>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
//             <div className="relative">
//               <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="date"
//                 className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//               />
//             </div>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search customer or ID..."
//                 className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacist</label>
//             <div className="relative">
//               <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <select
//                 className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
//                 value={pharmacistFilter}
//                 onChange={(e) => setPharmacistFilter(e.target.value)}
//               >
//                 {pharmacists.map(pharmacist => (
//                   <option key={pharmacist} value={pharmacist}>{pharmacist}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//             <div className="relative">
//               <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <select
//                 className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Paid' | 'Pending')}
//               >
//                 <option value="All">All Status</option>
//                 <option value="Paid">Paid</option>
//                 <option value="Pending">Pending</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Export Buttons */}
//         <div className="flex justify-end gap-4">
//           <button
//             onClick={exportToPDF}
//             className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
//           >
//             <Download className="h-5 w-5 mr-2" />
//             Export PDF
//           </button>
//           <button
//             onClick={exportToExcel}
//             className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
//           >
//             <Download className="h-5 w-5 mr-2" />
//             Export Excel
//           </button>
//         </div>

//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <div className="bg-white p-6 rounded-lg shadow border">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Total Sales</p>
//                 <p className="mt-2 text-3xl font-semibold">Tsh {totalSales.toFixed(2)}</p>
//               </div>
//               <div className="p-3 rounded-full bg-green-100">
//                 <DollarSign className="h-6 w-6 text-green-600" />
//               </div>
//             </div>
//           </div>
//           <div className="bg-white p-6 rounded-lg shadow border">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Items Dispensed</p>
//                 <p className="mt-2 text-3xl font-semibold">{totalItems}</p>
//               </div>
//               <div className="p-3 rounded-full bg-blue-100">
//                 <Package className="h-6 w-6 text-blue-600" />
//               </div>
//             </div>
//           </div>
//           <div className="bg-white p-6 rounded-lg shadow border">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Paid Amount</p>
//                 <p className="mt-2 text-3xl font-semibold">Tsh {paidAmount.toFixed(2)}</p>
//               </div>
//               <div className="p-3 rounded-full bg-green-100">
//                 <Check className="h-6 w-6 text-green-600" />
//               </div>
//             </div>
//             <p className="mt-2 text-sm text-gray-500">{paidTransactions.length} transactions</p>
//           </div>
//           <div className="bg-white p-6 rounded-lg shadow border">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Pending Amount</p>
//                 <p className="mt-2 text-3xl font-semibold">Tsh {pendingAmount.toFixed(2)}</p>
//               </div>
//               <div className="p-3 rounded-full bg-yellow-100">
//                 <Clock className="h-6 w-6 text-yellow-600" />
//               </div>
//             </div>
//             <p className="mt-2 text-sm text-gray-500">{pendingTransactions.length} transactions</p>
//           </div>
//         </div>

//         {/* Charts */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div className="bg-white p-6 rounded-lg shadow border">
//             <h3 className="text-md font-medium mb-4">Sales by Pharmacist</h3>
//             <div className="h-64">
//               <div className="h-full flex items-end space-x-4">
//                 {salesByPharmacist.map((item, index) => (
//                   <div key={index} className="flex-1 flex flex-col items-center">
//                     <div
//                       className="w-full bg-indigo-500 rounded-t"
//                       style={{ height: `${item.sales > 0 ? (item.sales / Math.max(...salesByPharmacist.map(i => i.sales)) * 100) : 0}%` }}
//                     ></div>
//                     <div className="text-xs mt-2 text-center">{item.pharmacist}</div>
//                     <div className="text-xs font-medium">Tsh {item.sales.toFixed(2)}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//           <div className="bg-white p-6 rounded-lg shadow border">
//             <h3 className="text-md font-medium mb-4">Daily Sales</h3>
//             <div className="h-64">
//               <div className="h-full flex items-end space-x-1">
//                 {salesByDay.map((item, index) => (
//                   <div key={index} className="flex-1 flex flex-col items-center">
//                     <div
//                       className="w-full bg-green-500 rounded-t"
//                       style={{ height: `${item.sales > 0 ? (item.sales / Math.max(...salesByDay.map(i => i.sales)) * 100) : 0}%` }}
//                     ></div>
//                     <div className="text-xs mt-2 text-center">{item.day}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Report Table */}
//         <div className="bg-white p-6 rounded-lg shadow-md border">
//           <h3 className="text-lg font-semibold text-gray-700 mb-4">Transaction Details</h3>
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacist</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredData.length > 0 ? (
//                   filteredData.map(item => (
//                     <tr key={item.id}>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         <div>
//                           <p className="font-medium">{item.customer.name}</p>
//                           <p className="text-xs">{item.customer.phone}</p>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.pharmacist}</td>
//                       <td className="px-6 py-4 text-sm text-gray-500">
//                         <ul className="list-disc list-inside">
//                           {item.items.map(product => (
//                             <li key={product.id}>{product.name} x {product.quantity}</li>
//                           ))}
//                         </ul>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Tsh {item.total.toFixed(2)}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
//                           {item.status}
//                         </span>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No data found for the selected criteria</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Summary */}
//         <div className="bg-gray-50 p-4 rounded-md border">
//           <h3 className="text-md font-medium mb-2">Report Summary</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <p className="text-sm text-gray-500">Total Transactions</p>
//               <p className="text-xl font-semibold">{filteredData.length}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-500">Total Items</p>
//               <p className="text-xl font-semibold">{totalItems}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-500">Total Sales</p>
//               <p className="text-xl font-semibold">Tsh {totalSales.toFixed(2)}</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DispensingReport;


import React, { useState, useEffect } from 'react';
import { Calendar, Download, Filter, Search, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../../constants'; // Adjust path as needed
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportItem {
  id: string;
  date: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  pharmacist: string;
  items: {
    id: string;
    name: string;
    quantity: number;
  }[];
}

const DispensingReport = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pharmacistFilter, setPharmacistFilter] = useState('All');
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [pharmacists, setPharmacists] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchPharmacists();
      fetchReportData();
    }
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(
        `${API_BASE_URL}/api/dispensing-report?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );
      const text = await response.text();
      console.log('Raw response from /dispensing-report:', text);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/login';
          return;
        }
        if (response.status === 404) {
          setReportData([]);
          return; // No data found, treat as empty
        }
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
      }
      if (!text) {
        setReportData([]);
        return;
      }
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format');
      }
      setReportData(data);
    } catch (err: any) {
      console.error('Fetch report error:', err.message);
      setError(
        err.message === 'No authentication token found'
          ? 'Please log in to access this page.'
          : 'Unable to fetch dispensing report. Please try again later.'
      );
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPharmacists = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/pharmacists`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      console.log('Raw response from /pharmacists:', text);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
      }
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format');
      }
      setPharmacists(['All', ...data.map((p: any) => p.name)]);
    } catch (err: any) {
      console.error('Fetch pharmacists error:', err.message);
      setPharmacists(['All']); // Fallback to 'All'
    }
  };

  const filteredData = reportData.filter((item) => {
    const itemDate = new Date(item.date.split(' ')[0]);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const inDateRange = itemDate >= start && itemDate <= end;
    const matchesSearch =
      item.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPharmacist = pharmacistFilter === 'All' || item.pharmacist === pharmacistFilter;

    return inDateRange && matchesSearch && matchesPharmacist;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = 'Pharmacy Dispensing Report';
    const dateRange = `Date Range: ${startDate} to ${endDate}`;
    const filteredBy = `Pharmacist: ${pharmacistFilter}`;
    const generatedOn = `Generated on: ${new Date().toLocaleString()}`;

    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(dateRange, 14, 30);
    doc.text(filteredBy, 14, 40);
    doc.setFontSize(10);
    doc.text(generatedOn, 14, 50);

    const tableData = filteredData.map((item) => [
      item.id,
      item.date,
      `${item.customer.name} (${item.customer.phone})`,
      item.pharmacist,
      item.items.map((med) => `${med.name} x ${med.quantity}`).join(', '),
    ]);

    (doc as any).autoTable({
      head: [['Transaction ID', 'Date', 'Customer', 'Pharmacist', 'Items Dispensed']],
      body: tableData,
      startY: 60,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [66, 66, 66], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    const summaryY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Report Summary', 14, summaryY);
    doc.setFontSize(10);
    doc.text(`Total Transactions: ${filteredData.length}`, 14, summaryY + 10);
    doc.text(
      `Total Customers: ${new Set(filteredData.map((item) => item.customer.id)).size}`,
      14,
      summaryY + 20
    );
    doc.text(
      `Total Items Dispensed: ${filteredData.reduce(
        (total, item) => total + item.items.reduce((sum, med) => sum + med.quantity, 0),
        0
      )}`,
      14,
      summaryY + 30
    );

    doc.save(`dispensing_report_${startDate}_to_${endDate}.pdf`);
  };

  const exportToExcel = () => {
    const worksheetData = filteredData.map((item) => ({
      'Transaction ID': item.id,
      Date: item.date,
      'Customer Name': item.customer.name,
      'Customer Phone': item.customer.phone,
      Pharmacist: item.pharmacist,
      'Items Dispensed': item.items.map((med) => `${med.name} x ${med.quantity}`).join(', '),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispensing Report');
    XLSX.writeFile(workbook, `dispensing_report_${startDate}_to_${endDate}.xlsx`);
  };

  const handleRefresh = () => {
    fetchReportData();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-auto mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dispensing Report</h1>
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
            disabled={loading}
            title="Refresh Report"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && (
          <div className="text-center text-gray-600 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading report...
          </div>
        )}
        {error && (
          <div className="text-center text-red-600 bg-red-50 p-3 rounded-md mb-4">{error}</div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by customer or ID..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacist</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  value={pharmacistFilter}
                  onChange={(e) => setPharmacistFilter(e.target.value)}
                  disabled={loading}
                >
                  {pharmacists.map((pharmacist) => (
                    <option key={pharmacist} value={pharmacist}>
                      {pharmacist}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReportData}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition-colors duration-200"
                disabled={loading}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={exportToPDF}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200"
            disabled={loading || filteredData.length === 0}
          >
            <Download className="h-5 w-5 mr-2" />
            Export as PDF
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200"
            disabled={loading || filteredData.length === 0}
          >
            <Download className="h-5 w-5 mr-2" />
            Export as Excel
          </button>
        </div>

        {/* Report Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Dispensing Records</h2>
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pharmacist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items Dispensed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-100">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>
                            <p className="font-medium">{item.customer.name}</p>
                            <p className="text-xs text-gray-500">{item.customer.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.pharmacist}
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
                        colSpan={5}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No dispensing records found for the selected criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Summary Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredData.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600">Unique Customers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(filteredData.map((item) => item.customer.id)).size}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600">Total Items Dispensed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredData.reduce(
                  (total, item) => total + item.items.reduce((sum, med) => sum + med.quantity, 0),
                  0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispensingReport;
