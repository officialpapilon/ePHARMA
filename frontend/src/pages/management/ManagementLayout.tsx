import React from 'react';
import { useLocation } from 'react-router-dom';
import CategoryIcon from '@mui/icons-material/Category';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import BarChartIcon from '@mui/icons-material/BarChart';
import ChecklistIcon from '@mui/icons-material/Checklist';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import Layout from '../../components/layout/Layout/Layout';
import { NavItem, BreadcrumbItem } from '../../types';
import { ROUTES } from '../../utils/constants';

const ManagementLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Inventory Manager', path: ROUTES.MANAGEMENT.INVENTORY, icon: <CategoryIcon /> },
    { label: 'Dispensing Reports', path: ROUTES.MANAGEMENT.DISPENSING_REPORTS, icon: <BarChartIcon /> },
    { label: 'Payment Reports', path: ROUTES.MANAGEMENT.PAYMENT_REPORTS, icon: <InsertDriveFileIcon /> },
    { label: 'Stock Taking Report', path: ROUTES.MANAGEMENT.STOCK_TAKING_REPORT, icon: <ChecklistIcon /> },
    { label: 'Inventory Reports', path: ROUTES.MANAGEMENT.INVENTORY_REPORTS, icon: <AssessmentIcon /> },
    { label: 'Stock Status Report', path: ROUTES.MANAGEMENT.STOCK_STATUS_REPORT, icon: <BarChartIcon /> },
    { label: 'Financial Audit', path: ROUTES.MANAGEMENT.FINANCIAL_AUDIT, icon: <AccountBalanceIcon /> },
  ] as NavItem[];

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: ROUTES.HOME },
      { label: 'Management', path: ROUTES.MANAGEMENT.BASE },
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
      title="Management"
      breadcrumbs={getBreadcrumbs()}
      headerTitle="Management Dashboard"
    />
  );
};

export default ManagementLayout;
