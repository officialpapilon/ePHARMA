import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import GroupIcon from '@mui/icons-material/Group';
import PaymentIcon from '@mui/icons-material/Payment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CategoryIcon from '@mui/icons-material/Category';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';

import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';

const drawerWidth = 240;

const SettingsLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedPath, setSelectedPath] = React.useState(window.location.pathname);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const navItems = [
    { label: 'Pharmacy Settings', path: '/settings/pharmacy', icon: <LocalPharmacyIcon /> },
    { label: 'User Management', path: '/settings/users', icon: <GroupIcon /> },
    { label: 'Payment Methods', path: '/settings/payment-methods', icon: <PaymentIcon /> },
    { label: 'Stock Taking Reasons', path: '/settings/stock-taking-reasons', icon: <ListAltIcon /> },
    { label: 'Adjustment Reasons', path: '/settings/adjustment-reasons', icon: <SyncAltIcon /> },
    { label: 'Expense Categories', path: '/settings/expense-categories', icon: <CategoryIcon /> },
    { label: 'System Settings', path: '/settings/system', icon: <SettingsIcon /> },
  ];

  const handleNavigation = (path: string) => {
    setSelectedPath(path);
    navigate(path);
    setDrawerOpen(false);
  };

  const renderNavItems = () => (
    <List>
      {navItems.map((item) => {
        const isSelected = selectedPath === item.path;
        return (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={isSelected}
              sx={{
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                backgroundColor: isSelected ? theme.palette.primary.light : 'transparent',
                '&:hover': {
                  backgroundColor: isSelected ? theme.palette.primary.light : theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
                  minWidth: 36,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Header />

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Mobile Menu Button */}
        <IconButton
          edge="start"
          onClick={() => setDrawerOpen(!drawerOpen)}
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'fixed',
            top: 72,
            left: 16,
            zIndex: 1300,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              p: 2,
              bgcolor: theme.palette.background.paper,
            },
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: '#00BCD4', fontWeight: 600 }}>
            Settings Menu
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {renderNavItems()}
        </Drawer>

        {/* Permanent Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxShadow: 2,
              bgcolor: theme.palette.background.paper,
              mt: '64px',
              borderRight: 'none',
              p: 2,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#00BCD4', fontWeight: 600 }}>
              Settings Menu
            </Typography>
            <IconButton
              edge="end"
              color="primary"
              aria-label="dashboard"
              onClick={() => handleNavigation('/')}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s'
              }}
            >
              <DashboardIcon sx={{ color: '#1976d2' }} />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />
          {renderNavItems()}
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            mt: '64px',
            minHeight: 'calc(100vh - 64px)',
            bgcolor: theme.palette.background.paper,
            borderRadius: { xs: 0, md: 2 },
            boxShadow: { md: '0 2px 8px rgba(0,0,0,0.1)' },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsLayout;
