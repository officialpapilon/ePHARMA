import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Save, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../../../constants';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';

interface Batch {
  batch_no: string;
  product_quantity: number;
  manufacture_date: string;
  expire_date: string;
}

interface Product {
  product_id: number;
  batches: Batch[];
}

interface StockTaking {
  id: number;
  products: Product[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Medicine {
  id: number;
  name: string;
  category: string;
  product_unit: string;
  price: number;
  created_by: string;
}

const StockTaking: React.FC = () => {
  const [stockTakings, setStockTakings] = useState<StockTaking[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [cart, setCart] = useState<Product[]>([]);
  const [itemDetails, setItemDetails] = useState<{ batches: Batch[] }>({ batches: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format dates as DD/MM/YYYY
  const formatDate = (date: string | null): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    } else {
      fetchMedicines();
      fetchStockTakings();
    }
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/medicines-cache?all=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      console.log('Raw response from /api/medicines-cache:', text);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
      }
      if (!text) {
        setMedicines([]);
        return;
      }
      const rawData = JSON.parse(text);
      if (!rawData.success || !Array.isArray(rawData.data)) {
        throw new Error('Expected an array of medicines');
      }
      const mappedMedicines = rawData.data.map((item: any) => ({
        id: item.id || item.product_id,
        name: item.product_name || 'Unknown Medicine',
        category: item.product_category || 'Medicine',
        product_unit: item.product_unit || 'Unit',
        price: parseFloat(item.product_price) || 0,
        created_by: item.created_by?.toString() || 'Unknown',
      }));
      if (mappedMedicines.some((m) => !m.id)) {
        throw new Error('Some medicines are missing an id/product_id');
      }
      console.log('Mapped medicines:', mappedMedicines);
      setMedicines(mappedMedicines);
    } catch (err: any) {
      console.error('Fetch medicines error:', err);
      setError('Unable to fetch medicines: ' + err.message);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockTakings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/stock-taking`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const text = await response.text();
      console.log('Raw response from /api/stock-taking:', text);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
      }
      if (!text) {
        setStockTakings([]);
        return;
      }
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid data format');
      setStockTakings(data);
    } catch (err: any) {
      console.error('Fetch stock-taking error:', err);
      setError('Unable to fetch stock-taking records: ' + err.message);
      setStockTakings([]);
    } finally {
      setLoading(false);
    }
  };

  const updateMedicineCache = async (products: Product[]) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found for cache update');
      return;
    }

    for (const product of products) {
      const totalQuantity = product.batches.reduce((sum, batch) => sum + batch.product_quantity, 0);
      const latestBatch = product.batches[product.batches.length - 1];
      
      // Find the existing medicine cache entry
      const existingMedicine = medicines.find(m => m.id === product.product_id);
      if (!existingMedicine) {
        console.error(`Medicine with ID ${product.product_id} not found in cache`);
        continue;
      }

      const payload = {
        current_quantity: totalQuantity,
        expire_date: latestBatch.expire_date,
        batch_no: latestBatch.batch_no,
      };
      console.log('Updating cache with payload:', JSON.stringify(payload, null, 2));

      try {
        const response = await fetch(`${API_BASE_URL}/api/medicines-cache/${product.product_id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(payload),
        });
        const text = await response.text();
        console.log(`Raw response from /api/medicines-cache/${product.product_id}:`, text);
        if (!response.ok) {
          console.error(`Cache update failed for product ${product.product_id}: HTTP ${response.status}: ${text}`);
          // Do NOT setError here to keep it silent for the user
        }
      } catch (err: any) {
        console.error('Update cache error for product', product.product_id, ':', err.message);
        // Do NOT setError here to keep it silent for the user
      }
    }
  };

  const handleAddStockTaking = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      if (cart.length === 0) {
        throw new Error('Please add at least one product with batches.');
      }

      const payload = {
        products: cart.map((item) => ({
          product_id: item.product_id,
          batches: item.batches,
        })),
        created_by: localStorage.getItem('username') || 'Admin',
      };
      console.log('Payload being sent to /api/stock-taking:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/stock-taking`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      console.log('Raw response from /api/stock-taking POST:', text);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
      }
      const addedStockTaking = JSON.parse(text);
      setStockTakings([...stockTakings, addedStockTaking]);

      // Attempt to update cache, but don’t let it affect the UI if it fails
      await updateMedicineCache(cart);

      // Reset UI regardless of cache update success
      setCart([]);
      setSelectedProductId(null);
      setItemDetails({ batches: [] });
    } catch (err: any) {
      console.error('Add stock-taking error:', err);
      setError(err.message || 'Unable to add stock-taking record.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

        const productsMap = new Map<number, Batch[]>();
        jsonData.forEach((row: any) => {
          const productId = parseInt(row.product_id);
          if (!isNaN(productId)) {
            if (!productsMap.has(productId)) {
              productsMap.set(productId, []);
            }
            productsMap.get(productId)!.push({
              batch_no: row.batch_no || 'Unknown',
              product_quantity: parseInt(row.product_quantity) || 0,
              manufacture_date: row.manufacture_date || '',
              expire_date: row.expire_date || '',
            });
          }
        });

        if (productsMap.size === 0) {
          throw new Error('No valid product IDs found in the Excel file.');
        }

        const payload = {
          products: Array.from(productsMap.entries()).map(([product_id, batches]) => ({
            product_id,
            batches,
          })),
          created_by: localStorage.getItem('username') || 'Admin',
        };
        console.log('Payload being sent to /api/stock-taking:', JSON.stringify(payload, null, 2));

        const response = await fetch(`${API_BASE_URL}/api/stock-taking`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(payload),
        });
        const text = await response.text();
        console.log('Raw response from /api/stock-taking POST:', text);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${text || 'Unknown error'}`);
        }
        const addedStockTaking = JSON.parse(text);
        setStockTakings([...stockTakings, addedStockTaking]);

        await updateMedicineCache(payload.products);

        fetchStockTakings();
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error('Upload Excel error:', err);
      setError(err.message || 'Unable to upload Excel file.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (selectedProductId === null) {
      setError('Please select a product.');
      return;
    }
    const product = medicines.find((p) => p.id === selectedProductId);
    if (!product) {
      setError('Selected product not found.');
      return;
    }
    const batches = itemDetails.batches;
    if (batches.length === 0 || !batches.every((b) => b.batch_no && b.product_quantity > 0 && b.manufacture_date && b.expire_date)) {
      setError('Please fill in all batch details correctly.');
      return;
    }
    setCart((prevCart) => [...prevCart, { product_id: selectedProductId, batches }]);
    setSelectedProductId(null);
    setItemDetails({ batches: [] });
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const addBatch = () => {
    setItemDetails((prev) => ({
      batches: [...prev.batches, { batch_no: '', product_quantity: 0, manufacture_date: '', expire_date: '' }],
    }));
  };

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      medicine.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  );


  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'grey.900' }}>
          Stock Taking
        </Typography>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Main Grid: Upload Excel and Select Item */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Left Section: Upload Excel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'grey.800' }}>
              Upload Excel
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'grey.700' }}>
                Upload File
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<Upload className="h-4 w-4" />}
                  disabled={loading}
                  sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                >
                  Choose File
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleUploadExcel}
                    style={{ display: 'none' }}
                    disabled={loading}
                  />
                </Button>
                <Typography variant="body2" sx={{ color: 'grey.500' }}>
                  {loading ? 'Uploading...' : 'No file chosen'}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              Columns: product_id, batch_no, product_quantity, manufacture_date, expire_date
            </Typography>
          </Paper>
        </Grid>

        {/* Right Section: Select Item */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'grey.800' }}>
              Select Item
            </Typography>
            <TextField
              fullWidth
              placeholder="Search medicines..."
              variant="outlined"
              size="small"
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: <Search className="h-5 w-5 text-gray.400" />,
              }}
              sx={{ mb: 2 }}
            />
            <Box sx={{ maxHeight: 256, overflow: 'auto' }}>
              {filteredMedicines.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 2, color: 'grey.600' }}>
                  No medicines available
                </Typography>
              ) : (
                <RadioGroup value={selectedProductId || ''}>
                  {filteredMedicines.map((medicine) => (
                    <FormControlLabel
                      key={medicine.id}
                      value={medicine.id}
                      control={
                        <Radio
                          checked={selectedProductId === medicine.id}
                          onChange={(e) => {
                            const newId = e.target.checked ? medicine.id : null;
                            console.log(`Radio changed: selectedProductId set to ${newId} (${medicine.name})`);
                            setSelectedProductId(newId);
                            setItemDetails({
                              batches: newId !== null ? [{ batch_no: '', product_quantity: 0, manufacture_date: '', expire_date: '' }] : [],
                            });
                          }}
                          disabled={loading}
                        />
                      }
                      label={medicine.name}
                      sx={{
                        '&:hover': { bgcolor: 'grey.50' },
                        p: 1,
                        borderRadius: 1,
                        transition: 'background-color 0.15s',
                      }}
                    />
                  ))}
                </RadioGroup>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Item Details Section */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, mb: 4 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'grey.800' }}>
          Item Details
        </Typography>
        {selectedProductId !== null ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, color: 'grey.700' }}>Selected Item *</Typography>
                <TextField
                  fullWidth
                  value={medicines.find((p) => p.id === selectedProductId)?.name || 'Unknown'}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, color: 'grey.700' }}>Unit of Measure</Typography>
                <TextField
                  fullWidth
                  value={medicines.find((p) => p.id === selectedProductId)?.product_unit || ''}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>
            </Box>
            {itemDetails.batches.map((batch, batchIndex) => (
              <Box key={batchIndex} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'flex-end' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'grey.700' }}>Batch Number *</Typography>
                  <TextField
                    fullWidth
                    value={batch.batch_no}
                    onChange={(e) =>
                      setItemDetails((prev) => ({
                        batches: prev.batches.map((b, i) =>
                          i === batchIndex ? { ...b, batch_no: e.target.value } : b
                        ),
                      }))
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      },
                    }}
                    disabled={loading}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'grey.700' }}>Quantity *</Typography>
                  <TextField
                    fullWidth
                    type="number"
                    min="1"
                    value={batch.product_quantity}
                    onChange={(e) =>
                      setItemDetails((prev) => ({
                        batches: prev.batches.map((b, i) =>
                          i === batchIndex ? { ...b, product_quantity: parseInt(e.target.value) || 0 } : b
                        ),
                      }))
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      },
                    }}
                    disabled={loading}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'grey.700' }}>Manufacture Date *</Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={batch.manufacture_date}
                    onChange={(e) =>
                      setItemDetails((prev) => ({
                        batches: prev.batches.map((b, i) =>
                          i === batchIndex ? { ...b, manufacture_date: e.target.value } : b
                        ),
                      }))
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      },
                    }}
                    disabled={loading}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'grey.700' }}>Expiry Date *</Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={batch.expire_date}
                    onChange={(e) =>
                      setItemDetails((prev) => ({
                        batches: prev.batches.map((b, i) =>
                          i === batchIndex ? { ...b, expire_date: e.target.value } : b
                        ),
                      }))
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      },
                    }}
                    disabled={loading}
                  />
                </Box>
                {itemDetails.batches.length > 1 && (
                  <Button
                    variant="outlined"
                    startIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() =>
                      setItemDetails((prev) => ({
                        batches: prev.batches.filter((_, i) => i !== batchIndex),
                      }))
                    }
                    sx={{
                      borderRadius: 1,
                      borderColor: 'error.main',
                      color: 'error.main',
                      '&:hover': { bgcolor: 'error.light' },
                    }}
                    disabled={loading}
                  >
                    Remove Batch
                  </Button>
                )}
              </Box>
            ))}
            <Button
              variant="outlined"
              startIcon={<Plus className="h-4 w-4" />}
              onClick={addBatch}
              sx={{
                borderRadius: 1,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.light' },
              }}
              disabled={loading}
            >
              Add Batch
            </Button>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ textAlign: 'center', py: 2, color: 'grey.600' }}>
            No item selected
          </Typography>
        )}
        <Button
          variant="contained"
          startIcon={<Plus className="h-4 w-4" />}
          onClick={addToCart}
          sx={{
            mt: 2,
            borderRadius: 1,
            bgcolor: 'success.main',
            '&:hover': { bgcolor: 'success.dark' },
          }}
          disabled={loading || selectedProductId === null}
        >
          Add Item
        </Button>
      </Paper>

      {/* Cart Section */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'grey.800' }}>
          Cart
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ px: 2, py: 1, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'semibold', color: 'grey.600', textTransform: 'uppercase', letterSpacing: 'wider' }}>S/N</TableCell>
                <TableCell sx={{ px: 2, py: 1, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'semibold', color: 'grey.600', textTransform: 'uppercase', letterSpacing: 'wider' }}>Product</TableCell>
                <TableCell sx={{ px: 2, py: 1, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'semibold', color: 'grey.600', textTransform: 'uppercase', letterSpacing: 'wider' }}>Batch Number</TableCell>
                <TableCell sx={{ px: 2, py: 1, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'semibold', color: 'grey.600', textTransform: 'uppercase', letterSpacing: 'wider' }}>Quantity</TableCell>
                <TableCell sx={{ px: 2, py: 1, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'semibold', color: 'grey.600', textTransform: 'uppercase', letterSpacing: 'wider' }}>Manufacture Date</TableCell>
                <TableCell sx={{ px: 2, py: 1, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'semibold', color: 'grey.600', textTransform: 'uppercase', letterSpacing: 'wider' }}>Expiry Date</TableCell>
                <TableCell sx={{ px: 2, py: 1, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'semibold', color: 'grey.600', textTransform: 'uppercase', letterSpacing: 'wider' }}>Created By</TableCell>
                <TableCell sx={{ px: 2, py: 1, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'semibold', color: 'grey.600', textTransform: 'uppercase', letterSpacing: 'wider' }}>Created At</TableCell>
                <TableCell sx={{ px: 2, py: 1, textAlign: 'left', fontSize: '0.75rem', fontWeight: 'semibold', color: 'grey.600', textTransform: 'uppercase', letterSpacing: 'wider' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ '& .MuiTableRow-root:hover': { bgcolor: 'grey.50' } }}>
              {cart.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ px: 2, py: 2, textAlign: 'center', fontSize: '0.875rem', color: 'grey.600' }}>
                    No items added
                  </TableCell>
                </TableRow>
              ) : (
                cart.map((item, index) =>
                  item.batches.map((batch, batchIndex) => (
                    <TableRow key={`${item.product_id}-${batchIndex}`}>
                      <TableCell sx={{ px: 2, py: 1, fontSize: '0.875rem', color: 'grey.600' }}>{index + batchIndex + 1}</TableCell>
                      <TableCell sx={{ px: 2, py: 1, fontSize: '0.875rem', fontWeight: 'medium', color: 'grey.800' }}>
                        {medicines.find((m) => m.id === item.product_id)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell sx={{ px: 2, py: 1, fontSize: '0.875rem', color: 'grey.600' }}>{batch.batch_no}</TableCell>
                      <TableCell sx={{ px: 2, py: 1, fontSize: '0.875rem', color: 'grey.600' }}>{batch.product_quantity}</TableCell>
                      <TableCell sx={{ px: 2, py: 1, fontSize: '0.875rem', color: 'grey.600' }}>{formatDate(batch.manufacture_date)}</TableCell>
                      <TableCell sx={{ px: 2, py: 1, fontSize: '0.875rem', color: 'grey.600' }}>{formatDate(batch.expire_date)}</TableCell>
                      <TableCell sx={{ px: 2, py: 1, fontSize: '0.875rem', color: 'grey.600' }}>{localStorage.getItem('username') || 'Admin'}</TableCell>
                      <TableCell sx={{ px: 2, py: 1, fontSize: '0.875rem', color: 'grey.600' }}>{formatDate(new Date().toISOString())}</TableCell>
                      <TableCell sx={{ px: 2, py: 1, fontSize: '0.875rem', color: 'grey.600' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            startIcon={<Trash2 className="h-4 w-4" />}
                            onClick={() => removeFromCart(item.product_id)}
                            sx={{
                              borderRadius: 1,
                              borderColor: 'error.main',
                              color: 'error.main',
                              '&:hover': { bgcolor: 'error.light' },
                            }}
                            disabled={loading}
                          >
                            Remove
                          </Button>
                          {index === cart.length - 1 && batchIndex === item.batches.length - 1 && (
                            <Button
                              variant="contained"
                              startIcon={<Save className="h-4 w-4" />}
                              onClick={handleAddStockTaking}
                              sx={{
                                borderRadius: 1,
                                bgcolor: 'success.main',
                                '&:hover': { bgcolor: 'success.dark' },
                              }}
                              disabled={loading}
                            >
                              Save
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
};

export default StockTaking;