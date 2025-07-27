import React from 'react';
import { Package } from 'lucide-react';
import { useTheme } from '@mui/material';

const TestComponent: React.FC = () => {
  const theme = useTheme();

  return (
    <div style={{ 
      padding: '16px', 
      background: theme.palette.background.default, 
      minHeight: '100vh', 
      width: '100%', 
      maxWidth: '100vw', 
      boxSizing: 'border-box' 
    }}>
      <h1>Store Module Test</h1>
      <p>This is a test component to check if the store module is working.</p>
      <Package style={{ width: 32, height: 32, color: theme.palette.primary.main }} />
      <p>If you can see the package icon above, the imports are working correctly.</p>
    </div>
  );
};

export default TestComponent; 