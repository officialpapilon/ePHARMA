// src/types/cashier.ts
import { Item } from './item';
import { Customer } from './customer';

export interface Transaction {
  id: string;
  customer_id: string;
  items: Item[];
  total_amount: number;
  payment_method: string;
  date: string;
  status: 'completed' | 'pending';
}

export interface Receipt {
  id: string;
  transaction_id: string;
  customer_name: string;
  items: Item[];
  total_amount: number;
  payment_method: string;
  date: string;
}

export interface CashierReport {
  id: string;
  type: 'sales';
  data: any;
  date: string;
}