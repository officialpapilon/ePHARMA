import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Grid,
  Paper,
  Collapse,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { FilterOptions } from '../../../types';
import DatePicker from '../DatePicker/DatePicker';

interface FilterField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'daterange';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface SearchFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  filterFields?: FilterField[];
  showAdvanced?: boolean;
  onSearch?: () => void;
  onClear?: () => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  filters,
  onFiltersChange,
  filterFields = [],
  showAdvanced = true,
  onSearch,
  onClear,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (name: string, value: any) => {
    const newFilters = { ...localFilters, [name]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearch = () => {
    onSearch?.();
  };

  const handleClear = () => {
    const clearedFilters: FilterOptions = { page: 1, per_page: filters.per_page };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClear?.();
  };

  const hasActiveFilters = Object.keys(localFilters).some(
    key => key !== 'page' && key !== 'per_page' && localFilters[key as keyof FilterOptions]
  );

  const renderFilterField = (field: FilterField) => {
    switch (field.type) {
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={localFilters[field.name as keyof FilterOptions] || ''}
              onChange={(e) => handleFilterChange(field.name, e.target.value)}
              label={field.label}
            >
              <MenuItem value="">All</MenuItem>
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'date':
        return (
          <DatePicker
            label={field.label}
            value={localFilters[field.name as keyof FilterOptions] ? new Date(localFilters[field.name as keyof FilterOptions] as string) : null}
            onChange={(date) => handleFilterChange(field.name, date?.toISOString().split('T')[0])}
            size="small"
          />
        );

      case 'daterange':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <DatePicker
              label="From"
              value={localFilters.date_from ? new Date(localFilters.date_from) : null}
              onChange={(date) => handleFilterChange('date_from', date?.toISOString().split('T')[0])}
              size="small"
            />
            <DatePicker
              label="To"
              value={localFilters.date_to ? new Date(localFilters.date_to) : null}
              onChange={(date) => handleFilterChange('date_to', date?.toISOString().split('T')[0])}
              size="small"
            />
          </Box>
        );

      default:
        return (
          <TextField
            fullWidth
            size="small"
            label={field.label}
            placeholder={field.placeholder}
            value={localFilters[field.name as keyof FilterOptions] || ''}
            onChange={(e) => handleFilterChange(field.name, e.target.value)}
            InputProps={{
              startAdornment: field.name === 'search' ? <Search sx={{ mr: 1, color: 'action.active' }} /> : undefined,
            }}
          />
        );
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search..."
          value={localFilters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
          }}
          sx={{ flex: 1 }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          {showAdvanced && filterFields.length > 0 && (
            <IconButton
              onClick={() => setExpanded(!expanded)}
              color={expanded ? 'primary' : 'default'}
              title="Advanced Filters"
            >
              <FilterList />
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}

          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<Search />}
            sx={{ minWidth: 100 }}
          >
            Search
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outlined"
              onClick={handleClear}
              startIcon={<Clear />}
              color="secondary"
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>

      {showAdvanced && filterFields.length > 0 && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Grid container spacing={2}>
              {filterFields.map((field) => (
                <Grid item xs={12} sm={6} md={4} key={field.name}>
                  {renderFilterField(field)}
                </Grid>
              ))}
            </Grid>

            {hasActiveFilters && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(localFilters).map(([key, value]) => {
                  if (!value || key === 'page' || key === 'per_page') return null;
                  
                  const field = filterFields.find(f => f.name === key);
                  const label = field?.label || key;
                  
                  return (
                    <Chip
                      key={key}
                      label={`${label}: ${value}`}
                      onDelete={() => handleFilterChange(key, '')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        </Collapse>
      )}
    </Paper>
  );
};

export default SearchFilter;