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
  Switch,
  FormControlLabel,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
  Security as SecurityIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  FilterAlt as FilterAltIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SupervisorIcon,
  Store as StoreIcon,
  LocalPharmacy as PharmacyIcon,
  Payment as PaymentIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Report as ReportIcon,
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon,
  Login as LoginIcon,
  DeviceHub as DeviceIcon,
  Public as PublicIcon,
  Key as KeyIcon,
  Shield as ShieldIcon,
  VerifiedUser as VerifiedUserIcon,
  AccountCircle as AccountCircleIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  School as SchoolIcon,
  BusinessCenter as BusinessCenterIcon,
  Storefront as StorefrontIcon,
  LocalHospital as LocalHospitalIcon,
  LocalShipping as LocalShippingIcon,
  LocalOffer as LocalOfferIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  TableChart as TableChartIcon,
  ViewColumn as ViewColumnIcon,
  ViewHeadline as ViewHeadlineIcon,
  ViewQuilt as ViewQuiltIcon,
  ViewComfy as ViewComfyIcon,
  ViewCompact as ViewCompactIcon,
  ViewStream as ViewStreamIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  ViewAgenda as ViewAgendaIcon,
  ViewCarousel as ViewCarouselIcon,
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
  status: 'active' | 'inactive' | 'suspended' | 'locked';
  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  last_login_device: string | null;
  permissions?: string[];
  role?: string;
  login_attempts?: number;
  locked_until?: string | null;
  two_factor_enabled?: boolean;
  session_timeout?: number;
  allowed_ips?: string[];
  department?: string;
  employee_id?: string;
  hire_date?: string;
  salary?: number;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
  avatar?: string;
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

const POSITIONS = [
  { value: 'Super Admin', label: 'Super Admin', level: 10, color: '#d32f2f' },
  { value: 'Admin', label: 'Administrator', level: 9, color: '#f57c00' },
  { value: 'Manager', label: 'Manager', level: 8, color: '#1976d2' },
  { value: 'Supervisor', label: 'Supervisor', level: 7, color: '#388e3c' },
  { value: 'Pharmacist', label: 'Pharmacist', level: 6, color: '#7b1fa2' },
  { value: 'Cashier', label: 'Cashier', level: 5, color: '#c2185b' },
  { value: 'Sales Associate', label: 'Sales Associate', level: 4, color: '#ff8f00' },
  { value: 'Technician', label: 'Technician', level: 3, color: '#455a64' },
  { value: 'Assistant', label: 'Assistant', level: 2, color: '#757575' },
  { value: 'Other', label: 'Other', level: 1, color: '#9e9e9e' },
];

