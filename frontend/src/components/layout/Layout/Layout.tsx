import React, { useState } from 'react';
import {
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';
import { NavItem, BreadcrumbItem } from '../../../types';

interface LayoutProps {
  navItems: NavItem[];
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  headerTitle?: string;
}

const Layout: React.FC<LayoutProps> = ({
  navItems,
  title,
  breadcrumbs,
  headerTitle,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header
        onMenuClick={handleSidebarToggle}
        showMenuButton={isMobile}
        title={headerTitle}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        navItems={navItems}
        title={title}
        variant={isMobile ? 'temporary' : 'permanent'}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: '100%',
          backgroundColor: theme.palette.background.default,
          transition: 'margin 0.2s',
          // Remove margin-left for all screen sizes
        }}
      >
        <Box sx={{ height: 64 }} /> {/* Header spacer */}
        <Box sx={{ flex: 1, width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Breadcrumbs items={breadcrumbs} />
            </Box>
          )}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;