import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Chip, Box, CircularProgress, Typography, Alert } from '@mui/material';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  belonged_branches: number[];
  // Add other user properties as needed
}

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  branches: { id: number; name: string }[];
  onUserUpdated: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ open, onClose, user, branches, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    belonged_branches: [] as number[],
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        belonged_branches: user.belonged_branches,
        password: '',
        password_confirmation: ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleBranchChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFormData(prev => ({
      ...prev,
      belonged_branches: event.target.value as number[]
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
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

      const response = await fetch(`${API_BASE_URL}/api/employees/${user.id}`, {
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

      onUserUpdated();
      onClose();
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Error updating user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: '',
      belonged_branches: [],
      password: '',
      password_confirmation: ''
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          margin="normal"
          variant="outlined"
        />
        
        <TextField
          fullWidth
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          variant="outlined"
          type="email"
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select
            name="role"
            value={formData.role}
            onChange={handleChange}
            label="Role"
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="staff">Staff</MenuItem>
            {/* Add other roles as needed */}
          </Select>
        </FormControl>
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Branches</InputLabel>
          <Select
            multiple
            name="belonged_branches"
            value={formData.belonged_branches}
            onChange={handleBranchChange}
            label="Branches"
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as number[]).map((value) => (
                  <Chip key={value} label={branches.find(b => b.id === value)?.name || value} />
                ))}
              </Box>
            )}
          >
            {branches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>
                {branch.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          label="New Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          variant="outlined"
          helperText="Leave blank to keep current password"
        />
        
        <TextField
          fullWidth
          label="Confirm New Password"
          name="password_confirmation"
          type="password"
          value={formData.password_confirmation}
          onChange={handleChange}
          margin="normal"
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Updating...' : 'Update User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserModal;