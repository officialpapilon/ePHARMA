import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from "./contexts/SettingsContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Lazy load all page components
const LoginPage = React.lazy(() => import('./pages/login/LoginPage'));
const Home = React.lazy(() => import("./components/Home"));
const CashierLayout = React.lazy(() => import("./pages/cashier/CashierLayout"));
const CashierDashboard = React.lazy(() => import("./pages/cashier/CashierDashboard"));
const Payment = React.lazy(() => import("./pages/cashier/Payment"));
const PaymentReport = React.lazy(() => import("./pages/cashier/PaymentReport"));
const PrintRecords = React.lazy(() => import("./pages/cashier/PrintRecords"));
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
const ReceivingStock = React.lazy(() => import('./pages/store/ReceivingStock'));
const StockTakingReport = React.lazy(() => import('./pages/store/StockTakingReport'));
const StoreReports = React.lazy(() => import('./pages/store/StoreReports'));
const WholesaleStockTaking = React.lazy(() => import('./pages/wholesale/StockTaking'));
const Pos = React.lazy(() => import("./pages/wholesale/Pos"));
const Customers = React.lazy(() => import("./pages/wholesale/Customers"));
const ItemsManager = React.lazy(() => import("./pages/wholesale/ItemsManager"));
const StockAdjustment = React.lazy(() => import("./pages/wholesale/StockAdjustment"));
const Report = React.lazy(() => import("./pages/wholesale/Report"));
const WholesaleLayout = React.lazy(() => import("./pages/wholesale/WholesaleLayout"));
const WholesaleDashboard = React.lazy(() => import("./pages/wholesale/WholesaleDashboard"));

// PrivateRoute component
const PrivateRoute: React.FC<{ element: JSX.Element }> = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" />;
};

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><span>Loading...</span></div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Home />} />

              {/* Protected Routes */}
              <Route path="/cashier/*" element={<PrivateRoute element={<CashierLayout />} />}>
                <Route index element={<CashierDashboard />} />
                <Route path="payment" element={<Payment />} />
                <Route path="paymentReport" element={<PaymentReport />} />
                <Route path="PrintRecords" element={<PrintRecords />} />
              </Route>

              <Route path="/pharmacy/*" element={<PrivateRoute element={<PharmacyLayout />} />}>
                <Route index element={<PharmacyDashboard />} />
                <Route path="TransactionApprove" element={<TransactionApprove />} />
                <Route path="Dispensing" element={<Dispensing />} />
                <Route path="Dispensing/simple" element={<SimpleDispensing />} />
                <Route path="dispensingReport" element={<DispensingReport />} />
                <Route path="PatientRecords" element={<PatientRecords />} />
                <Route path="StockManager" element={<StockManager />} />
                <Route path="ExpiringReport" element={<ExpiringReport />} />
              </Route>

              <Route path="/wholesale/*" element={<PrivateRoute element={<WholesaleLayout />} />}>
                <Route index element={<WholesaleDashboard />} />
                <Route path="Pos" element={<Pos />} />
                <Route path="Customers" element={<Customers />} />
                <Route path="ItemsManager" element={<ItemsManager />} />
                <Route path="StockAdjustment" element={<StockAdjustment />} />
                <Route path="Report" element={<Report />} />
                <Route path="StockTaking" element={<WholesaleStockTaking />} />
              </Route>

              <Route path="/management/*" element={<PrivateRoute element={<ManagementLayout />} />}>
                <Route index element={<ManagementDashboard />} />
                <Route path="Inventory" element={<Inventory />} />
                <Route path="InventoryReports" element={<InventoryReports />} />
                <Route path="StockStatusReport" element={<StockStatudReport />} />
                <Route path="StockAdjusting" element={<StockAdjusting />} />
                <Route path="StockReceiving" element={<StockReceiving />} />
                <Route path="StockReceivingReport" element={<StockReceivingReport />} />
                <Route path="StockTakingReport" element={<ManagementStockTakingReport />} />
                <Route path="DispensingReports" element={<DispensingReports />} />
                <Route path="PaymentReports" element={<PaymentReports />} />
                <Route path="ManagementReports" element={<ManagementReports />} />
              </Route>

              <Route path="/store/*" element={<PrivateRoute element={<StoreLayout />} />}>
                <Route index element={<StoreDashboard />} />
                <Route path="itemsMAnagers" element={<ItemsManagers />} />
                <Route path="StockTaking" element={<StockTaking />} />
                <Route path="StockTakingReport" element={<StockTakingReport />} />
                <Route path="StockAdjustments" element={<StockAdjustments />} />
                <Route path="ReceivingStock" element={<ReceivingStock />} />
                <Route path="StoreReport" element={<StoreReports />} />
              </Route>

              <Route path="/settings/*" element={<PrivateRoute element={<SettingsLayout />} />}>
                <Route path="pharmacy-settings" element={<PharmacySettings />} />
                <Route path="pharmacy" element={<PharmacySettings />} />
                <Route path="payment-methods" element={<PaymentMethods />} />
                <Route path="stock-taking-reasons" element={<StockTakingReasons />} />
                <Route path="adjustment-reasons" element={<AdjustmentReasons />} />
                <Route path="expense-categories" element={<ExpenseCategories />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="system" element={<SystemSettings />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;