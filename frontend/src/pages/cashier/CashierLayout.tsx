import React from 'react';
import { useLocation } from 'react-router-dom';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import Layout from '../../components/layout/Layout/Layout';
import { NavItem, BreadcrumbItem } from '../../types';
import { ROUTES } from '../../utils/constants';

const CashierLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Payment Processing', path: ROUTES.CASHIER.PAYMENT, icon: <PointOfSaleIcon /> },
    { label: 'Print Records', path: ROUTES.CASHIER.PRINT_RECORDS, icon: <ReceiptLongIcon /> },
    { label: 'Payment Reports', path: ROUTES.CASHIER.PAYMENT_REPORT, icon: <BarChartIcon /> },
    { label: 'Financial Activities', path: ROUTES.CASHIER.FINANCIAL_ACTIVITIES, icon: <AccountBalanceIcon /> },
  ] as NavItem[];

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: ROUTES.HOME },
      { label: 'Cashier', path: ROUTES.CASHIER.BASE },
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
      title="Cashier"
      breadcrumbs={getBreadcrumbs()}
      headerTitle="Cashier Operations"
    />
  );
};

export default CashierLayout;
