import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Edit, Users, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../../constants';
import { useNavigate } from 'react-router-dom';

interface Pharmacy {
  id: number;
  user_id: number;
  name: string;
  license_number: string;
  address: string;
  contact_phone: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  branches?: Branch[];
}

interface Branch {
  id: number;
  name: string;
  pharmacy_id: number;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  position: string;
  email: string;
  username: string;
  belonged_branches: number[] | number | string | null; // Support array or single value
  created_at: string;
  updated_at: string | null;
}

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openPharmacyDialog, setOpenPharmacyDialog] = useState(false);
  const [openBranchDialog, setOpenBranchDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPharmacy, setCurrentPharmacy] = useState<Pharmacy | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<number | ''>('');

  const [pharmacyFormData, setPharmacyFormData] = useState({
    name: '',
    license_number: '',
    address: '',
    contact_phone: '',
  });
  const [branchFormData, setBranchFormData] = useState({ name: '' });
  const [assignFormData, setAssignFormData] = useState({ belonged_branches: [] as number[] });

  useEffect(() => {
    fetchPharmaciesAndBranches();
    fetchEmployees();
    // Ensure user's branch is included as a fallback
    if (user?.branch_id && user?.branch_name) {
      const userBranch = { id: Number(user.branch_id), name: user.branch_name, pharmacy_id: 0 };
      setAllBranches((prev) => 
        prev.some(b => b.id === userBranch.id) ? prev : [...prev, userBranch]
      );
    }
  }, [user]);

  const fetchPharmaciesAndBranches = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      logout();
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/pharmacies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Pharmacies fetch error:', errorData);
        if (response.status === 401) throw new Error('Unauthenticated. Please log in again.');
        throw new Error(errorData.message || 'Failed to fetch pharmacies');
      }

      const data = await response.json();
      console.log('Pharmacies response:', data);
      const pharmacyList = Array.isArray(data) ? data : data.data || [];
      const updatedPharmacies = await Promise.all(
        pharmacyList.map(async (pharmacy: Pharmacy) => {
          const branches = await fetchBranches(pharmacy.id);
          return { ...pharmacy, branches };
        })
      );

      setPharmacies(updatedPharmacies);
      const allBranchesList = updatedPharmacies.flatMap((p) => p.branches || []).map((b) => ({
        ...b,
        pharmacy_id: updatedPharmacies.find((p) => p.branches?.some((br) => br.id === b.id))?.id || 0,
      }));

      // Include user's branch if not present
      if (user?.branch_id && user?.branch_name) {
        const userBranch = { id: Number(user.branch_id), name: user.branch_name, pharmacy_id: 0 };
        if (!allBranchesList.some(b => b.id === userBranch.id)) {
          allBranchesList.push(userBranch);
        }
      }

      setAllBranches(allBranchesList);
      console.log('All branches after fetch:', allBranchesList);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching pharmacies');
      if (err.message.includes('Unauthenticated')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (pharmacyId: number): Promise<Branch[]> => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/pharmacies/${pharmacyId}/branches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Branches fetch error for pharmacy ${pharmacyId}:`, errorData);
        if (response.status === 401) throw new Error('Unauthenticated.');
        if (response.status === 403) return [];
        throw new Error(errorData.message || 'Failed to fetch branches');
      }

      const data = await response.json();
      console.log(`Branches for pharmacy ${pharmacyId}:`, data);
      const branches = Array.isArray(data) ? data : data.data || [];
      return branches.map((branch: any) => ({
        id: branch.id,
        name: branch.name || 'Unnamed Branch',
      }));
    } catch (err) {
      console.error(`Error fetching branches for pharmacy ${pharmacyId}:`, err);
      return [];
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      logout();
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Employees fetch error:', errorData);
        if (response.status === 401) throw new Error('Unauthenticated. Please log in again.');
        throw new Error(errorData.message || 'Failed to fetch employees');
      }

      const data = await response.json();
      console.log('Employees response:', data);
      const employeeData = Array.isArray(data) ? data : data.data || [];
      setEmployees(employeeData);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching employees');
      if (err.message.includes('Unauthenticated')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPharmacyDialog = (pharmacy?: Pharmacy) => {
    if (pharmacy) {
      setEditMode(true);
      setCurrentPharmacy(pharmacy);
      setPharmacyFormData({
        name: pharmacy.name,
        license_number: pharmacy.license_number,
        address: pharmacy.address,
        contact_phone: pharmacy.contact_phone,
      });
    } else {
      setEditMode(false);
      setCurrentPharmacy(null);
      setPharmacyFormData({ name: '', license_number: '', address: '', contact_phone: '' });
    }
    setOpenPharmacyDialog(true);
  };

  const handleOpenBranchDialog = () => {
    setSelectedPharmacyId(pharmacies.length > 0 ? pharmacies[0].id : '');
    setBranchFormData({ name: '' });
    setOpenBranchDialog(true);
  };

  const handleOpenAssignDialog = () => {
    setOpenAssignDialog(true);
    setSelectedEmployeeId('');
    setAssignFormData({ belonged_branches: [] });
  };

  const handleCloseDialog = () => {
    setOpenPharmacyDialog(false);
    setOpenBranchDialog(false);
    setOpenAssignDialog(false);
    setError('');
    setSuccess('');
  };

  const handlePharmacyFormChange = (field: keyof typeof pharmacyFormData, value: string) => {
    setPharmacyFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBranchFormChange = (field: 'name', value: string) => {
    setBranchFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssignFormChange = (value: number[]) => {
    setAssignFormData({ belonged_branches: value });
  };

  const handlePharmacySubmit = async () => {
    if (!pharmacyFormData.name.trim() || !pharmacyFormData.license_number.trim() || !pharmacyFormData.address.trim() || !pharmacyFormData.contact_phone.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      logout();
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const url = editMode && currentPharmacy ? `${API_BASE_URL}/api/pharmacies/${currentPharmacy.id}` : `${API_BASE_URL}/api/pharmacies`;
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(pharmacyFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) throw new Error('Unauthenticated. Please log in again.');
        throw new Error(errorData.message || `Failed to ${editMode ? 'update' : 'create'} pharmacy`);
      }

      setSuccess(`Pharmacy ${editMode ? 'updated' : 'created'} successfully!`);
      fetchPharmaciesAndBranches();
      setTimeout(handleCloseDialog, 1500);
    } catch (err: any) {
      setError(err.message || `An error occurred while ${editMode ? 'updating' : 'creating'} the pharmacy`);
      if (err.message.includes('Unauthenticated')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSubmit = async () => {
    if (!selectedPharmacyId) {
      setError('Please select a pharmacy');
      return;
    }
    if (!branchFormData.name.trim()) {
      setError('Branch name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      logout();
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/pharmacies/${selectedPharmacyId}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(branchFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) throw new Error('Unauthenticated. Please log in again.');
        throw new Error(errorData.message || 'Failed to create branch');
      }

      setSuccess('Branch created successfully!');
      fetchPharmaciesAndBranches();
      setTimeout(handleCloseDialog, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the branch');
      if (err.message.includes('Unauthenticated')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBranches = async () => {
    if (!selectedEmployeeId) {
      setError('Please select an employee to assign branches.');
      return;
    }
    if (assignFormData.belonged_branches.length === 0) {
      setError('At least one branch is required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      logout();
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      console.log('Assigning branches payload:', { belonged_branches: assignFormData.belonged_branches });
      const response = await fetch(`${API_BASE_URL}/api/employees/${selectedEmployeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ belonged_branches: assignFormData.belonged_branches }), // Send array
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Assign branches error:', errorData);
        if (response.status === 401) throw new Error('Unauthenticated. Please log in again.');
        throw new Error(errorData.message || 'Failed to assign branches');
      }

      const data = await response.json();
      console.log('Assign branches response:', data);
      setSuccess('Branches assigned successfully!');
      fetchEmployees();
      setTimeout(handleCloseDialog, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while assigning branches');
      if (err.message.includes('Unauthenticated')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getBranchNameById = (branchId: number): string => {
    const branch = allBranches.find((b) => b.id === branchId);
    return branch ? branch.name : `Unknown Branch (${branchId})`;
  };

  const getBranchesString = (branches: number[] | number | string | null): string => {
    if (!branches) return 'No branches';
    if (Array.isArray(branches)) {
      return branches.map((id) => getBranchNameById(Number(id))).join(', ') || 'No branches';
    }
    return getBranchNameById(Number(branches));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: '#2e7d32',
          fontWeight: 'bold',
          textAlign: 'center',
          mb: 4,
          animation: 'fadeIn 0.5s ease-in',
          '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
        }}
      >
        Pharmacy Management Settings
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4, gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleOpenPharmacyDialog()}
          startIcon={<Edit size={20} />}
          sx={{
            background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
            borderRadius: '12px',
            padding: '10px 24px',
            textTransform: 'none',
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              background: 'linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            },
          }}
        >
          Add Pharmacy
        </Button>
        <Button
          variant="contained"
          onClick={handleOpenBranchDialog}
          startIcon={<Plus size={20} />}
          sx={{
            background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
            borderRadius: '12px',
            padding: '10px 24px',
            textTransform: 'none',
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              background: 'linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            },
          }}
        >
          Add Branch
        </Button>
        <Button
          variant="contained"
          onClick={handleOpenAssignDialog}
          startIcon={<Users size={20} />}
          sx={{
            background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
            borderRadius: '12px',
            padding: '10px 24px',
            textTransform: 'none',
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              background: 'linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            },
          }}
        >
          Assign Branches
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress sx={{ color: '#2e7d32', size: 48 }} />
        </Box>
      )}

      {!loading && (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {success}
            </Alert>
          )}

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: '16px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(90deg, #e8f5e9 0%, #f1f8e9 100%)' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20', py: 3 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20', py: 3 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20', py: 3 }}>License Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20', py: 3 }}>Address</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20', py: 3 }}>Contact Phone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20', py: 3 }}>Branches</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20', py: 3 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pharmacies.map((pharmacy) => (
                  <TableRow
                    key={pharmacy.id}
                    sx={{
                      '&:hover': { backgroundColor: '#f9fafb' },
                      transition: 'background-color 0.3s',
                    }}
                  >
                    <TableCell sx={{ py: 2 }}>{pharmacy.id}</TableCell>
                    <TableCell sx={{ py: 2 }}>{pharmacy.name}</TableCell>
                    <TableCell sx={{ py: 2 }}>{pharmacy.license_number}</TableCell>
                    <TableCell sx={{ py: 2 }}>{pharmacy.address}</TableCell>
                    <TableCell sx={{ py: 2 }}>{pharmacy.contact_phone}</TableCell>
                    <TableCell sx={{ py: 2 }}>
                      {pharmacy.branches && pharmacy.branches.length > 0
                        ? pharmacy.branches.map((branch) => branch.name).join(', ')
                        : 'No branches'}
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Button
                        onClick={() => handleOpenPharmacyDialog(pharmacy)}
                        sx={{
                          color: '#2e7d32',
                          '&:hover': { color: '#1b5e20', backgroundColor: '#e8f5e9' },
                          borderRadius: '8px',
                          p: 1,
                        }}
                      >
                        <Edit size={20} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Pharmacy Add/Edit Dialog */}
      <Dialog
        open={openPharmacyDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: '#2e7d32', fontWeight: 'bold', textAlign: 'center' }}>
          {editMode ? 'Edit Pharmacy' : 'Add New Pharmacy'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Pharmacy Name *"
            value={pharmacyFormData.name}
            onChange={(e) => handlePharmacyFormChange('name', e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                transition: 'all 0.3s',
                '&:hover fieldset': { borderColor: '#2e7d32' },
                '&.Mui-focused fieldset': { borderColor: '#2e7d32', borderWidth: 2 },
              },
              '& .MuiInputLabel-root': { color: '#2e7d32' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#1b5e20' },
            }}
          />
          <TextField
            label="License Number *"
            value={pharmacyFormData.license_number}
            onChange={(e) => handlePharmacyFormChange('license_number', e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                transition: 'all 0.3s',
                '&:hover fieldset': { borderColor: '#2e7d32' },
                '&.Mui-focused fieldset': { borderColor: '#2e7d32', borderWidth: 2 },
              },
              '& .MuiInputLabel-root': { color: '#2e7d32' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#1b5e20' },
            }}
          />
          <TextField
            label="Address *"
            value={pharmacyFormData.address}
            onChange={(e) => handlePharmacyFormChange('address', e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                transition: 'all 0.3s',
                '&:hover fieldset': { borderColor: '#2e7d32' },
                '&.Mui-focused fieldset': { borderColor: '#2e7d32', borderWidth: 2 },
              },
              '& .MuiInputLabel-root': { color: '#2e7d32' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#1b5e20' },
            }}
          />
          <TextField
            label="Contact Phone *"
            value={pharmacyFormData.contact_phone}
            onChange={(e) => handlePharmacyFormChange('contact_phone', e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                transition: 'all 0.3s',
                '&:hover fieldset': { borderColor: '#2e7d32' },
                '&.Mui-focused fieldset': { borderColor: '#2e7d32', borderWidth: 2 },
              },
              '& .MuiInputLabel-root': { color: '#2e7d32' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#1b5e20' },
            }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2, borderRadius: '8px' }}>
              {success}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: '#2e7d32',
              fontWeight: 'bold',
              borderRadius: '12px',
              px: 3,
              '&:hover': { backgroundColor: '#e8f5e9' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePharmacySubmit}
            variant="contained"
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
              borderRadius: '12px',
              padding: '10px 24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.3s',
              '&:hover': {
                background: 'linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Branch Creation Dialog */}
      <Dialog
        open={openBranchDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: '#2e7d32', fontWeight: 'bold', textAlign: 'center' }}>
          Add New Branch
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel sx={{ color: '#2e7d32', '&.Mui-focused': { color: '#1b5e20' } }}>
              Select Pharmacy *
            </InputLabel>
            <Select
              value={selectedPharmacyId}
              onChange={(e) => setSelectedPharmacyId(e.target.value as number)}
              variant="outlined"
              sx={{
                borderRadius: '12px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#c8e6c9' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2e7d32' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2e7d32', borderWidth: 2 },
              }}
            >
              {pharmacies.map((pharmacy) => (
                <MenuItem key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Branch Name *"
            value={branchFormData.name}
            onChange={(e) => handleBranchFormChange('name', e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                transition: 'all 0.3s',
                '&:hover fieldset': { borderColor: '#2e7d32' },
                '&.Mui-focused fieldset': { borderColor: '#2e7d32', borderWidth: 2 },
              },
              '& .MuiInputLabel-root': { color: '#2e7d32' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#1b5e20' },
            }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2, borderRadius: '8px' }}>
              {success}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: '#2e7d32',
              fontWeight: 'bold',
              borderRadius: '12px',
              px: 3,
              '&:hover': { backgroundColor: '#e8f5e9' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBranchSubmit}
            variant="contained"
            disabled={loading || !selectedPharmacyId}
            sx={{
              background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
              borderRadius: '12px',
              padding: '10px 24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.3s',
              '&:hover': {
                background: 'linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Branches Dialog */}
      <Dialog
        open={openAssignDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: '#2e7d32', fontWeight: 'bold', textAlign: 'center' }}>
          Assign Branches to User
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel sx={{ color: '#2e7d32', '&.Mui-focused': { color: '#1b5e20' } }}>
              Select Employee *
            </InputLabel>
            <Select
              value={selectedEmployeeId}
              onChange={(e) => {
                const id = e.target.value as number;
                setSelectedEmployeeId(id);
                const emp = employees.find((emp) => emp.id === id);
                const currentBranches = emp?.belonged_branches
                  ? Array.isArray(emp.belonged_branches)
                    ? emp.belonged_branches.map((b) => Number(b))
                    : [Number(emp.belonged_branches)]
                  : [];
                setAssignFormData({ belonged_branches: currentBranches });
              }}
              variant="outlined"
              sx={{
                borderRadius: '12px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#c8e6c9' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2e7d32' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2e7d32', borderWidth: 2 },
              }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {`${emp.first_name} ${emp.last_name} (${emp.username})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel sx={{ color: '#2e7d32', '&.Mui-focused': { color: '#1b5e20' } }}>
              Select Branches *
            </InputLabel>
            <Select
              multiple
              value={assignFormData.belonged_branches}
              onChange={(e) => handleAssignFormChange(e.target.value as number[])}
              variant="outlined"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={getBranchNameById(value)} size="small" />
                  ))}
                </Box>
              )}
              sx={{
                borderRadius: '12px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#c8e6c9' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2e7d32' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2e7d32', borderWidth: 2 },
              }}
            >
              {allBranches.length > 0 ? (
                allBranches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name} (Pharmacy: {pharmacies.find((p) => p.id === branch.pharmacy_id)?.name || 'Unknown'})
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No branches available</MenuItem>
              )}
            </Select>
          </FormControl>
          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2, borderRadius: '8px' }}>
              {success}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: '#2e7d32',
              fontWeight: 'bold',
              borderRadius: '12px',
              px: 3,
              '&:hover': { backgroundColor: '#e8f5e9' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignBranches}
            variant="contained"
            disabled={loading || !selectedEmployeeId || assignFormData.belonged_branches.length === 0}
            sx={{
              background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
              borderRadius: '12px',
              padding: '10px 24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.3s',
              '&:hover': {
                background: 'linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SettingsPage;