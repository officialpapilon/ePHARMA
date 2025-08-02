import React from 'react';
import { useLocation } from 'react-router-dom';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BarChartIcon from '@mui/icons-material/BarChart';
import Layout from '../../components/layout/Layout/Layout';
import { NavItem, BreadcrumbItem } from '../../types';

const WholesaleLayout: React.FC = () => {
  const location = useLocation();
  const navItems = [
    { label: 'Dashboard', path: '/wholesale', icon: <AssessmentIcon /> },
    { label: 'Point of Sale', path: '/wholesale/pos', icon: <PointOfSaleIcon /> },
    { label: 'Orders', path: '/wholesale/orders', icon: <ShoppingCartIcon /> },
    { label: 'Deliveries', path: '/wholesale/deliveries', icon: <LocalShippingIcon /> },
    { label: 'Customers', path: '/wholesale/customers', icon: <PeopleIcon /> },
    { label: 'Reports', path: '/wholesale/reports', icon: <BarChartIcon /> },
  ] as NavItem[];

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/' },
      { label: 'Wholesale', path: '/wholesale' },
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
    />
  );
};

export default WholesaleLayout; 