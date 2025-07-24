// src/types/settings.ts
export interface PharmacySettings {
    id: string;
    name: string;
    value: string;
    description: string;
    logo: string;
    tin_number: string;
    phone_number	: string;
    email: string;
    isActive: boolean;
    stamp: string;
    departments: Department[];
    paymentMethods: PaymentMethod[];
    payment_options: PaymentOption[];
    unit_code: string;
    pharmacyInfo: PharmacyInfo;
  }
  
  export interface PaymentMethod {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
  }
  
  export interface Reason {
    id: string;
    name: string;
    description: string;
    type: 'stock_taking' | 'adjustment';
  }
  
  export interface ExpenseCategory {
    id: string;
    name: string;
    description: string;
  }
  
  export interface User {
    id: string;
    username: string;
    role: string;
    email: string;
    is_active: boolean;
  }
  
  export interface SystemSetting {
    id: string;
    key: string;
    value: string;
    dept_description: string;
    department: string;
    unit_code: string;
    dept_name: string;
    isActive: boolean;
  }

  export interface PaymentOption {
    id: string;
    name: string;
    details: Record<string, any>;
    isActive: boolean;
    payment_options	: string;
  }
  export interface PharmacyInfo {
    id: string;
    tinNumber: string;
    phoneNumber: string;
    email: string;
    isActive: boolean;
  }
  export interface Department {
    id: string;
    unit_code: string;
    dept_name: string;
    dept_description: string;
    isActive: boolean;
  }

