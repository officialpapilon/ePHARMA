import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Collapse,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Home,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavItem } from '../../../types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  title: string;
  width?: number;
  variant?: 'permanent' | 'temporary';
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  navItems,
  title,
  width = 280,
  variant = 'permanent',
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const handleItemClick = (item: NavItem) => {
    if (item.children && item.children.length > 0) {
      const isExpanded = expandedItems.includes(item.path);
      setExpandedItems(prev =>
        isExpanded
          ? prev.filter(path => path !== item.path)
          : [...prev, item.path]
      );
    } else {
      navigate(item.path);
      if (variant === 'temporary') {
        onClose();
      }
    }
  };

  const isItemActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const isActive = isItemActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.path);

    return (
      <React.Fragment key={item.path}>
        <ListItem disablePadding sx={{ pl: level * 2 }}>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            selected={isActive}
            sx={{
              borderRadius: 2,
              mx: 1,
              my: 0.5,
              backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
              }}
            />
            {hasChildren && (
              <IconButton size="small" sx={{ ml: 1 }}>
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderNavItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Enhanced Header */}
      <Box
        sx={{
          p: 3,
          pt: 4,
          borderBottom: `2px solid ${theme.palette.primary.main}`,
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          height: 120,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                fontSize: 16,
              }}
            >
              P
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'white',
                fontSize: 20,
                letterSpacing: 0.5,
              }}
            >
              ePharma
            </Typography>
          </Box>
          <IconButton
            color="inherit"
            onClick={() => navigate('/')}
            size="small"
            sx={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Home />
          </IconButton>
        </Box>
        
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 12,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        py: 1, 
        height: 'calc(100vh - 120px)',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.divider,
          borderRadius: '3px',
        },
      }}>
        <List>
          {navItems.map(item => renderNavItem(item))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          position: 'fixed',
          height: '100vh',
          top: 0,
          left: 0,
          zIndex: theme.zIndex.drawer,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          ...(variant === 'permanent' && {
            position: 'fixed',
            height: '100vh',
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;