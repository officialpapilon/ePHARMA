// src/types/management.ts
import { Item } from './item';
import { Customer } from './customer';
import { Supplier } from './wholesale';

export interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  performance_score: number;
  created_at: string;
  updated_at: string;
}

export interface ManagementReport {
  id: string;
  type: 'sales' | 'bulk_sales' | 'stock_taking' | 'stock_adjustment' | 'reorder' | 'stock_balance' | 'expense';
  data: any;
  date: string;
}