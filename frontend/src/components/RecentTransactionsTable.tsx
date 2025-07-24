import React from 'react';
import { useTheme } from '@mui/material';

interface RecentTransactionsTableProps {
  transactions: {
    id: string;
    customer: string;
    date: string;
    amount: number;
    status: 'Completed' | 'Pending';
    type: 'Credit' | 'Mobile Money' | 'Cash';
  }[];
}

const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({ transactions }) => {
  const theme = useTheme();
  return (
    <div style={{ overflowX: 'auto', borderRadius: 16, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[1], background: theme.palette.background.paper }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: theme.palette.primary.main }}>
            <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 1 }}>Customer</th>
            <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 1 }}>Date</th>
            <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 1 }}>Amount</th>
            <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 1 }}>Status</th>
            <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: theme.palette.primary.contrastText, textTransform: 'uppercase', letterSpacing: 1 }}>Type</th>
          </tr>
        </thead>
        <tbody style={{ background: theme.palette.background.paper }}>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 32, textAlign: 'center', fontSize: 16, color: theme.palette.text.secondary }}>
                No transactions found
              </td>
            </tr>
          ) : (
            transactions.map((tx, idx) => (
              <tr
                key={tx.id}
                style={{
                  background: idx % 2 === 0 ? theme.palette.background.paper : theme.palette.action.hover,
                  transition: 'background 0.2s',
                }}
              >
                <td style={{ padding: '16px 20px', color: theme.palette.text.primary, fontWeight: 500 }}>{tx.customer}</td>
                <td style={{ padding: '16px 20px', color: theme.palette.text.primary }}>{tx.date}</td>
                <td style={{ padding: '16px 20px', color: theme.palette.text.primary }}>Tsh {tx.amount.toFixed(2)}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontWeight: 600,
                    background: tx.status === 'Completed' ? theme.palette.success.light : theme.palette.warning.light,
                    color: tx.status === 'Completed' ? theme.palette.success.dark : theme.palette.warning.dark,
                  }}>
                    {tx.status}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', color: theme.palette.text.primary }}>{tx.type}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RecentTransactionsTable;