// Centralized type definitions for the entire system
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  position: string;
  phone_number: string;
  address: string;
  belonged_branches: number[];
  last_login_at?: string;
  last_login_ip?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  age?: number;
  gender?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  product_unit: string;
  product_price: number;
  unit_price?: number;
  current_quantity: number;
  expire_date: string;
  batch_no: string;
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  transaction_id: string;
  customer_id: string;
  product_purchased: any[];
  product_quantity: any[];
  total_price: number;
  transaction_status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentDetails {
  id: string;
  transaction_id: string;
  payment_status: string;
  payment_method: string;
  payed_amount: number;
  customer_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StockTaking {
  id: number;
  products: {
    product_id: number;
    batches: {
      batch_no: string;
      product_quantity: number;
      manufacture_date: string;
      expire_date: string;
    }[];
  }[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Adjustment {
  id: number;
  product_id: string;
  batch_no: string;
  adjustment_date: string;
  adjustment_type: 'increase' | 'decrease';
  quantity_adjusted: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PharmacySettings {
  id?: number;
  logo?: string;
  stamp?: string;
  pharmacy_name: string;
  tin_number: string;
  phone_number: string;
  email: string;
  departments: Department[];
  payment_options: PaymentOption[];
  mode: 'simple' | 'complex';
  dispense_by_dept: string;
  show_expired: string;
  show_prices: string;
  default_dept?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  unit_code: string;
  dept_name: string;
  dept_description: string;
  isActive: boolean;
}

export interface PaymentOption {
  id: string;
  name: string;
  type?: 'Cash' | 'Online';
  details?: {
    integrationLink?: string;
    purchaseNumber?: string;
    holderName?: string;
  };
  isActive: boolean;
}

export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: any) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationData;
  errors?: Record<string, string[]>;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ReportData {
  title: string;
  data: any[];
  summary?: Record<string, any>;
  filters?: FilterOptions;
  generated_at: string;
}

// Navigation types
export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: NavItem[];
  permission?: string;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
  required?: boolean;
  options?: { value: string | number; label: string }[];
  validation?: any;
  placeholder?: string;
  disabled?: boolean;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}