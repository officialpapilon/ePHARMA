import React from 'react';
import { X, Printer } from 'lucide-react';
import { useTheme } from '@mui/material';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface Item {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Transaction {
  id: string;
  payment_ID: string;
  customer: Customer;
  date: string;
  items: Item[];
  total: number;
  status: 'Approved';
  approved_payment_method: 'cash' | 'mobile' | 'card';
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, transaction }) => {
  const theme = useTheme();
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(55,65,81,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: theme.palette.background.paper, color: theme.palette.text.primary, padding: 24, borderRadius: 16, boxShadow: theme.shadows[4], width: '100%', maxWidth: 480, border: `1px solid ${theme.palette.divider}`, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Print-specific styles */}
        <style>{`
            @media print {
            .no-print { display: none; }
            .receipt-container { padding: 0; border: none; box-shadow: none; width: 100%; max-width: 100%; }
            .receipt-table { width: 100%; border-collapse: collapse; }
            .receipt-table th, .receipt-table td { border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; }
            .receipt-table th { background-color: #f7fafc; }
          }
        `}</style>
        <div className="receipt-container">
          <div className="flex justify-between items-center mb-6 no-print">
            <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.palette.text.primary }}>Transaction Receipt</h2>
            <button onClick={onClose} style={{ color: theme.palette.text.secondary }}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-6">
            <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 8 }}>Transaction Details</h3>
            <div style={{ fontSize: 14, color: theme.palette.text.secondary, lineHeight: 1.7 }}>
              <p><span style={{ fontWeight: 500 }}>Transaction ID:</span> {transaction.id}</p>
              <p><span style={{ fontWeight: 500 }}>Payment ID:</span> {transaction.payment_ID}</p>
              <p><span style={{ fontWeight: 500 }}>Date:</span> {transaction.date}</p>
              <p><span style={{ fontWeight: 500 }}>Status:</span> {transaction.status}</p>
              <p><span style={{ fontWeight: 500 }}>Payment Method:</span> {transaction.approved_payment_method}</p>
            </div>
          </div>
          <div className="mb-6">
            <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 8 }}>Customer Information</h3>
            <div style={{ fontSize: 14, color: theme.palette.text.secondary, lineHeight: 1.7 }}>
              <p><span style={{ fontWeight: 500 }}>Name:</span> {transaction.customer.first_name} {transaction.customer.last_name}</p>
              <p><span style={{ fontWeight: 500 }}>Phone:</span> {transaction.customer.phone || 'N/A'}</p>
            </div>
          </div>
          <div className="mb-6">
            <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.palette.text.primary, marginBottom: 8 }}>Items Purchased</h3>
            <table className="receipt-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: theme.palette.primary.main }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', borderRight: `1px solid ${theme.palette.divider}` }}>Item</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', borderRight: `1px solid ${theme.palette.divider}` }}>Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', borderRight: `1px solid ${theme.palette.divider}` }}>Price</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item) => (
                  <tr key={item.id} style={{ background: theme.palette.background.paper }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500, color: theme.palette.text.primary }}>{item.name}</td>
                    <td style={{ padding: '10px 12px', color: theme.palette.text.secondary }}>{item.quantity}</td>
                    <td style={{ padding: '10px 12px', color: theme.palette.text.secondary }}>Tsh {item.price.toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', color: theme.palette.text.secondary }}>Tsh {(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: theme.palette.action.hover }}>
                  <td colSpan={3} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: theme.palette.text.secondary }}>Total:</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: theme.palette.text.primary }}>Tsh {transaction.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex justify-end gap-4 no-print">
            <button
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', background: theme.palette.primary.main, color: theme.palette.primary.contrastText, borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', marginRight: 8 }}
            >
              <Printer className="h-5 w-5 mr-2" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              style={{ padding: '8px 16px', background: theme.palette.action.hover, color: theme.palette.text.primary, borderRadius: 8, border: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;