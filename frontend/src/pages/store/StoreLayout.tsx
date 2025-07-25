import React from 'react';
import { useLocation } from 'react-router-dom';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SummarizeIcon from '@mui/icons-material/Summarize';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Layout from '../../components/layout/Layout/Layout';
import { NavItem, BreadcrumbItem } from '../../types';
import { ROUTES } from '../../utils/constants';

const StoreManagementLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Items Manager', path: ROUTES.STORE.ITEMS_MANAGERS, icon: <Inventory2Icon /> },
    { label: 'Stock Taking', path: ROUTES.STORE.STOCK_TAKING, icon: <AssignmentTurnedInIcon /> },
    { label: 'Stock Taking Report', path: ROUTES.STORE.STOCK_TAKING_REPORT, icon: <SummarizeIcon /> },
    { label: 'Store Reports', path: ROUTES.STORE.STORE_REPORTS, icon: <AssessmentIcon /> },
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
      title="Store Management"
      breadcrumbs={getBreadcrumbs()}
      headerTitle="Store Operations"
    />
  );
};

export default StoreManagementLayout;
