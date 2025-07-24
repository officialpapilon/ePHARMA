import React from 'react';
import { Box, TextField, Button, Grid, FormControlLabel, Checkbox } from '@mui/material';
import Modal from '../../../components/UI/Modal/Modal';
import type { Department } from '../../../types/settings';


interface DepartmentsProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  onSave: (department: Department) => void;
}

const Departments: React.FC<DepartmentsProps> = ({
  isOpen,
  onClose,
  department,
  onSave,
}) => {
  const [formData, setFormData] = React.useState<Department>({
    id: '',
    unit_code: '',
    dept_name: '',
    dept_description: '',
    isActive: true,
  });

  React.useEffect(() => {
    if (department) {
      setFormData(department);
    } else {
      setFormData({
        id: '',
        unit_code: '',
        dept_name: '',
        dept_description: '',
        isActive: true,
      });
    }
  }, [department]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      heading={department?.id ? 'Edit Department' : 'Add New Department'}
      size="medium"
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              name="unit_code"
              label="Unit Code"
              value={formData.unit_code}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              name="dept_name"
              label="Department Name"
              value={formData.dept_name}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="dept_description"
              label="Description"
              value={formData.dept_description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />
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
              label="Active Department"
            />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Save Department
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default Departments;