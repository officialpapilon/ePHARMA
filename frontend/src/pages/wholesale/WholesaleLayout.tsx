import React from 'react';
import { useLocation } from 'react-router-dom';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PeopleIcon from '@mui/icons-material/People';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import Layout from '../../components/layout/Layout/Layout';
import { NavItem, BreadcrumbItem } from '../../types';
import { ROUTES } from '../../utils/constants';

const WholesaleLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Point of Sale', path: ROUTES.WHOLESALE.POS, icon: <PointOfSaleIcon /> },
    { label: 'Orders', path: ROUTES.WHOLESALE.ORDERS, icon: <ShoppingCartIcon /> },
    { label: 'Customers', path: ROUTES.WHOLESALE.CUSTOMERS, icon: <PeopleIcon /> },
    { label: 'Deliveries', path: ROUTES.WHOLESALE.DELIVERIES, icon: <LocalShippingIcon /> },
    { label: 'Payments', path: ROUTES.WHOLESALE.PAYMENTS, icon: <PaymentIcon /> },
    { label: 'Items Manager', path: ROUTES.WHOLESALE.ITEMS_MANAGER, icon: <Inventory2Icon /> },
    { label: 'Stock Taking', path: ROUTES.WHOLESALE.STOCK_TAKING, icon: <AssignmentTurnedInIcon /> },
    { label: 'Reports', path: ROUTES.WHOLESALE.REPORT, icon: <AssessmentIcon /> },
  ] as NavItem[];

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: ROUTES.HOME },
      { label: 'Wholesale', path: ROUTES.WHOLESALE.BASE },
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
      title="Wholesale"
      breadcrumbs={getBreadcrumbs()}
      headerTitle="Wholesale Operations"
    />
  );
};

export default WholesaleLayout;
