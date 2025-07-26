// Application constants
export const APP_CONFIG = {
  NAME: 'ePharma',
  VERSION: '2.0.0',
  DESCRIPTION: 'Modern Pharmacy Management System',
  AUTHOR: 'Pharmacy Solutions',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/login',
    LOGOUT: '/api/logout',
    ME: '/api/user',
  },
  CUSTOMERS: '/api/customers',
  MEDICINES: '/api/medicines',
  MEDICINES_CACHE: '/api/medicines-cache',
  DISPENSED: '/api/dispensed',
  CARTS: '/api/carts',
  PAYMENT_DETAILS: '/api/payment-details',
  PAYMENT_APPROVE: '/api/payment-approve',
  STOCK_TAKING: '/api/stock-taking',
  ADJUSTMENTS: '/api/stock-adjustments',
  SETTINGS: {
    PHARMACY: '/api/settings/pharmacy',
    DEPARTMENTS: '/api/settings/pharmacy/departments',
    PAYMENT_OPTIONS: '/api/settings/pharmacy/payment-options',
    DISPENSING: '/api/settings/pharmacy/dispensing',
  },
  REPORTS: {
    DISPENSING: '/api/dispensing-report',
    PAYMENT_METHODS: '/api/payment-methods',
  },
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PHARMACY: {
    BASE: '/pharmacy',
    DASHBOARD: '/pharmacy',
    DISPENSING: '/pharmacy/dispensing',
    SIMPLE_DISPENSING: '/pharmacy/dispensing/simple',
    TRANSACTION_APPROVE: '/pharmacy/transaction-approve',
    STOCK_MANAGER: '/pharmacy/stock-manager',
    PATIENT_RECORDS: '/pharmacy/patient-records',
    DISPENSING_REPORT: '/pharmacy/dispensing-report',
    EXPIRING_REPORT: '/pharmacy/expiring-report',
  },
  CASHIER: {
    BASE: '/cashier',
    DASHBOARD: '/cashier',
    PAYMENT: '/cashier/payment',
    PAYMENT_REPORT: '/cashier/payment-report',
    PRINT_RECORDS: '/cashier/print-records',
    FINANCIAL_ACTIVITIES: '/cashier/financial-activities',
  },
  MANAGEMENT: {
    BASE: '/management',
    DASHBOARD: '/management',
    INVENTORY: '/management/inventory',
    INVENTORY_REPORTS: '/management/inventory-reports',
    STOCK_STATUS_REPORT: '/management/stock-status-report',
    DISPENSING_REPORTS: '/management/dispensing-reports',
    PAYMENT_REPORTS: '/management/payment-reports',
    STOCK_TAKING_REPORT: '/management/stock-taking-report',
  },
  STORE: {
    BASE: '/store',
    DASHBOARD: '/store',
    ITEMS_MANAGERS: '/store/items-managers',
    STOCK_TAKING: '/store/stock-taking',
    STOCK_TAKING_REPORT: '/store/stock-taking-report',
    STOCK_ADJUSTMENTS: '/store/stock-adjustments',
    RECEIVING_STOCK: '/store/receiving-stock',
    STORE_REPORTS: '/store/store-reports',
  },
  WHOLESALE: {
    BASE: '/wholesale',
    DASHBOARD: '/wholesale',
    POS: '/wholesale/pos',
    CUSTOMERS: '/wholesale/customers',
    ITEMS_MANAGER: '/wholesale/items-manager',
    STOCK_TAKING: '/wholesale/stock-taking',
    STOCK_ADJUSTMENT: '/wholesale/stock-adjustment',
    REPORT: '/wholesale/report',
  },
  SETTINGS: {
    BASE: '/settings',
    PHARMACY: '/settings/pharmacy',
    USERS: '/settings/users',
    PAYMENT_METHODS: '/settings/payment-methods',
    STOCK_TAKING_REASONS: '/settings/stock-taking-reasons',
    ADJUSTMENT_REASONS: '/settings/adjustment-reasons',
    EXPENSE_CATEGORIES: '/settings/expense-categories',
    SYSTEM: '/settings/system',
  },
};

export const PERMISSIONS = {
  PHARMACY: {
    VIEW: 'pharmacy.view',
    DISPENSE: 'pharmacy.dispense',
    MANAGE_STOCK: 'pharmacy.manage_stock',
    VIEW_REPORTS: 'pharmacy.view_reports',
  },
  CASHIER: {
    VIEW: 'cashier.view',
    PROCESS_PAYMENTS: 'cashier.process_payments',
    VIEW_REPORTS: 'cashier.view_reports',
  },
  MANAGEMENT: {
    VIEW: 'management.view',
    MANAGE_INVENTORY: 'management.manage_inventory',
    VIEW_ALL_REPORTS: 'management.view_all_reports',
    MANAGE_USERS: 'management.manage_users',
  },
  SETTINGS: {
    VIEW: 'settings.view',
    MANAGE: 'settings.manage',
  },
};

export const STATUS_OPTIONS = {
  TRANSACTION: [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  PAYMENT: [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
  ],
  STOCK: [
    { value: 'in-stock', label: 'In Stock' },
    { value: 'low-stock', label: 'Low Stock' },
    { value: 'out-of-stock', label: 'Out of Stock' },
    { value: 'expired', label: 'Expired' },
    { value: 'near-expiry', label: 'Near Expiry' },
  ],
};

export const PAGINATION_OPTIONS = [5, 10, 25, 50, 100];

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  API: 'yyyy-MM-dd',
  DATETIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm:ss',
};

export const VALIDATION_RULES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  PHONE: 'Please enter a valid phone number',
  MIN_LENGTH: (min: number) => `Minimum ${min} characters required`,
  MAX_LENGTH: (max: number) => `Maximum ${max} characters allowed`,
  POSITIVE_NUMBER: 'Please enter a positive number',
  FUTURE_DATE: 'Date must be in the future',
  PAST_DATE: 'Date must be in the past',
};