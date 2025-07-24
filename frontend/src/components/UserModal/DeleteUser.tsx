import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress, Alert } from '@mui/material';

interface DeleteUserModalProps {
  open: boolean;
  onClose: () => void;
  user: { id: number; name: string } | null;
  onUserDeleted: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ open, onClose, user, onUserDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');

  const handleDelete = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      onUserDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isConfirmed = confirmationText === user?.name;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete User</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Typography variant="body1" gutterBottom>
          Are you sure you want to permanently delete <strong>{user?.name}</strong>?
        </Typography>
        
        <Typography variant="body2" color="error" gutterBottom>
          This action cannot be undone. All data associated with this user will be permanently removed.
        </Typography>
        
        <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
          To confirm, please type the user's name <strong>{user?.name}</strong> below:
        </Typography>
        
        <TextField
          fullWidth
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          margin="normal"
          variant="outlined"
          placeholder="Enter user name to confirm"
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleDelete} 
          color="error" 
          variant="contained"
          disabled={loading || !isConfirmed}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Deleting...' : 'Delete Permanently'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserModal;