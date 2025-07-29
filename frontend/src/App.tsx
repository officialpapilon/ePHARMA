import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from "./contexts/SettingsContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoadingSpinner from './components/common/LoadingSpinner/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Lazy load all page components
const LoginPage = React.lazy(() => import('./pages/login/LoginPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/login/ForgotPasswordPage'));
const Home = React.lazy(() => import("./components/Home"));
const CashierLayout = React.lazy(() => import("./pages/cashier/CashierLayout"));
const CashierDashboard = React.lazy(() => import("./pages/cashier/CashierDashboard"));
const Payment = React.lazy(() => import("./pages/cashier/Payment"));
const PaymentReport = React.lazy(() => import("./pages/cashier/PaymentReport"));
const PrintRecords = React.lazy(() => import("./pages/cashier/PrintRecords"));
const FinancialActivities = React.lazy(() => import("./pages/cashier/FinancialActivities"));
const ManagementLayout = React.lazy(() => import("./pages/management/ManagementLayout"));
const StockStatudReport = React.lazy(() => import("./pages/management/StockStatusReport"));
const InventoryReports = React.lazy(() => import("./pages/management/InventoryReports"));
const ManagementDashboard = React.lazy(() => import("./pages/management/ManagementDashboard"));
const StockAdjusting = React.lazy(() => import("./pages/management/StockAdjusting"));
const Inventory = React.lazy(() => import("./pages/management/Inventory"));
const StockReceiving = React.lazy(() => import("./pages/management/StockReceiving"));
const StockReceivingReport = React.lazy(() => import("./pages/management/StockReceivingReport"));
const DispensingReports = React.lazy(() => import("./pages/management/DispensingReports"));
const PaymentReports = React.lazy(() => import("./pages/management/PaymentReports"));
const ManagementReports = React.lazy(() => import("./pages/management/InventoryReports"));
const ManagementStockTakingReport = React.lazy(() => import("./pages/management/StockTakingReport"));
const FinancialAudit = React.lazy(() => import("./pages/management/FinancialAudit"));
const PharmacyDashboard = React.lazy(() => import("./pages/pharmacy/PharmacyDashboard"));
const TransactionApprove = React.lazy(() => import("./pages/pharmacy/TransactionApprove"));
const Dispensing = React.lazy(() => import("./pages/pharmacy/Dispensing"));
const DispensingReport = React.lazy(() => import("./pages/pharmacy/DispensingReport"));
const PatientRecords = React.lazy(() => import("./pages/pharmacy/PatientRecords"));
const PharmacyLayout = React.lazy(() => import("./pages/pharmacy/PharmacyLayout"));
const StockManager = React.lazy(() => import("./pages/pharmacy/StockManager"));
const ExpiringReport = React.lazy(() => import("./pages/pharmacy/ExpiringReport"));
const SimpleDispensing = React.lazy(() => import("./pages/pharmacy/SimpleDispense"));
const SettingsLayout = React.lazy(() => import('./pages/settings/SettingsLayout'));
const PharmacySettings = React.lazy(() => import('./pages/settings/PharmacySettings'));
const UserManagement = React.lazy(() => import('./pages/settings/UserManagement'));
const PaymentMethods = React.lazy(() => import('./pages/settings/PaymentMethods'));
const StockTakingReasons = React.lazy(() => import('./pages/settings/StockTakingReasons'));
const AdjustmentReasons = React.lazy(() => import('./pages/settings/AdjustmentReasons'));
const ExpenseCategories = React.lazy(() => import('./pages/settings/ExpenseCategories'));
const SystemSettings = React.lazy(() => import('./pages/settings/SystemSettings'));
const StoreLayout = React.lazy(() => import('./pages/store/StoreLayout'));
const StoreDashboard = React.lazy(() => import('./pages/store/StoreDashboard'));
const ItemsManagers = React.lazy(() => import('./pages/store/ItemsManagers'));
const StockTaking = React.lazy(() => import('./pages/store/StockTaking'));
const StockAdjustments = React.lazy(() => import('./pages/store/StockAdjustments'));
const StockTransfer = React.lazy(() => import('./pages/store/StockTransfer'));
const TestComponent = React.lazy(() => import('./pages/store/TestComponent'));
const ReceivingStock = React.lazy(() => import('./pages/store/ReceivingStock'));
const StockTakingReport = React.lazy(() => import('./pages/store/StockTakingReport'));
const StoreReports = React.lazy(() => import('./pages/store/StoreReports'));
const WholesaleStockTaking = React.lazy(() => import('./pages/wholesale/StockTaking'));
const Pos = React.lazy(() => import("./pages/wholesale/Pos"));
const Orders = React.lazy(() => import("./pages/wholesale/Orders"));
const Customers = React.lazy(() => import("./pages/wholesale/Customers"));
const Deliveries = React.lazy(() => import("./pages/wholesale/Deliveries"));
const Payments = React.lazy(() => import("./pages/wholesale/Payments"));
const ItemsManager = React.lazy(() => import("./pages/wholesale/ItemsManager"));
const StockAdjustment = React.lazy(() => import("./pages/wholesale/StockAdjustment"));
const Report = React.lazy(() => import("./pages/wholesale/Report"));
const WholesaleLayout = React.lazy(() => import("./pages/wholesale/WholesaleLayout"));
const WholesaleDashboard = React.lazy(() => import("./pages/wholesale/WholesaleDashboard"));
const Workflow = React.lazy(() => import("./pages/wholesale/Workflow"));
const DeliveryManagement = React.lazy(() => import("./pages/wholesale/DeliveryManagement"));

// PrivateRoute component
const PrivateRoute: React.FC<{ element: JSX.Element }> = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" />;
};

// Root route component that checks authentication
const RootRoute: React.FC = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  
  if (isInitializing) {
    return <LoadingSpinner overlay message="Validating authentication..." />;
  }
  
  return isAuthenticated ? <Navigate to="/" /> : <Navigate to="/login" />;
};

const App: React.FC = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <Router>
              <Suspense fallback={<LoadingSpinner overlay message="Loading application..." />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                  {/* Protected Routes */}
                  <Route path="/" element={<PrivateRoute element={<Home />} />} />
                  <Route path="/cashier/*" element={<PrivateRoute element={<CashierLayout />} />}>
                    <Route index element={<CashierDashboard />} />
                    <Route path="payment" element={<Payment />} />
                    <Route path="payment-report" element={<PaymentReport />} />
                    <Route path="print-records" element={<PrintRecords />} />
                    <Route path="financial-activities" element={<FinancialActivities />} />
                  </Route>

                  <Route path="/pharmacy/*" element={<PrivateRoute element={<PharmacyLayout />} />}>
                    <Route index element={<PharmacyDashboard />} />
                    <Route path="transaction-approve" element={<TransactionApprove />} />
                    <Route path="dispensing" element={<Dispensing />} />
                    <Route path="dispensing/simple" element={<SimpleDispensing />} />
                    <Route path="dispensing-report" element={<DispensingReport />} />
                    <Route path="patient-records" element={<PatientRecords />} />
                    <Route path="stock-manager" element={<StockManager />} />
                    <Route path="expiring-report" element={<ExpiringReport />} />
                  </Route>

                  <Route path="/wholesale/*" element={<PrivateRoute element={<WholesaleLayout />} />}>
                    <Route index element={<WholesaleDashboard />} />
                    <Route path="pos" element={<Pos />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="deliveries" element={<Deliveries />} />
                    <Route path="payments" element={<Payments />} />
                    <Route path="items-manager" element={<ItemsManager />} />
                    <Route path="stock-adjustment" element={<StockAdjustment />} />
                    <Route path="report" element={<Report />} />
                    <Route path="stock-taking" element={<WholesaleStockTaking />} />
                    <Route path="workflow" element={<Workflow />} />
                    <Route path="delivery-management" element={<DeliveryManagement />} />
                  </Route>

                  <Route path="/management/*" element={<PrivateRoute element={<ManagementLayout />} />}>
                    <Route index element={<ManagementDashboard />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="inventory-reports" element={<InventoryReports />} />
                    <Route path="stock-status-report" element={<StockStatudReport />} />
                    <Route path="stock-adjusting" element={<StockAdjusting />} />
                    <Route path="stock-receiving" element={<StockReceiving />} />
                    <Route path="stock-receiving-report" element={<StockReceivingReport />} />
                    <Route path="stock-taking-report" element={<ManagementStockTakingReport />} />
                    <Route path="dispensing-reports" element={<DispensingReports />} />
                    <Route path="payment-reports" element={<PaymentReports />} />
                    <Route path="management-reports" element={<ManagementReports />} />
                    <Route path="financial-audit" element={<FinancialAudit />} />
                  </Route>

                  <Route path="/store/*" element={<PrivateRoute element={<StoreLayout />} />}>
                    <Route index element={<StoreDashboard />} />
                    <Route path="items-managers" element={<ItemsManagers />} />
                    <Route path="stock-taking" element={<StockTaking />} />
                    <Route path="stock-taking-report" element={<StockTakingReport />} />
                    <Route path="stock-adjustments" element={<StockAdjustments />} />
                    <Route path="stock-transfer" element={<StockTransfer />} />
                    <Route path="receiving-stock" element={<ReceivingStock />} />
                    <Route path="store-reports" element={<StoreReports />} />
                    <Route path="test-component" element={<TestComponent />} />
                  </Route>

                  <Route path="/settings/*" element={<PrivateRoute element={<SettingsLayout />} />}>
                    <Route path="pharmacy" element={<PharmacySettings />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="payment-methods" element={<PaymentMethods />} />
                    <Route path="stock-taking-reasons" element={<StockTakingReasons />} />
                    <Route path="adjustment-reasons" element={<AdjustmentReasons />} />
                    <Route path="expense-categories" element={<ExpenseCategories />} />
                    <Route path="system" element={<SystemSettings />} />
                  </Route>

                  {/* Catch-all route - redirect to home if authenticated, login if not */}
                  <Route path="*" element={<RootRoute />} />
                </Routes>
              </Suspense>
            </Router>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;