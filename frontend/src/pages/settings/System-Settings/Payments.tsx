import React from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Grid, 
  FormControlLabel, 
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import Modal from '../../../components/UI/Modal/Modal';
import { PaymentOption } from '../../../types/settings';

interface PaymentsProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentOption | null;
  onSave: (payment: PaymentOption) => void;
}

const Payments: React.FC<PaymentsProps> = ({
  isOpen,
  onClose,
  payment,
  onSave,
}) => {
  const [formData, setFormData] = React.useState<PaymentOption>({
    id: '',
    name: '',
    type: 'Cash', // Default to Cash
    details: {},
    isActive: true,
  });

  React.useEffect(() => {
    if (payment) {
      setFormData(payment);
    } else {
      setFormData({
        id: '',
        name: '',
        type: 'Cash',
        details: {},
        isActive: true,
      });
    }
  }, [payment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e: any) => {
    const type = e.target.value;
    setFormData(prev => ({
      ...prev,
      type,
      // Reset details when type changes
      details: type === 'Cash' ? {} : prev.details
    }));
  };

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      details: { ...prev.details, [name]: value },
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      heading={formData.id ? 'Edit Payment Option' : 'Add New Payment Option'}
      size="large"
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              name="name"
              label="Payment Name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="payment-type-label">Payment Type</InputLabel>
              <Select
                labelId="payment-type-label"
                id="payment-type"
                value={formData.type || 'Cash'}
                label="Payment Type"
                onChange={handleTypeChange}
                required
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Online">Online</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                />
              }
              label="Active Payment Option"
            />
          </Grid>

          {formData.type === 'Online' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  name="integrationLink"
                  label="Payment Integration Link"
                  value={formData.details?.integrationLink || ''}
                  onChange={handleDetailChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="purchaseNumber"
                  label="Purchase Number"
                  value={formData.details?.purchaseNumber || ''}
                  onChange={handleDetailChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="holderName"
                  label="Account Holder Name"
                  value={formData.details?.holderName || ''}
                  onChange={handleDetailChange}
                  fullWidth
                  required
                />
              </Grid>
            </>
          )}
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Save Payment Option
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default Payments;