const UserManagement: React.FC = () => {
  const theme = useTheme();
  
  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    position: '',
    pharmacy: '',
    branch: '',
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog States
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openSecurityDialog, setOpenSecurityDialog] = useState(false);
  const [openSubscriptionDialog, setOpenSubscriptionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  
  // Form States
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
    role: '',
    permissions: [] as string[],
    department: '',
    employee_id: '',
    hire_date: '',
    salary: 0,
    emergency_contact: '',
    emergency_phone: '',
    notes: '',
    two_factor_enabled: false,
    session_timeout: 30,
    allowed_ips: [] as string[],
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    } else {
      initializeData();
    }
  }, []);

  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPharmacies(),
        fetchBranches(),
        fetchEmployees(),
        fetchSubscriptions(),
      ]);
    } catch (error) {
      setError('Failed to initialize data');
    } finally {
      setLoading(false);
    }
  };

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
          setFormData(prev => ({ ...prev, pharmacy_id: data.data[0].id }));
        }
      } else {
        // If pharmacies endpoint doesn't work, create mock data
        const mockPharmacies = [
          {
            id: 1,
            name: 'Main Pharmacy',
            license_number: 'PH001',
            address: '123 Main St, Dar es Salaam',
            contact_phone: '+255 22 123 456',
          }
        ];
        setPharmacies(mockPharmacies);
        setFormData(prev => ({ ...prev, pharmacy_id: 1 }));
      }
    } catch (err: any) {
      // Fallback to mock data
      const mockPharmacies = [
        {
          id: 1,
          name: 'Main Pharmacy',
          license_number: 'PH001',
          address: '123 Main St, Dar es Salaam',
          contact_phone: '+255 22 123 456',
        }
      ];
      setPharmacies(mockPharmacies);
      setFormData(prev => ({ ...prev, pharmacy_id: 1 }));
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      // Since we don't have a direct /api/branches endpoint, we'll use the pharmacy branches endpoint
      // For now, we'll create a mock list based on the database structure
      const mockBranches = [
        {
          id: 1,
          name: 'Main Branch',
          pharmacy_id: 1,
          address: '123 Main St, Dar es Salaam',
          contact_phone: '+255 22 123 456',
          is_active: true,
          created_at: '2025-07-27 19:42:16',
          updated_at: '2025-08-01 15:59:30',
        },
        {
          id: 2,
          name: 'Arusha Branch',
          pharmacy_id: 1,
          address: '456 Oak Ave, Arusha',
          contact_phone: '+255 27 123 456',
          is_active: true,
          created_at: '2025-07-27 19:42:20',
          updated_at: '2025-07-27 19:42:20',
        },
        {
          id: 3,
          name: 'Mwanza Branch',
          pharmacy_id: 1,
          address: '789 Pine Rd, Mwanza',
          contact_phone: '+255 28 123 456',
          is_active: false,
          created_at: '2025-07-27 19:42:20',
          updated_at: '2025-08-01 16:10:11',
        }
      ];
      
      setBranches(mockBranches);
    } catch (err: any) {
      setError(`Error fetching branches: ${err.message}`);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all users from the database
      const response = await fetch(`${API_BASE_URL}/api/users`, {
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
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const mappedUsers = data.data.map((user: any) => {
          let branchNames: string[] = [];
          if (user.belonged_branches) {
            try {
              const branches = JSON.parse(user.belonged_branches);
              if (Array.isArray(branches)) {
                branchNames = branches.map((branchId: number) => {
                  const branch = branches.find((b: any) => b.id === Number(branchId));
                  return branch ? branch.name : `Branch ${branchId}`;
                });
              }
            } catch (e) {
              // If parsing fails, treat as single branch
              branchNames = [`Branch ${user.belonged_branches}`];
            }
          }
          
          return {
            ...user,
            branch_name: branchNames.length > 0 ? branchNames.join(', ') : 'No branches assigned',
            last_login_at: user.last_login_at || null,
            last_login_ip: user.last_login_ip || null,
            last_login_device: user.last_login_device || null,
            permissions: [],
            role: user.position,
            login_attempts: 0,
            locked_until: null,
            two_factor_enabled: false,
            session_timeout: 30,
            allowed_ips: [],
            department: user.position === 'Super Admin' ? 'Administration' : 
                      user.position === 'Pharmacist' ? 'Pharmacy' : 
                      user.position === 'Cashier' ? 'Sales' : 
                      user.position === 'Store Manager' ? 'Management' : 'General',
            employee_id: `EMP${user.id.toString().padStart(3, '0')}`,
            hire_date: user.created_at,
            salary: 0,
            emergency_contact: '',
            emergency_phone: '',
            notes: '',
            avatar: null,
          };
        });
        
        setEmployees(mappedUsers);
        setSuccess('Users loaded successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      setError(`Error fetching users: ${err.message}`);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/user/change-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      setSuccess('Password changed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error changing password: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeUser = async (userId: number, subscriptionType: 'quarterly' | 'yearly') => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/subscribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          type: subscriptionType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to subscribe user');
      }

      setSuccess(`User subscribed to ${subscriptionType} plan successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error subscribing user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSubscription = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/subscription`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check subscription');
      }

      const data = await response.json();
      if (data.has_active_subscription) {
        setSuccess(`User has active subscription: ${data.subscription.type}`);
      } else {
        setSuccess('User has no active subscription');
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error checking subscription: ${err.message}`);
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
      if (response.ok) {
        setSubscriptions(data.data || data);
      } else {
        setSubscriptions([]);
      }
    } catch (err: any) {
      setSubscriptions([]);
    }
  };

  const handleAddUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      if (formData.password !== formData.password_confirmation) {
        throw new Error('Passwords do not match');
      }

      const payload = {
        ...formData,
        belonged_branches: formData.belonged_branches.length > 0 ? formData.belonged_branches : [branches[0]?.id],
        permissions: formData.permissions,
        role: formData.role,
        department: formData.department,
        employee_id: formData.employee_id,
        hire_date: formData.hire_date,
        salary: formData.salary,
        emergency_contact: formData.emergency_contact,
        emergency_phone: formData.emergency_phone,
        notes: formData.notes,
        two_factor_enabled: formData.two_factor_enabled,
        session_timeout: formData.session_timeout,
        allowed_ips: formData.allowed_ips,
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
        throw new Error(errorData.message || 'Failed to add user');
      }

      fetchEmployees();
      setOpenAddDialog(false);
      resetForm();
      setSuccess('User added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error adding user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        ...formData,
        belonged_branches: formData.belonged_branches.length > 0 ? formData.belonged_branches : [branches[0]?.id],
        permissions: formData.permissions,
        role: formData.role,
        department: formData.department,
        employee_id: formData.employee_id,
        hire_date: formData.hire_date,
        salary: formData.salary,
        emergency_contact: formData.emergency_contact,
        emergency_phone: formData.emergency_phone,
        notes: formData.notes,
      };

      if (formData.password) {
        if (formData.password.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        if (formData.password !== formData.password_confirmation) {
          throw new Error('Passwords do not match');
        }
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      const response = await fetch(`${API_BASE_URL}/api/employees/${selectedUser.id}`, {
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
        throw new Error(errorData.message || 'Failed to update user');
      }

      fetchEmployees();
      setOpenEditDialog(false);
      setSelectedUser(null);
      resetForm();
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error updating user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
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
        throw new Error(errorData.message || 'Failed to delete user');
      }
      fetchEmployees();
      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error deleting user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (id: number, newStatus: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/employees/${id}/toggle-status`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user status');
      }
      fetchEmployees();
      setSuccess(`User status updated to ${newStatus}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error updating user status: ${err.message}`);
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
      role: '',
      permissions: [],
      department: '',
      employee_id: '',
      hire_date: '',
      salary: 0,
      emergency_contact: '',
      emergency_phone: '',
      notes: '',
      two_factor_enabled: false,
      session_timeout: 30,
      allowed_ips: [],
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleOpenEditDialog = (user: Employee) => {
    setSelectedUser(user);
    let branchIds: number[] = [];
    if (Array.isArray(user.belonged_branches)) {
      branchIds = user.belonged_branches.map((b) => Number(b));
    } else if (user.belonged_branches !== null) {
      branchIds = [Number(user.belonged_branches)];
    }
    setFormData({
      ...user,
      belonged_branches: branchIds.length > 0 ? branchIds : [branches[0]?.id],
      password: '',
      password_confirmation: '',
      permissions: user.permissions || [],
      role: user.role || '',
      department: user.department || '',
      employee_id: user.employee_id || '',
      hire_date: user.hire_date || '',
      salary: user.salary || 0,
      emergency_contact: user.emergency_contact || '',
      emergency_phone: user.emergency_phone || '',
      notes: user.notes || '',
      two_factor_enabled: user.two_factor_enabled || false,
      session_timeout: user.session_timeout || 30,
      allowed_ips: user.allowed_ips || [],
    });
    setOpenEditDialog(true);
  };

  const handleOpenPasswordDialog = (user: Employee) => {
    setSelectedUser(user);
    setOpenSecurityDialog(true);
  };

  const handleOpenSubscriptionDialog = (user: Employee) => {
    setSelectedUser(user);
    // Check subscription status first
    handleCheckSubscription(user.id);
  };

  const filteredUsers = employees.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (user.first_name?.toLowerCase() || '').includes(searchLower) ||
      (user.last_name?.toLowerCase() || '').includes(searchLower) ||
      (user.email?.toLowerCase() || '').includes(searchLower) ||
      (user.username?.toLowerCase() || '').includes(searchLower) ||
      (user.position?.toLowerCase() || '').includes(searchLower) ||
      (user.branch_name?.toLowerCase() || '').includes(searchLower) ||
      (user.department?.toLowerCase() || '').includes(searchLower) ||
      (user.employee_id?.toLowerCase() || '').includes(searchLower);

    const matchesStatus = !filters.status || user.status === filters.status;
    const matchesPosition = !filters.position || user.position === filters.position;
    const matchesPharmacy = !filters.pharmacy || user.pharmacy_id.toString() === filters.pharmacy;
    const matchesBranch = !filters.branch || (user.branch_name && user.branch_name.toLowerCase().includes(filters.branch.toLowerCase()));

    return matchesSearch && matchesStatus && matchesPosition && matchesPharmacy && matchesBranch;
  });

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

  const getPharmacyName = (pharmacyId: number) => {
    const pharmacy = pharmacies.find((p) => p.id === pharmacyId);
    return pharmacy ? pharmacy.name : `Pharmacy ${pharmacyId}`;
  };

  const getPositionColor = (position: string) => {
    const pos = POSITIONS.find(p => p.value === position);
    return pos ? pos.color : theme.palette.grey[500];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.palette.success.main;
      case 'inactive': return theme.palette.grey[500];
      case 'suspended': return theme.palette.warning.main;
      case 'locked': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'inactive': return <InfoIcon />;
      case 'suspended': return <WarningIcon />;
      case 'locked': return <LockIcon />;
      default: return <InfoIcon />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {employees.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <GroupIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Users
                  </Typography>
                  <Typography variant="h4" component="div" color="success.main">
                    {employees.filter(u => u.status === 'active').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Inactive Users
                  </Typography>
                  <Typography variant="h4" component="div" color="warning.main">
                    {employees.filter(u => u.status === 'inactive').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Locked Users
                  </Typography>
                  <Typography variant="h4" component="div" color="error.main">
                    {employees.filter(u => u.status === 'locked').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                  <LockIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card elevation={3}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AdminIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  User Management
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Manage users, roles, and permissions
                </Typography>
              </Box>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<FilterAltIcon />}
                onClick={() => {/* Open filters */}}
              >
                Filters
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddDialog(true)}
                disabled={loading}
              >
                Add User
              </Button>
            </Box>
          }
        />
        <Divider />

        <CardContent>
          {/* Search */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search users by name, email, username, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

          {/* Users Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <Table>
                <TableHead sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Position</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Pharmacy</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Branches</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Activity</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: getRandomColor() }}>
                            {getInitials(user.first_name, user.last_name)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight="medium">{`${user.first_name} ${user.last_name}`}</Typography>
                            <Typography variant="body2" color="textSecondary">@{user.username}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography>{user.email}</Typography>
                        <Typography variant="body2" color="textSecondary">{user.phone_number}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.position} 
                          size="small" 
                          sx={{ 
                            backgroundColor: getPositionColor(user.position),
                            color: 'white',
                            fontWeight: 'bold'
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography>{getPharmacyName(user.pharmacy_id)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{user.branch_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(user.status)}
                          <Chip 
                            label={user.status} 
                            size="small" 
                            sx={{ 
                              backgroundColor: getStatusColor(user.status),
                              color: 'white',
                              textTransform: 'capitalize'
                            }} 
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.last_login_at
                            ? `Last login: ${format(new Date(user.last_login_at), 'MMM d, yyyy HH:mm')}`
                            : 'Never logged in'}
                        </Typography>
                        {user.last_login_ip && (
                          <Typography variant="caption" color="textSecondary">IP: {user.last_login_ip}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => handleOpenEditDialog(user)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Change Password">
                            <IconButton
                              onClick={() => handleOpenPasswordDialog(user)}
                              sx={{ color: theme.palette.warning.main }}
                            >
                              <KeyIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Subscription">
                            <IconButton
                              onClick={() => handleOpenSubscriptionDialog(user)}
                              sx={{ color: theme.palette.info.main }}
                            >
                              <SubscribeIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Toggle Status">
                            <IconButton
                              onClick={() => handleToggleUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                              sx={{ color: theme.palette.secondary.main }}
                            >
                              {user.status === 'active' ? <LockIcon /> : <CheckCircleIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDeleteUser(user.id)}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {filteredUsers.length > rowsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(filteredUsers.length / rowsPerPage)}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Position</InputLabel>
                <Select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  label="Position"
                >
                  {POSITIONS.map((position) => (
                    <MenuItem key={position.value} value={position.value}>
                      {position.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
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
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddUser} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Position</InputLabel>
                <Select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  label="Position"
                >
                  {POSITIONS.map((position) => (
                    <MenuItem key={position.value} value={position.value}>
                      {position.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="New Password (optional)"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
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
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditUser} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Update User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={openSecurityDialog} onClose={() => setOpenSecurityDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSecurityDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              handleChangePassword(formData.password, formData.password_confirmation);
              setOpenSecurityDialog(false);
            }} 
            variant="contained" 
            disabled={loading || !formData.password || !formData.password_confirmation}
          >
            {loading ? <CircularProgress size={20} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subscription Management Dialog */}
      <Dialog open={openSubscriptionDialog} onClose={() => setOpenSubscriptionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Subscription Management</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Manage user subscription for {selectedUser?.first_name} {selectedUser?.last_name}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  if (selectedUser) {
                    handleSubscribeUser(selectedUser.id, 'quarterly');
                    setOpenSubscriptionDialog(false);
                  }
                }}
                disabled={loading}
              >
                Subscribe to Quarterly Plan
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  if (selectedUser) {
                    handleSubscribeUser(selectedUser.id, 'yearly');
                    setOpenSubscriptionDialog(false);
                  }
                }}
                disabled={loading}
              >
                Subscribe to Yearly Plan
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  if (selectedUser) {
                    handleCheckSubscription(selectedUser.id);
                  }
                }}
                disabled={loading}
              >
                Check Subscription Status
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubscriptionDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement; 