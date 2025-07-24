import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  CircularProgress, 
  Alert, 
  IconButton,
  InputAdornment,
  Box
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { API_BASE_URL } from '../../../constants';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  userId: number | null;
  onPasswordChanged: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ 
  open, 
  onClose, 
  userId, 
  onPasswordChanged 
}) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClickShowPassword = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    
    try {
      // Validate passwords
      if (formData.new_password.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }
      if (formData.new_password !== formData.new_password_confirmation) {
        throw new Error('New passwords do not match');
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/employees/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          current_password: formData.current_password,
          password: formData.new_password,
          password_confirmation: formData.new_password_confirmation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      setSuccess('Password changed successfully');
      setTimeout(() => {
        onClose();
        setSuccess(null);
        onPasswordChanged();
        setFormData({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px'
        }
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          py: 2,
          px: 3
        }}
      >
        <DialogTitle sx={{ 
          color: '#2d3748',
          fontWeight: 'bold',
          p: 0
        }}>
          Change Password
        </DialogTitle>
      </Box>
      
      <DialogContent dividers sx={{ py: 3 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: '12px'
            }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              borderRadius: '12px'
            }}
          >
            {success}
          </Alert>
        )}
        
        <TextField
          fullWidth
          label="Current Password"
          name="current_password"
          type={showPassword.current ? 'text' : 'password'}
          value={formData.current_password}
          onChange={handleChange}
          margin="normal"
          variant="outlined"
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => handleClickShowPassword('current')}
                  edge="end"
                >
                  {showPassword.current ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        <TextField
          fullWidth
          label="New Password"
          name="new_password"
          type={showPassword.new ? 'text' : 'password'}
          value={formData.new_password}
          onChange={handleChange}
          margin="normal"
          variant="outlined"
          disabled={loading}
          helperText="Must be at least 8 characters"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => handleClickShowPassword('new')}
                  edge="end"
                >
                  {showPassword.new ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        <TextField
          fullWidth
          label="Confirm New Password"
          name="new_password_confirmation"
          type={showPassword.confirm ? 'text' : 'password'}
          value={formData.new_password_confirmation}
          onChange={handleChange}
          margin="normal"
          variant="outlined"
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => handleClickShowPassword('confirm')}
                  edge="end"
                >
                  {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{
            borderRadius: '8px',
            px: 1.5,
            py: 1
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1
          }}
        >
          {loading ? 'Changing...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordModal;