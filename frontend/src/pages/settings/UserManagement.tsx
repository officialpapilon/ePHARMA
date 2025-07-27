import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment,
  Chip,
  Avatar,
  Tooltip,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  useTheme,
  DialogContentText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  GetApp as DownloadIcon,
  Subscriptions as SubscribeIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '../../../constants';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  position: string;
  email: string;
  pharmacy_id: number;
  belonged_branches: number | number[] | string | string[] | null;
  branch_name?: string;
  username: string;
  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  last_login_device: string | null;
}

interface Pharmacy {
  id: number;
  name: string;
  license_number: string;
  address: string;
  contact_phone: string;
}

interface Branch {
  id: number;
  name: string;
  pharmacy_id: number;
}

interface Subscription {
  id: number;
  user_id: number;
  plan: string;
  subscribed_at: string;
}

const positions = [
  'Super Admin',
  'Admin',
  'Manager',
  'Supervisor',
  'Cashier',
  'Sales Associate',
  'Technician',
  'Other',
];

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPharmacyDialog, setOpenPharmacyDialog] = useState(false);
  const [openBranchDialog, setOpenBranchDialog] = useState(false);
  const [openSubscribeDialog, setOpenSubscribeDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    position: '',
    email: '',
    pharmacy_id: 1,
    belonged_branches: [] as number[],
    username: '',
    password: '',
    password_confirmation: '',
  });

  const [pharmacyFormData, setPharmacyFormData] = useState({
    name: '',
    license_number: '',
    address: '',
    contact_phone: '',
  });
  const [branchFormData, setBranchFormData] = useState({ name: '' });
  const [subscribeFormData, setSubscribeFormData] = useState({ plan: 'basic' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    } else {
      fetchPharmacies();
      fetchBranches().then(() => fetchEmployees()); // Ensure branches load before employees
      fetchSubscriptions();
    }
  }, []);

  const fetchPharmacies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/pharmacies`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setPharmacies(data.data || data);
        if (data.data?.length > 0) {
          setFormData((prev) => ({ ...prev, pharmacy_id: data.data[0].id }));
          setSelectedPharmacyId(data.data[0].id);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch pharmacies');
      }
    } catch (err: any) {
      setError(`Error fetching pharmacies: ${err.message}`);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/branches`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await response.json();
      console.log('Branches response:', data); // Debug
      if (response.ok) {
        const branchData = data.data || data;
        setBranches(branchData);
        return branchData;
      } else {
        throw new Error(data.message || 'Failed to fetch branches');
      }
    } catch (err: any) {
      setError(`Error fetching branches: ${err.message}`);
      return [];
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(`Failed to fetch employees: ${response.status}`);
      }
      const data = await response.json();
      const employeeData = data.data || data;
      const mappedEmployees = employeeData.map((employee: any) => {
        let branchNames: string[] = [];
        if (Array.isArray(employee.belonged_branches)) {
          branchNames = employee.belonged_branches.map((branchId: number) => {
            const branch = branches.find((b) => b.id === Number(branchId));
            return branch ? branch.name : `Unknown (${branchId})`;
          });
        } else if (employee.belonged_branches !== null) {
          const branch = branches.find((b) => b.id === Number(employee.belonged_branches));
          branchNames = [branch ? branch.name : `Unknown (${employee.belonged_branches})`];
        }
        return {
          ...employee,
          branch_name: branchNames.length > 0 ? branchNames.join(', ') : 'No branches',
          last_login_at: employee.last_login_at || null,
          last_login_ip: employee.last_login_ip || null,
          last_login_device: employee.last_login_device || null,
        };
      });
      setEmployees(mappedEmployees);
      setSuccess('Employees loaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error fetching employees: ${err.message}`);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/subscriptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await response.json();
      console.log('Subscriptions response:', data); // Debug
      if (response.ok) {
        setSubscriptions(data.data || data);
      } else {
        throw new Error(data.message || 'Failed to fetch subscriptions');
      }
    } catch (err: any) {
      setError(`Error fetching subscriptions: ${err.message}`);
    }
  };

  const handleAddPharmacy = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { name, license_number, address, contact_phone } = pharmacyFormData;
      if (!name || !license_number || !address || !contact_phone) {
        throw new Error('All fields are required');
      }
      const response = await fetch(`${API_BASE_URL}/api/pharmacies`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(pharmacyFormData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create pharmacy');
      }
      fetchPharmacies();
      setOpenPharmacyDialog(false);
      setPharmacyFormData({ name: '', license_number: '', address: '', contact_phone: '' });
      setSuccess('Pharmacy created successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error creating pharmacy: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async () => {
    if (!selectedPharmacyId) {
      setError('Please select a pharmacy');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/pharmacies/${selectedPharmacyId}/branches`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(branchFormData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create branch');
      }
      fetchBranches();
      setOpenBranchDialog(false);
      setBranchFormData({ name: '' });
      setSuccess('Branch created successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error creating branch: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (formData.password.length < 8) throw new Error('Password must be at least 8 characters long');
      if (formData.password !== formData.password_confirmation) throw new Error('Passwords do not match');

      const payload = {
        ...formData,
        belonged_branches: formData.belonged_branches.length > 0 ? formData.belonged_branches : [branches[0]?.id],
      };

      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add employee');
      }

      const newEmployee = await response.json();
      fetchEmployees();
      setOpenAddDialog(false);
      resetForm();
      setSuccess('Employee added successfully');
      setTimeout(() => {
        setSuccess(null);
        setSelectedEmployee(newEmployee.data || newEmployee);
        setOpenSubscribeDialog(true);
      }, 3000);
    } catch (err: any) {
      setError(`Error adding employee: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        ...formData,
        belonged_branches: formData.belonged_branches.length > 0 ? formData.belonged_branches : [branches[0]?.id],
      };
      if (formData.password) {
        if (formData.password.length < 8) throw new Error('Password must be at least 8 characters long');
        if (formData.password !== formData.password_confirmation) throw new Error('Passwords do not match');
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      const response = await fetch(`${API_BASE_URL}/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update employee');
      }

      fetchEmployees();
      setOpenEditDialog(false);
      setSelectedEmployee(null);
      resetForm();
      setSuccess('Employee updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error updating employee: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedEmployee) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${selectedEmployee.id}/subscribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ plan: subscribeFormData.plan }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to subscribe user');
      }
      fetchSubscriptions();
      setOpenSubscribeDialog(false);
      setSubscribeFormData({ plan: 'basic' });
      setSuccess('User subscribed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error subscribing user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete employee');
      }
      fetchEmployees();
      setSuccess('Employee deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error deleting employee: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone_number: '',
      address: '',
      position: '',
      email: '',
      pharmacy_id: pharmacies[0]?.id || 1,
      belonged_branches: branches.length > 0 ? [branches[0].id] : [],
      username: '',
      password: '',
      password_confirmation: '',
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleOpenEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    let branchIds: number[] = [];
    if (Array.isArray(employee.belonged_branches)) {
      branchIds = employee.belonged_branches.map((b) => Number(b));
    } else if (employee.belonged_branches !== null) {
      branchIds = [Number(employee.belonged_branches)];
    }
    setFormData({
      ...employee,
      belonged_branches: branchIds.length > 0 ? branchIds : [branches[0]?.id],
      password: '',
      password_confirmation: '',
    });
    setOpenEditDialog(true);
  };

  const handleOpenSubscribeDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSubscribeFormData({ plan: 'basic' });
    setOpenSubscribeDialog(true);
  };

  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.first_name.toLowerCase().includes(searchLower) ||
      employee.last_name.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      employee.username.toLowerCase().includes(searchLower) ||
      employee.position.toLowerCase().includes(searchLower) ||
      (employee.branch_name && employee.branch_name.toLowerCase().includes(searchLower))
    );
  });

  const paginatedEmployees = filteredEmployees.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const getInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const getRandomColor = () => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.success.main,
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getBranchName = (branchId: number) => {
    const branch = branches.find((b) => b.id === branchId);
    return branch ? branch.name : `Unknown (${branchId})`;
  };

  const getPharmacyName = (pharmacyId: number) => {
    const pharmacy = pharmacies.find((p) => p.id === pharmacyId);
    return pharmacy ? pharmacy.name : `Pharmacy ${pharmacyId}`;
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      employees.map((emp) => ({
        ID: emp.id,
        'First Name': emp.first_name,
        'Last Name': emp.last_name,
        Username: emp.username,
        Email: emp.email,
        Phone: emp.phone_number,
        Position: emp.position,
        Pharmacy: getPharmacyName(emp.pharmacy_id),
        Branches: emp.branch_name,
        'Created At': format(new Date(emp.created_at), 'yyyy-MM-dd HH:mm'),
        'Last Login': emp.last_login_at ? format(new Date(emp.last_login_at), 'yyyy-MM-dd HH:mm') : 'Never',
        'Last IP': emp.last_login_ip || 'N/A',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    XLSX.writeFile(workbook, 'employees.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Employee List', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 22);

    const tableData = employees.map((emp) => [
      emp.id,
      `${emp.first_name} ${emp.last_name}`,
      emp.username,
      emp.position,
      getPharmacyName(emp.pharmacy_id),
      emp.branch_name || 'N/A',
      format(new Date(emp.created_at), 'yyyy-MM-dd'),
      emp.last_login_at ? format(new Date(emp.last_login_at), 'yyyy-MM-dd') : 'Never',
      emp.last_login_ip || 'N/A',
    ]);

    autoTable(doc, {
      head: [['ID', 'Name', 'Username', 'Position', 'Pharmacy', 'Branches', 'Created', 'Last Login', 'IP Address']],
      body: tableData,
      startY: 25,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
      },
    });
    doc.save('employees.pdf');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardHeader
          title="User Management"
          subheader="Manage pharmacies, branches, users, and subscriptions"
          titleTypographyProps={{ variant: 'h4', fontWeight: 'bold' }}
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenPharmacyDialog(true)}>
                Add Pharmacy
              </Button>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenBranchDialog(true)}>
                Add Branch
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportToExcel} disabled={loading}>
                Excel
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportToPDF} disabled={loading}>
                PDF
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAddDialog(true)} disabled={loading}>
                Add User
              </Button>
            </Box>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" startIcon={<FilterIcon />} disabled={loading}>
                Filters
              </Button>
              <Tooltip title="Refresh data">
                <IconButton onClick={fetchEmployees} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>

          {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <Table>
                  <TableHead sx={{ backgroundColor: theme.palette.grey[50] }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Position</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Pharmacy</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Branches</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Activity</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography variant="body1" color="textSecondary">
                            {searchTerm ? 'No matching users found' : 'No users available'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedEmployees.map((employee) => (
                        <TableRow key={employee.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: getRandomColor() }}>
                                {getInitials(employee.first_name, employee.last_name)}
                              </Avatar>
                              <Box>
                                <Typography fontWeight="medium">{`${employee.first_name} ${employee.last_name}`}</Typography>
                                <Typography variant="body2" color="textSecondary">@{employee.username}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography>{employee.email}</Typography>
                            <Typography variant="body2" color="textSecondary">{employee.phone_number}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={employee.position} size="small" sx={{ backgroundColor: theme.palette.grey[200] }} />
                          </TableCell>
                          <TableCell>
                            <Typography>{getPharmacyName(employee.pharmacy_id)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography>{employee.branch_name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {employee.last_login_at
                                ? `Last login: ${format(new Date(employee.last_login_at), 'MMM d, yyyy HH:mm')}`
                                : 'Never logged in'}
                            </Typography>
                            {employee.last_login_ip && (
                              <Typography variant="caption" color="textSecondary">IP: {employee.last_login_ip}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Tooltip title="Edit">
                                <IconButton
                                  onClick={() => handleOpenEditDialog(employee)}
                                  disabled={loading}
                                  sx={{ color: theme.palette.primary.main }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Subscribe">
                                <IconButton
                                  onClick={() => handleOpenSubscribeDialog(employee)}
                                  disabled={loading}
                                  sx={{ color: theme.palette.success.main }}
                                >
                                  <SubscribeIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  onClick={() => handleDeleteEmployee(employee.id)}
                                  disabled={loading}
                                  sx={{ color: theme.palette.error.main }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredEmployees.length > rowsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={Math.ceil(filteredEmployees.length / rowsPerPage)}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Pharmacy Dialog */}
      <Dialog open={openPharmacyDialog} onClose={() => setOpenPharmacyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Pharmacy</DialogTitle>
        <DialogContent>
          <TextField
            label="Pharmacy Name *"
            fullWidth
            value={pharmacyFormData.name}
            onChange={(e) => setPharmacyFormData({ ...pharmacyFormData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            label="License Number *"
            fullWidth
            value={pharmacyFormData.license_number}
            onChange={(e) => setPharmacyFormData({ ...pharmacyFormData, license_number: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            label="Address *"
            fullWidth
            value={pharmacyFormData.address}
            onChange={(e) => setPharmacyFormData({ ...pharmacyFormData, address: e.target.value })}
            margin="normal"
            required
            multiline
            rows={2}
          />
          <TextField
            label="Contact Phone *"
            fullWidth
            value={pharmacyFormData.contact_phone}
            onChange={(e) => setPharmacyFormData({ ...pharmacyFormData, contact_phone: e.target.value })}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPharmacyDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAddPharmacy} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Branch Dialog */}
      <Dialog open={openBranchDialog} onClose={() => setOpenBranchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Branch</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Pharmacy *</InputLabel>
            <Select
              value={selectedPharmacyId || ''}
              onChange={(e) => setSelectedPharmacyId(e.target.value as number)}
              label="Pharmacy *"
            >
              {pharmacies.map((pharmacy) => (
                <MenuItem key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Branch Name *"
            fullWidth
            value={branchFormData.name}
            onChange={(e) => setBranchFormData({ name: e.target.value })}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBranchDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAddBranch} variant="contained" disabled={loading || !selectedPharmacyId}>
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">Add New User</Typography>
          <DialogContentText>Fill in the details to create a new user account</DialogContentText>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name *"
                fullWidth
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name *"
                fullWidth
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email *"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number *"
                fullWidth
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Position *</InputLabel>
                <Select
                  value={formData.position}
                  label="Position *"
                  onChange={(e) => setFormData({ ...formData, position: e.target.value as string })}
                >
                  {positions.map((position) => (
                    <MenuItem key={position} value={position}>{position}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address *"
                fullWidth
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Pharmacy *</InputLabel>
                <Select
                  value={formData.pharmacy_id}
                  label="Pharmacy *"
                  onChange={(e) => setFormData({ ...formData, pharmacy_id: e.target.value as number })}
                >
                  {pharmacies.map((pharmacy) => (
                    <MenuItem key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Branches *</InputLabel>
                <Select
                  multiple
                  value={formData.belonged_branches}
                  label="Branches *"
                  onChange={(e) => setFormData({ ...formData, belonged_branches: e.target.value as number[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={getBranchName(value)} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {branches
                    .filter((b) => b.pharmacy_id === formData.pharmacy_id)
                    .map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Username *"
                fullWidth
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Password *"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirm Password *"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAddEmployee} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">Edit User</Typography>
          <DialogContentText>Update user details</DialogContentText>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name *"
                fullWidth
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name *"
                fullWidth
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email *"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number *"
                fullWidth
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Position *</InputLabel>
                <Select
                  value={formData.position}
                  label="Position *"
                  onChange={(e) => setFormData({ ...formData, position: e.target.value as string })}
                >
                  {positions.map((position) => (
                    <MenuItem key={position} value={position}>{position}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address *"
                fullWidth
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Pharmacy *</InputLabel>
                <Select
                  value={formData.pharmacy_id}
                  label="Pharmacy *"
                  onChange={(e) => setFormData({ ...formData, pharmacy_id: e.target.value as number })}
                >
                  {pharmacies.map((pharmacy) => (
                    <MenuItem key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Branches *</InputLabel>
                <Select
                  multiple
                  value={formData.belonged_branches}
                  label="Branches *"
                  onChange={(e) => setFormData({ ...formData, belonged_branches: e.target.value as number[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={getBranchName(value)} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {branches
                    .filter((b) => b.pharmacy_id === formData.pharmacy_id)
                    .map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Username *"
                fullWidth
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Change Password (leave blank to keep current password)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleEditEmployee} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subscribe Dialog */}
      <Dialog open={openSubscribeDialog} onClose={() => setOpenSubscribeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Subscribe User</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Subscription Plan</InputLabel>
            <Select
              value={subscribeFormData.plan}
              label="Subscription Plan"
              onChange={(e) => setSubscribeFormData({ plan: e.target.value as string })}
            >
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="premium">Premium</MenuItem>
              <MenuItem value="enterprise">Enterprise</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubscribeDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubscribe} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Subscribe'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;