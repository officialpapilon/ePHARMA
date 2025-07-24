import React from 'react';
import { Box, TextField, Button } from '@mui/material';
import Modal from '../../../components/UI/Modal/Modal';

interface PharmacyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacyInfo: {
    pharmacy_name: string;
    tin_number: string;
    phone_number	: string;
    email: string;
  };
  onSave: (data: {pharmacy_name: string; tin_number: string; phone_number	: string; email: string }) => void;
}

const PharmacyInfoModal: React.FC<PharmacyInfoModalProps> = ({
  isOpen,
  onClose,
  pharmacyInfo,
  onSave,
}) => {
  const [formData, setFormData] = React.useState({
    pharmacyName: pharmacyInfo?.pharmacy_name || '',
    tinNumber: pharmacyInfo?.tin_number || '',
    phoneNumber: pharmacyInfo?.phone_number	 || '',
    email: pharmacyInfo?.email || '',
  });

  React.useEffect(() => {
    if (pharmacyInfo) {
      setFormData({
        pharmacyName: pharmacyInfo.pharmacy_name,
        tinNumber: pharmacyInfo.tin_number,
        phoneNumber: pharmacyInfo.phone_number	,
        email: pharmacyInfo.email,
      });
    }
  }, [pharmacyInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      heading="Edit Pharmacy Information"
      size="small"
    >
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
          name="pharmacyName"
          label="Pharmacy Name"
          value={formData.pharmacyName}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          name="tinNumber"
          label="TIN Number"
          value={formData.tinNumber}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          name="phoneNumber"
          label="Phone Number"
          value={formData.phoneNumber}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          name="email"
          label="Email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Save Changes
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default PharmacyInfoModal;