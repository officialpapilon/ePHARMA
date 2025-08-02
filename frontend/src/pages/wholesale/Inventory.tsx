import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Inventory: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Inventory
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Inventory management coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Inventory; 