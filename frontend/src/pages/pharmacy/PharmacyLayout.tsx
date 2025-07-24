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
  useTheme
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssessmentIcon from '@mui/icons-material/Assessment';

import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import { useSettings } from '../../contexts/SettingsContext';
import { HandCoinsIcon, ListCollapse, PillIcon } from 'lucide-react';

const drawerWidth = 240;

const PharmacyLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedPath, setSelectedPath] = React.useState(window.location.pathname);

  const {settings} = useSettings();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const navItems = [
    ...(settings?.mode === "simple" 
      ? [{ label: 'Dispensing', path: '/pharmacy/dispensing/simple', icon: <PillIcon /> }] 
      : [{ label: 'Dispensing', path: '/pharmacy/dispensing', icon: <PillIcon /> }]
    ),
    { label: 'Transaction Approve', path: '/pharmacy/transactionApprove', icon: <HandCoinsIcon /> },
    { label: 'Stock Manager', path: '/pharmacy/stockManager', icon: <ListCollapse /> },
    { label: 'Patients Records', path: '/pharmacy/patientRecords', icon: <PeopleAltIcon /> },
    { label: 'Dispensing Report', path: '/pharmacy/dispensingReport', icon: <BarChartIcon /> },
    { label: 'General Stock Report', path: '/pharmacy/expiringReport', icon: <AssessmentIcon /> },
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
                  noWrap: true,
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <Header />

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Hamburger Menu for Mobile */}
        <IconButton
          edge="start"
          aria-label="menu"
          onClick={() => setDrawerOpen(!drawerOpen)}
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'fixed',
            top: 72,
            left: 16,
            zIndex: 1300,
            bgcolor: 'primary.main',
            color: 'white',
            boxShadow: 2,
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
              boxShadow: 3,
              p: 2,
              bgcolor: theme.palette.background.paper,
            },
          }}
        >
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
          <Box>
            {/* Sidebar Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: 'primary.main', fontSize: 18 }}
              >
                Dispensing Menu
              </Typography>
              <IconButton
                color="primary"
                onClick={() => navigate('/')}
                sx={{
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <DashboardIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2, borderColor: theme.palette.primary.light }} />
            {renderNavItems()}
          </Box>
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
            backgroundColor: theme.palette.background.paper,
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

export default PharmacyLayout;
