import React from 'react';
import { useLocation } from 'react-router-dom';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddBoxIcon from '@mui/icons-material/AddBox';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import { ArrowRight } from 'lucide-react';
import Layout from '../../components/layout/Layout/Layout';
import { NavItem, BreadcrumbItem } from '../../types';
import { ROUTES } from '../../utils/constants';

const StoreLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    // { label: 'Dashboard', path: ROUTES.STORE.BASE, icon: <InventoryIcon /> },
    { label: 'Items Management', path: ROUTES.STORE.ITEMS, icon: <InventoryIcon /> },
    { label: 'Receiving Stock', path: ROUTES.STORE.RECEIVING, icon: <AddBoxIcon /> },
    { label: 'Stock Adjustments', path: ROUTES.STORE.ADJUSTMENTS, icon: <TrendingUpIcon /> },
    { label: 'Stock Transfer', path: ROUTES.STORE.STOCK_TRANSFER, icon: <ArrowRight /> },
    { label: 'Stock Taking', path: ROUTES.STORE.STOCK_TAKING, icon: <AssessmentIcon /> },
    { label: 'Reports', path: ROUTES.STORE.REPORTS, icon: <BarChartIcon /> },
  ] as NavItem[];

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: ROUTES.HOME },
      { label: 'Store', path: ROUTES.STORE.BASE },
    ];

    if (pathSegments.length > 1) {
      const currentPage = navItems.find(item => item.path === location.pathname);
      if (currentPage) {
        breadcrumbs.push({ label: currentPage.label });
      }
    }

    return breadcrumbs;
  };

  return (
    <Layout
      navItems={navItems}
      title="Store"
      breadcrumbs={getBreadcrumbs()}
      headerTitle="Store Management"
    />
  );
};

export default StoreLayout;
