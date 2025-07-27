import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { API_BASE_URL } from '../../../constants';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
} from '@mui/material';

interface Medicine {
  product_id: string; // Use product_id as per API payload
  product_name: string;
  product_category: string;
  current_quantity: number;
  product_price: number;
  expiry_date: string; // Optional, not present in sample payload
  batch_no: string; // Matches API's batch_no
}

interface ApiMedicineItem {
  id?: string | number;
  product_id?: string | number;
  product_name?: string;
  product_category?: string;
  current_quantity?: string | number;
  product_price?: string | number;
  expire_date?: string;
  batch_no?: string;
  product_unit?: string;
}

const StockManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchMedicines();
    }
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const response = await fetch(`${API_BASE_URL}/api/medicines-cache?all=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      console.log('Raw response from /medicines-cache:', text);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(`Failed to fetch medicines: ${response.status} - ${text || 'No response data'}`);
      }
      if (!text) {
        setMedicines([]);
        return;
      }
      const rawData = JSON.parse(text);
      if (!rawData.success || !Array.isArray(rawData.data)) {
        throw new Error('Expected an array of medicines.');
      }

      const parsedData: Medicine[] = rawData.data.map((item: ApiMedicineItem) => ({
        product_id: String(item.product_id),
        product_name: item.product_name || 'Unknown Product',
        product_category: item.product_category || 'N/A',
        current_quantity: parseInt(item.current_quantity as string, 10) || 0,
        product_price: parseFloat(item.product_price as string) || 0,
        expiry_date: item.expire_date || 'N/A',
        batch_no: item.batch_no || 'N/A',
      }));

      console.log('Parsed medicines:', parsedData);
      setMedicines(parsedData);
    } catch (err: unknown) {
      console.error('Fetch medicines error:', err);
      setError((err as Error).message);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.product_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.batch_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa' }}>
      <Typography variant="h6" component="h2" sx={{ color: '#2d3748' }}>
        Stock Manager
      </Typography>

      {/* Search */}
      <Box sx={{ position: 'relative', width: '100%', maxWidth: '384px', mb: 2 }}>
        <Box sx={{ position: 'absolute', inset: '0 0 auto 0', pl: 3, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <Search className="h-5 w-5 text-[#a0aec0]" />
        </Box>
        <TextField
          fullWidth
          placeholder="Search medicines..."
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#e2e8f0',
              },
              '&:hover fieldset': {
                borderColor: '#4c8bf5',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4c8bf5',
              },
              '& input': {
                color: '#4a5568',
              },
            },
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading}
        />
      </Box>

      {/* Loading and Error States */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} sx={{ color: '#4a5568' }} />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Medicines Table */}
      <Paper sx={{ borderRadius: 1, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f7fafc' }}>
              <TableRow>
                <TableCell sx={{ px: 6, py: 3, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'medium', textTransform: 'uppercase', color: '#4a5568', letterSpacing: 'wider' }}>
                  S/N
                </TableCell>
                <TableCell sx={{ px: 6, py: 3, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'medium', textTransform: 'uppercase', color: '#4a5568', letterSpacing: 'wider' }}>
                  Name
                </TableCell>
                <TableCell sx={{ px: 6, py: 3, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'medium', textTransform: 'uppercase', color: '#4a5568', letterSpacing: 'wider' }}>
                  Category
                </TableCell>
                <TableCell sx={{ px: 6, py: 3, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'medium', textTransform: 'uppercase', color: '#4a5568', letterSpacing: 'wider' }}>
                  Quantity
                </TableCell>
                <TableCell sx={{ px: 6, py: 3, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'medium', textTransform: 'uppercase', color: '#4a5568', letterSpacing: 'wider' }}>
                  Price
                </TableCell>
                <TableCell sx={{ px: 6, py: 3, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'medium', textTransform: 'uppercase', color: '#4a5568', letterSpacing: 'wider' }}>
                  Expiry Date
                </TableCell>
                <TableCell sx={{ px: 6, py: 3, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'medium', textTransform: 'uppercase', color: '#4a5568', letterSpacing: 'wider' }}>
                  Batch Number
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMedicines.length > 0 ? (
                filteredMedicines.map((medicine) => (
                  <TableRow key={medicine.product_id} sx={{ '&:hover': { bgcolor: '#edf2f7' } }}>
                    <TableCell sx={{ px: 6, py: 4, fontSize: '0.875rem', fontWeight: 'medium', color: '#2d3748' }}>
                      {medicines.indexOf(medicine) + 1}
                    </TableCell>
                    <TableCell sx={{ px: 6, py: 4, fontSize: '0.875rem', fontWeight: 'medium', color: '#2d3748' }}>
                      {medicine.product_name}
                    </TableCell>
                    <TableCell sx={{ px: 6, py: 4, fontSize: '0.875rem', color: '#4a5568' }}>
                      {medicine.product_category}
                    </TableCell>
                    <TableCell sx={{ px: 6, py: 4, fontSize: '0.875rem', color: '#4a5568' }}>
                      {medicine.current_quantity}
                    </TableCell>
                    <TableCell sx={{ px: 6, py: 4, fontSize: '0.875rem', color: '#4a5568' }}>
                      Tsh {medicine.product_price.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ px: 6, py: 4, fontSize: '0.875rem', color: '#4a5568' }}>
                      {medicine.expiry_date !== 'N/A'
                        ? new Date(medicine.expiry_date).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell sx={{ px: 6, py: 4, fontSize: '0.875rem', color: '#4a5568' }}>
                      {medicine.batch_no}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ px: 6, py: 4, textAlign: 'center', fontSize: '0.875rem', color: '#4a5568' }}>
                    No medicines found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default StockManager;

