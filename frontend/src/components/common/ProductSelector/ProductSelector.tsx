import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Chip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { Search, Package, Check } from 'lucide-react';

interface Product {
  id: number;
  product_id: string;
  product_name: string;
  current_quantity: number;
  batch_no: string;
  product_price: string;
  product_category: string;
  expire_date: string;
}

interface ProductSelectorProps {
  products: Product[];
  selectedProducts: Product[];
  onProductSelect: (product: Product) => void;
  onProductDeselect: (productId: string) => void;
  title?: string;
  searchPlaceholder?: string;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  selectedProducts,
  onProductSelect,
  onProductDeselect,
  title = "Select Products",
  searchPlaceholder = "Search products..."
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const isProductSelected = (productId: string) => {
    return selectedProducts.some(p => p.product_id === productId);
  };

  const handleProductToggle = (product: Product) => {
    if (isProductSelected(product.product_id)) {
      onProductDeselect(product.product_id);
    } else {
      onProductSelect(product);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedProducts.length} of {products.length} products selected
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: theme.palette.text.secondary
          }}
        />
        <TextField
          fullWidth
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              pl: 4,
              borderRadius: 2,
              backgroundColor: theme.palette.background.default,
            }
          }}
        />
      </Box>

      {/* Selected Products Summary */}
      {selectedProducts.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Selected Products:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedProducts.map((product) => (
              <Chip
                key={product.product_id}
                label={`${product.product_name} (${product.current_quantity})`}
                size="small"
                color="primary"
                variant="outlined"
                onDelete={() => onProductDeselect(product.product_id)}
                icon={<Check size={14} />}
              />
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Product List */}
      <Box
        sx={{
          maxHeight: 400,
          overflowY: 'auto',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          backgroundColor: theme.palette.background.default
        }}
      >
        <List sx={{ p: 0 }}>
          {filteredProducts.map((product, index) => (
            <React.Fragment key={product.product_id}>
              <ListItem
                disablePadding
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemButton
                  onClick={() => handleProductToggle(product)}
                  sx={{ py: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      edge="start"
                      checked={isProductSelected(product.product_id)}
                      tabIndex={-1}
                      disableRipple
                      size="small"
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {product.product_name}
                        </Typography>
                        <Chip
                          label={product.product_category}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          ID: {product.product_id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Stock: {product.current_quantity}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Price: Tsh {parseFloat(product.product_price).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Package size={16} color={theme.palette.text.secondary} />
                    <Typography variant="caption" color="text.secondary">
                      {product.batch_no}
                    </Typography>
                  </Box>
                </ListItemButton>
              </ListItem>
              {index < filteredProducts.length - 1 && (
                <Divider component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            color: theme.palette.text.secondary
          }}
        >
          <Package size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
          <Typography variant="body2">
            {searchTerm ? 'No products found matching your search' : 'No products available'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProductSelector; 