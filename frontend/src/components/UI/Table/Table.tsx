import React from 'react';
import { useTheme } from '@mui/material';
import type { Column } from '../../../lib/types';

interface TableProps {
  loading: boolean;
  columns: Column[];
  data: any[];
  onClick?: (row: any) => void;
}

const Table: React.FC<TableProps> = ({ loading, columns, data, onClick }) => {
  const theme = useTheme();
  return (
    <div
      style={{
        overflow: 'hidden',
        borderRadius: 20,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 4px 32px rgba(0, 80, 180, 0.08)',
        background: theme.palette.background.paper,
        margin: '0 auto',
        maxWidth: '100%',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: '#1976d2' }}>
            <th
              style={{
                padding: '16px 20px',
                textAlign: 'left',
                fontSize: 15,
                fontWeight: 800,
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: 1,
                borderRight: `1px solid ${theme.palette.divider}`,
                borderTopLeftRadius: 20,
              }}
            >
              SN
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  borderRight: `1px solid ${theme.palette.divider}`,
                  ...(column.key === columns[columns.length - 1].key && {
                    borderTopRightRadius: 20,
                  }),
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ background: theme.palette.background.paper }}>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                style={{ padding: 32, textAlign: 'center', color: theme.palette.text.secondary }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div
                    style={{
                      borderRadius: '50%',
                      height: 48,
                      width: 48,
                      borderTop: `2px solid #1976d2`,
                      borderBottom: `2px solid #90caf9`,
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? ( 
            <tr>
              <td
                colSpan={columns.length + 1}
                style={{ padding: 32, textAlign: 'center', fontSize: 16, color: theme.palette.text.secondary }}
              >
                No data found
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onClick?.(row)}
                style={{
                  cursor: onClick ? 'pointer' : undefined,
                  transition: 'background 0.2s, box-shadow 0.2s',
                  background:
                    rowIndex % 2 === 0
                      ? theme.palette.background.paper
                      : 'rgba(25, 118, 210, 0.04)',
                  animation: 'fadeIn 0.5s',
                  boxShadow: onClick ? '0 2px 8px rgba(25, 118, 210, 0.04)' : undefined,
                }}
                onMouseOver={e => {
                  if (onClick) e.currentTarget.style.background = 'rgba(25, 118, 210, 0.08)';
                }}
                onMouseOut={e => {
                  if (onClick)
                    e.currentTarget.style.background =
                      rowIndex % 2 === 0
                        ? theme.palette.background.paper
                        : 'rgba(25, 118, 210, 0.04)';
                }}
                tabIndex={0}
                aria-label={`Row ${rowIndex + 1}`}
              >
                <td
                  style={{
                    padding: '16px 20px',
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    borderRight: `1px solid ${theme.palette.divider}`,
                    fontSize: 15,
                  }}
                >
                  {rowIndex + 1}
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      padding: '16px 20px',
                      color: theme.palette.text.primary,
                      borderRight: `1px solid ${theme.palette.divider}`,
                      fontSize: 15,
                    }}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
};

export default Table;