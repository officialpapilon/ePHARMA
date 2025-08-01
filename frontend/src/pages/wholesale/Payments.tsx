import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Payments: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Payments
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Payments management coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Payments; 