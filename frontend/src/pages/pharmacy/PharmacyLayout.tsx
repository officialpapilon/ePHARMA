import React from 'react';
import { useLocation } from 'react-router-dom';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { LocalPharmacy, Assignment, Approval, Inventory } from '@mui/icons-material';
import Layout from '../../components/layout/Layout/Layout';
import { useSettings } from '../../contexts/SettingsContext';
import { NavItem, BreadcrumbItem } from '../../types';
import { ROUTES } from '../../utils/constants';

const PharmacyLayout: React.FC = () => {
  const location = useLocation();
  const { settings } = useSettings();

  const navItems = [
    ...(settings?.mode === 'simple' 
      ? [{ label: 'Dispensing', path: ROUTES.PHARMACY.SIMPLE_DISPENSING, icon: <LocalPharmacy /> }] 
      : [{ label: 'Dispensing', path: ROUTES.PHARMACY.DISPENSING, icon: <LocalPharmacy /> }]
    ),
    { label: 'Transaction Approve', path: ROUTES.PHARMACY.TRANSACTION_APPROVE, icon: <Approval /> },
    { label: 'Stock Manager', path: ROUTES.PHARMACY.STOCK_MANAGER, icon: <Inventory /> },
    { label: 'Patient Records', path: ROUTES.PHARMACY.PATIENT_RECORDS, icon: <PeopleAltIcon /> },
    { label: 'Dispensing Report', path: ROUTES.PHARMACY.DISPENSING_REPORT, icon: <BarChartIcon /> },
    { label: 'Stock Report', path: ROUTES.PHARMACY.EXPIRING_REPORT, icon: <AssessmentIcon /> },
  ] as NavItem[];

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: ROUTES.HOME },
      { label: 'Pharmacy', path: ROUTES.PHARMACY.BASE },
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
    <main style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', background: '#f5f7fa', boxSizing: 'border-box', padding: '16px' }}>
      <Layout
        navItems={navItems}
        title="Pharmacy"
        breadcrumbs={getBreadcrumbs()}
        headerTitle="Pharmacy Management"
      />
    </main>
  );
};

export default PharmacyLayout;
