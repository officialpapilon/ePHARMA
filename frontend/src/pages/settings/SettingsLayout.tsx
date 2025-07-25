import React from 'react';
import { useLocation } from 'react-router-dom';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import GroupIcon from '@mui/icons-material/Group';
import PaymentIcon from '@mui/icons-material/Payment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CategoryIcon from '@mui/icons-material/Category';
import SettingsIcon from '@mui/icons-material/Settings';
import Layout from '../../components/layout/Layout/Layout';
import { NavItem, BreadcrumbItem } from '../../types';
import { ROUTES } from '../../utils/constants';

const SettingsLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Pharmacy Settings', path: ROUTES.SETTINGS.PHARMACY, icon: <LocalPharmacyIcon /> },
    { label: 'User Management', path: ROUTES.SETTINGS.USERS, icon: <GroupIcon /> },
    { label: 'Payment Methods', path: ROUTES.SETTINGS.PAYMENT_METHODS, icon: <PaymentIcon /> },
    { label: 'Stock Taking Reasons', path: ROUTES.SETTINGS.STOCK_TAKING_REASONS, icon: <ListAltIcon /> },
    { label: 'Adjustment Reasons', path: ROUTES.SETTINGS.ADJUSTMENT_REASONS, icon: <SyncAltIcon /> },
    { label: 'Expense Categories', path: ROUTES.SETTINGS.EXPENSE_CATEGORIES, icon: <CategoryIcon /> },
    { label: 'System Settings', path: ROUTES.SETTINGS.SYSTEM, icon: <SettingsIcon /> },
  ] as NavItem[];

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: ROUTES.HOME },
      { label: 'Settings', path: ROUTES.SETTINGS.BASE },
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
      title="Settings"
      breadcrumbs={getBreadcrumbs()}
      headerTitle="System Settings"
    />
  );
};

export default SettingsLayout;
