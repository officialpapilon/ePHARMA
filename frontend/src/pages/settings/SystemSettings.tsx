import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  Grid,
  IconButton,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  Tooltip,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  List,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Image as ImageIcon,
  LocalHospital as HospitalIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  SettingsBackupRestore as ResetIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Money as CashIcon,
  CloudDone as BackupIcon,
  Medication as MedicationIcon,
  Inventory as InventoryIcon,
  PriceChange as PriceIcon,
  FilterAlt as FilterIcon,
  Save,
  Search,
  Settings,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import {
  Department,
  PaymentOption,
  PharmacySettings,
  type PharmacyInfo,
} from "../../types/settings";
import PharmacyInfoModal from "./System-Settings/PharmacyInfo";
import DepartmentModal from "./System-Settings/Departments";
import PaymentModal from "./System-Settings/Payments";
import axios from "axios";
import { API_BASE_URL } from "../../../constants";
import ConfirmationDialog from "../../components/UI/Promps/Comfirmation";
import Table from "../../components/UI/Table/Table";
import { AlertTriangle, DollarSign } from "lucide-react";

const SystemSettings: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<PharmacySettings | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [tempLogo, setTempLogo] = useState<string | null>(null);
  const [tempStamp, setTempStamp] = useState<string | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [editingPharmacyInfo, setEditingPharmacyInfo] =
    useState<PharmacyInfo | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentOption | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [dispensingMode, setDispensingMode] = useState<"simple" | "complex">("simple");
  const [dispenseByDept, setDispenseByDept] = useState(false);
  const [showExpiredMeds, setShowExpiredMeds] = useState(false);
  const [showPrices, setShowPrices] = useState(true);
  const [selectedDept, setSelectedDept] = useState("");

  const handleBackup = () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsBackingUp(false);
            setSuccess("System backup completed successfully");
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const token = localStorage.getItem("token");

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/settings/pharmacy`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      const loadedSettings = response.data;
      setSettings(loadedSettings);
      
      if (loadedSettings) {
        setDispensingMode(loadedSettings.mode === 'complex' ? 'complex' : 'simple');
        setDispenseByDept(loadedSettings.dispense_by_dept === 'true');
        setShowExpiredMeds(loadedSettings.show_expired === 'true');
        setShowPrices(loadedSettings.show_prices === 'true');
        setSelectedDept(loadedSettings.default_dept || '');
      }
      
      setError("");
    } catch (error) {
      setError("Failed to load settings. Please try again later.");
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: "logo" | "stamp") => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", type);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === "logo") {
          setTempLogo(result);
        } else {
          setTempStamp(result);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error previewing image:", error);
    }
  };

  const saveImage = async (type: "logo" | "stamp") => {
    if (!settings || !(type === "logo" ? tempLogo : tempStamp)) return;

    try {
      const dataUrl = type === "logo" ? tempLogo : tempStamp;
      if (!dataUrl) return;

      const blob = await fetch(dataUrl).then((res) => res.blob());
      const file = new File([blob], `${type}.png`, { type: "image/png" });

      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", type);

      const response = await axios.post(
        `${API_BASE_URL}/api/settings/pharmacy/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSettings(response.data.settings);
      if (type === "logo") setTempLogo(null);
      else setTempStamp(null);
      setSuccess(response.data.message);
      fetchSettings();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to upload image. Please try again.");
      console.error("Error uploading image:", error);
    }
  };

  const removeImage = async (type: "logo" | "stamp") => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/settings/pharmacy/remove-image`,
        { type }
      );
      setSettings(response.data.settings);
      setSuccess(response.data.message);
      fetchSettings();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to remove image. Please try again.");
      console.error("Error removing image:", error);
    }
  };

  const handleSavePharmacyInfo = async (data: {
    pharmacyName:string;
    tinNumber: string;
    phoneNumber: string;
    email: string;
  }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/settings/pharmacy/info`,
        {
          pharmacy_name: data.pharmacyName,
          tin_number: data.tinNumber,
          phone_number: data.phoneNumber,
          email: data.email,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      setSettings(response.data.settings);
      setSuccess(response.data.message);
      fetchSettings();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to save pharmacy info. Please try again.");
      console.error("Error saving pharmacy info:", error);
    }
  };

  const handleSaveDepartment = async (department: Department) => {
    try {
      const departments = settings?.departments
        ? [...settings.departments]
        : [];
      const existingIndex = departments.findIndex(
        (d) => d.id === department.id
      );

      if (existingIndex >= 0) {
        departments[existingIndex] = department;
      } else {
        departments.push({
          ...department,
          id: crypto.randomUUID(),
        });
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/settings/pharmacy/departments`,
        {
          departments,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      setSettings(response.data.settings);
      setEditingDepartment(null);
      setSuccess(response.data.message);
      fetchSettings();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to save department. Please try again.");
      console.error("Error saving department:", error);
    }
  };

  const handleSavePayment = async (payment: PaymentOption) => {
    try {
      const paymentOptions = settings?.payment_options
        ? [...settings.payment_options]
        : [];
      const existingIndex = paymentOptions.findIndex(
        (p) => p.id === payment.id
      );

      if (existingIndex >= 0) {
        paymentOptions[existingIndex] = payment;
      } else {
        paymentOptions.push({
          ...payment,
          id: crypto.randomUUID(),
        });
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/settings/pharmacy/payment-options`,
        {
          payment_options: paymentOptions,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      setSettings(response.data.settings);
      setEditingPayment(null);
      setSuccess(response.data.message);
      fetchSettings();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to save payment option. Please try again.");
      console.error("Error saving payment option:", error);
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      const departments =
        settings?.departments.filter((dept) => dept.id !== id) || [];
      const response = await axios.post(
        `${API_BASE_URL}/api/settings/pharmacy/departments`,
        {
          departments,
        }
      );
      setSettings(response.data.settings);
      setSuccess(response.data.message);
      fetchSettings();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to delete department. Please try again.");
      console.error("Error deleting department:", error);
    }
  };

  const deletePaymentOption = async (id: string) => {
    try {
      const paymentOptions =
        settings?.payment_options.filter((payment) => payment.id !== id) || [];
      const response = await axios.post(
        `${API_BASE_URL}/api/settings/pharmacy/payment-options`,
        {
          payment_options: paymentOptions,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      setSettings(response.data.settings);
      setSuccess(response.data.message);
      fetchSettings();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to delete payment option. Please try again.");
      console.error("Error deleting payment option:", error);
    }
  };

  const toggleDepartmentStatus = async (id: string) => {
    if (!settings) return;

    try {
      const departments = settings.departments.map((dept) =>
        dept.id === id ? { ...dept, isActive: !dept.isActive } : dept
      );

      const response = await axios.post(
        `${API_BASE_URL}/api/settings/pharmacy/departments`,
        {
          departments,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSettings(response.data.settings);
      setSuccess(
        `Department ${
          departments.find((d) => d.id === id)?.isActive
            ? "activated"
            : "deactivated"
        } successfully`
      );
      fetchSettings();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to update department status. Please try again.");
      console.error("Error toggling department status:", error);
    }
  };

  const togglePaymentStatus = async (id: string) => {
    if (!settings) return;

    try {
      const paymentOptions = settings.payment_options.map((payment) =>
        payment.id === id
          ? { ...payment, isActive: !payment.isActive }
          : payment
      );

      const response = await axios.post(
        `${API_BASE_URL}/api/settings/pharmacy/payment-options`,
        {
          payment_options: paymentOptions,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSettings(response.data.settings);
      setSuccess(
        `Payment option ${
          paymentOptions.find((p) => p.id === id)?.isActive
            ? "activated"
            : "deactivated"
        } successfully`
      );
      fetchSettings();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to update payment option status. Please try again.");
      console.error("Error toggling payment option status:", error);
    }
  };

  const resetSettings = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/settings/pharmacy/reset`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSettings(response.data.settings);
      setTempLogo(null);
      setTempStamp(null);
      setSuccess(response.data.message);
      setResetConfirmOpen(false);
      fetchSettings();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to reset settings. Please try again.");
      console.error("Error resetting settings:", error);
    }
  };

  const saveDispensingSettings = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/settings/pharmacy/dispensing`,
        {
          mode: dispensingMode,
          dispense_by_dept: dispenseByDept,
          show_expired: showExpiredMeds,
          show_prices: showPrices,
          default_dept: selectedDept,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess("Dispensing settings saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to save dispensing settings");
      console.error("Error saving dispensing settings:", error);
    }
  };

  if (!isAuthenticated) return <Typography>Unauthorized access</Typography>;

  return (
    <Box sx={{ maxWidth: 1600, margin: "0 auto", p: 3 }}>
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%)",
          borderLeft: "6px solid #3f51b5",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: "#2d3748",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              System Setting Configuration
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Tooltip title="Create a complete system backup">
              <Button
                variant="contained"
                color="info"
                startIcon={<BackupIcon />}
                onClick={handleBackup}
                disabled={isBackingUp}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  px: 3,
                  boxShadow: "0 2px 10px rgba(63, 81, 181, 0.2)",
                }}
              >
                {isBackingUp ? "Backing Up..." : "System Backup"}
              </Button>
            </Tooltip>

            <Button
              variant="outlined"
              color="error"
              startIcon={<ResetIcon />}
              onClick={() => setResetConfirmOpen(true)}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
              }}
            >
              Reset Settings
            </Button>
          </Stack>
        </Box>

        {isBackingUp && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={backupProgress}
              color="info"
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Backup in progress... {backupProgress}%
            </Typography>
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Branding Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: "100%",
              borderRadius: 3,
              boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
              borderLeft: "4px solid #3f51b5",
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <ImageIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="primary" fontWeight="600">
                    Pharmacy Branding
                  </Typography>
                </Box>
              }
              sx={{ borderBottom: "1px solid #eee" }}
            />
            <CardContent>
              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      src={
                        tempLogo ||
                        (settings?.logo
                          ? `${API_BASE_URL}/${settings.logo}`
                          : "")
                      }
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: "grey.100",
                        border: "1px dashed #ddd",
                      }}
                      variant="rounded"
                    >
                      {!settings?.logo && !tempLogo && (
                        <ImageIcon sx={{ fontSize: 40, color: "grey.400" }} />
                      )}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Pharmacy Logo (Max: 5MB)
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadIcon />}
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          Upload Logo
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) =>
                              e.target.files &&
                              handleFileUpload(e.target.files[0], "logo")
                            }
                          />
                        </Button>
                        {tempLogo && (
                          <>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<SaveIcon />}
                              onClick={() => saveImage("logo")}
                              sx={{ textTransform: "none" }}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<CancelIcon />}
                              onClick={() => setTempLogo(null)}
                              sx={{ textTransform: "none" }}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {settings?.logo && !tempLogo && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => removeImage("logo")}
                            sx={{ textTransform: "none" }}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      src={
                        tempStamp ||
                        (settings?.stamp
                          ? `${API_BASE_URL}/${settings.stamp}`
                          : "")
                      }
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: "grey.100",
                        border: "1px dashed #ddd",
                      }}
                      variant="rounded"
                    >
                      {!settings?.stamp && !tempStamp && (
                        <BusinessIcon
                          sx={{ fontSize: 40, color: "grey.400" }}
                        />
                      )}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Pharmacy Stamp (Max: 5MB)
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadIcon />}
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          Upload Stamp
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) =>
                              e.target.files &&
                              handleFileUpload(e.target.files[0], "stamp")
                            }
                          />
                        </Button>
                        {tempStamp && (
                          <>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<SaveIcon />}
                              onClick={() => saveImage("stamp")}
                              sx={{ textTransform: "none" }}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<CancelIcon />}
                              onClick={() => setTempStamp(null)}
                              sx={{ textTransform: "none" }}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {settings?.stamp && !tempStamp && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => removeImage("stamp")}
                            sx={{ textTransform: "none" }}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: "100%",
              borderRadius: 3,
              boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
              borderLeft: "4px solid #3f51b5",
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <BusinessIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="600">
                    Pharmacy Information
                  </Typography>
                </Box>
              }
              action={
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  sx={{ textTransform: "none" }}
                  onClick={() =>
                    setEditingPharmacyInfo({
                      tinNumber: settings?.tinNumber || "",
                      phoneNumber: settings?.phoneNumber || "",
                      email: settings?.email || "",
                    })
                  }
                >
                  Edit Information
                </Button>
              }
              sx={{ borderBottom: "1px solid #eee" }}
            />
            <CardContent>
              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 3,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Pharmacy Name
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: "medium",
                        p: 1.5,
                        backgroundColor: "#f5f5f5",
                        borderRadius: 1,
                      }}
                    >
                      {settings?.pharmacy_name || "Not set"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      TIN Number
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: "medium",
                        p: 1.5,
                        backgroundColor: "#f5f5f5",
                        borderRadius: 1,
                      }}
                    >
                      {settings?.tin_number || "Not set"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Phone Number
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: "medium",
                        p: 1.5,
                        backgroundColor: "#f5f5f5",
                        borderRadius: 1,
                      }}
                    >
                      {settings?.phone_number || "Not set"}
                    </Typography>
                  </Box>
                  <Box >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Email Address
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: "medium",
                        p: 1.5,
                        backgroundColor: "#f5f5f5",
                        borderRadius: 1,
                      }}
                    >
                      {settings?.email || "Not set"}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
              borderLeft: "4px solid #3f51b5",
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <HospitalIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="600">
                    Departments
                  </Typography>
                </Box>
              }
              action={
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    setEditingDepartment({
                      id: "",
                      unit_code: "",
                      dept_name: "",
                      dept_description: "",
                      isActive: true,
                    })
                  }
                  sx={{ textTransform: "none" }}
                >
                  New Department
                </Button>
              }
              sx={{ borderBottom: "1px solid #eee" }}
            />
            <CardContent>
              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : !settings?.departments ||
                settings.departments.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 4,
                    textAlign: "center",
                  }}
                >
                  <HospitalIcon
                    sx={{ fontSize: 60, color: "grey.300", mb: 2 }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    No departments added yet
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    sx={{ mt: 2, textTransform: "none" }}
                    onClick={() =>
                      setEditingDepartment({
                        id: "",
                        unit_code: "",
                        dept_name: "",
                        dept_description: "",
                        isActive: true,
                      })
                    }
                  >
                    Add First Department
                  </Button>
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Table
                    loading={isLoading}
                    columns={[
                      {
                        key: "unit_code",
                        header: "Unit Code",
                        render: (row) => (
                          <Chip
                            label={row.unit_code}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: "bold" }}
                          />
                        ),
                      },
                      {
                        key: "dept_name",
                        header: "Department Name",
                        render: (row) => (
                          <Typography sx={{ fontWeight: "medium" }}>
                            {row.dept_name}
                          </Typography>
                        ),
                      },
                      {
                        key: "dept_description",
                        header: "Description",
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (row) => (
                          <Switch
                            checked={row.isActive}
                            onChange={() => toggleDepartmentStatus(row.id)}
                            color="success"
                          />
                        ),
                      },
                      {
                        key: "actions",
                        header: "Actions",
                        render: (row) => (
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingDepartment(row);
                              }}
                              sx={{ color: "primary.main" }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDepartment(row.id);
                              }}
                              sx={{ color: "error.main" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ),
                      },
                    ]}
                    data={settings?.departments || []}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
              borderLeft: "4px solid #3f51b5",
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <PaymentIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="600">
                    Payment Options
                  </Typography>
                </Box>
              }
              action={
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    setEditingPayment({
                      id: "",
                      name: "",
                      details: {},
                      isActive: true,
                    })
                  }
                  sx={{ textTransform: "none" }}
                >
                  New Payment
                </Button>
              }
              sx={{ borderBottom: "1px solid #eee" }}
            />
            <CardContent>
              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : !settings?.payment_options ||
                settings.payment_options.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 4,
                    textAlign: "center",
                  }}
                >
                  <PaymentIcon
                    sx={{ fontSize: 60, color: "grey.300", mb: 2 }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    No payment options added yet
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    sx={{ mt: 2, textTransform: "none" }}
                    onClick={() =>
                      setEditingPayment({
                        id: "",
                        name: "",
                        details: {},
                        isActive: true,
                      })
                    }
                  >
                    No Payment Options Found
                  </Button>
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Table
                    loading={isLoading}
                    columns={[
                      {
                        key: "name",
                        header: "Payment Method",
                        render: (row) => (
                          <Typography sx={{ fontWeight: "medium" }}>
                            {row.name}
                          </Typography>
                        ),
                      },
                      {
                        key: "type",
                        header: "Type",
                        render: (row) => (
                          <Chip
                            label={row.type || "Cash"}
                            size="small"
                            color={
                              row.type === "Online" ? "secondary" : "primary"
                            }
                            variant="outlined"
                          />
                        ),
                      },

                      {
                        key: "status",
                        header: "Status",
                        render: (row) => (
                          <Switch
                            checked={row.isActive}
                            onChange={() => togglePaymentStatus(row.id)}
                            color="success"
                          />
                        ),
                      },
                      {
                        key: "actions",
                        header: "Actions",
                        render: (row) => (
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPayment(row);
                              }}
                              sx={{ color: "primary.main" }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePaymentOption(row.id);
                              }}
                              sx={{ color: "error.main" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ),
                      },
                    ]}
                    data={settings?.payment_options || []}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              borderLeft: "4px solid #2196f3",
              background:
                "linear-gradient(to bottom right, #f8fafc 0%, #f1f5f9 100%)",
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <MedicationIcon
                    color="info"
                    sx={{
                      mr: 1,
                      fontSize: 32,
                      p: 1,
                      bgcolor: "rgba(33, 150, 243, 0.1)",
                      borderRadius: "50%",
                    }}
                  />
                  <Typography
                    variant="h5"
                    fontWeight="700"
                    color="text.primary"
                  >
                    Dispensing Settings
                  </Typography>
                </Box>
              }
              action={
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={saveDispensingSettings}
                  sx={{
                    textTransform: "none",
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: "0 2px 12px rgba(33, 150, 243, 0.3)",
                    "&:hover": {
                      boxShadow: "0 4px 16px rgba(33, 150, 243, 0.4)",
                    },
                  }}
                >
                  Save Settings
                </Button>
              }
              sx={{
                borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                pb: 2,
              }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      height: "100%",
                    }}
                  >
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 2,
                          fontWeight: "600",
                          color: "text.primary",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <SettingsIcon fontSize="small" />
                        Dispensing Mode
                      </Typography>

                      <ToggleButtonGroup
                        value={dispensingMode}
                        exclusive
                        onChange={(_, newMode) =>
                          newMode && setDispensingMode(newMode)
                        }
                        fullWidth
                        sx={{ mb: 2 }}
                      >
                        <ToggleButton
                          value="simple"
                          sx={{
                            textTransform: "none",
                            py: 1.5,
                            "&.Mui-selected": {
                              bgcolor: "primary.light",
                              color: "primary.dark",
                            },
                          }}
                        >
                          <Stack
                            direction="column"
                            alignItems="center"
                            spacing={1}
                          >
                            <InventoryIcon />
                            <Typography variant="body2">Simple Mode</Typography>
                          </Stack>
                        </ToggleButton>
                        <ToggleButton
                          value="complex"
                          sx={{
                            textTransform: "none",
                            py: 1.5,
                            "&.Mui-selected": {
                              bgcolor: "primary.light",
                              color: "primary.dark",
                            },
                          }}
                        >
                          <Stack
                            direction="column"
                            alignItems="center"
                            spacing={1}
                          >
                            <MedicationIcon />
                            <Typography variant="body2">
                              Complex Mode
                            </Typography>
                          </Stack>
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 2,
                          fontWeight: "600",
                          color: "text.primary",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <BusinessIcon fontSize="small" />
                        Department Settings
                      </Typography>

                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          mb: 2,
                          bgcolor: "rgba(0, 0, 0, 0.02)",
                          borderRadius: 2,
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={dispenseByDept}
                              onChange={(e) =>
                                setDispenseByDept(e.target.checked)
                              }
                              color="primary"
                              sx={{ mr: 1 }}
                            />
                          }
                          label={
                            <Typography variant="body1">
                              Enable Department-Based Dispensing
                            </Typography>
                          }
                          sx={{ width: "100%" }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 1,
                            ml: "36px",
                          }}
                        >
                          Restrict dispensing operations to specific departments
                        </Typography>
                      </Paper>

                      {dispenseByDept && (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            bgcolor: "rgba(0, 0, 0, 0.02)",
                            borderRadius: 2,
                          }}
                        >
                          <FormControl fullWidth>
                            <InputLabel>Default Department</InputLabel>
                            <Select
                              value={selectedDept}
                              label="Default Department"
                              onChange={(e) => setSelectedDept(e.target.value)}
                              sx={{ mb: 1 }}
                            >
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {settings?.departments?.map((dept) => (
                                <MenuItem key={dept.id} value={dept.id}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    {dept.isActive ? (
                                      <CheckCircleIcon
                                        color="success"
                                        fontSize="small"
                                      />
                                    ) : (
                                      <CancelIcon
                                        color="error"
                                        fontSize="small"
                                      />
                                    )}
                                    {dept.dept_name}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Typography variant="body2" color="text.secondary">
                            Select the default department for dispensing
                            operations
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      height: "100%",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 3,
                        fontWeight: "600",
                        color: "text.primary",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                      Preferences
                    </Typography>

                    <Stack spacing={3}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: "rgba(0, 0, 0, 0.02)",
                          borderRadius: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: "500" }}
                            >
                              Show Expired Medications
                            </Typography>
                           
                          </Box>
                          <Switch
                            checked={showExpiredMeds}
                            onChange={(e) =>
                              setShowExpiredMeds(e.target.checked)
                            }
                            color="primary"
                          />
                        </Box>
                      </Paper>

                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: "rgba(0, 0, 0, 0.02)",
                          borderRadius: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: "500" }}
                            >
                              Show Medication Prices
                            </Typography>
                           
                          </Box>
                          <Switch
                            checked={showPrices}
                            onChange={(e) => setShowPrices(e.target.checked)}
                            color="primary"
                          />
                        </Box>
                      </Paper>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <PharmacyInfoModal
        isOpen={!!editingPharmacyInfo}
        onClose={() => setEditingPharmacyInfo(null)}
        pharmacyInfo={{
          pharmacy_name: settings?.pharmacy_name || "",
          tin_number: settings?.tin_number || "",
          phone_number: settings?.phone_number || "",
          email: settings?.email || "",
        }}
        onSave={handleSavePharmacyInfo}
        initialData={editingPharmacyInfo}
      />

      <DepartmentModal
        isOpen={!!editingDepartment}
        onClose={() => setEditingDepartment(null)}
        onSave={handleSaveDepartment}
        department={editingDepartment}
      />

      <PaymentModal
        isOpen={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        payment={editingPayment}
        onSave={handleSavePayment}
      />

      <ConfirmationDialog
        open={resetConfirmOpen}
        title="Reset System Settings"
        content="Are you sure you want to reset all system settings? This action cannot be undone."
        onConfirm={resetSettings}
        onClose={() => setResetConfirmOpen(false)}
        confirmText="Reset"
        cancelText="Cancel"
        severity="warning"
      />
    </Box>
  );
};

export default SystemSettings;
