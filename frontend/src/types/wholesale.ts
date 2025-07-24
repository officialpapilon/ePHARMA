// src/types/wholesale.ts
import { Item } from './item';
import { Customer } from './customer';

export interface WholesaleItem extends Item {
  wholesalePrice: number; // Additional field for wholesale-specific pricing
}

export interface Transaction {
  id: string;
  customer_id: string; // Reference to Customer.id
  items: WholesaleItem[];
  total_amount: number;
  date: string;
  payment_status: 'paid' | 'pending' | 'partial';
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
  email: string;
}

export interface StockAdjustment {
  id: string;
  item_id: string; // Reference to Item.id
  quantity_adjusted: number;
  reason: string;
  date: string;
}

export interface StockReceiving {
  id: string;
  supplier_id: string; // Reference to Supplier.id
  items: WholesaleItem[];
  quantity_received: number;
  date: string;
  invoice_number: string;
}

//export interface WholesaleItem {
//     id: string;
//     name: string;
//     code: string;
//     category: string;
//     price: number;
//     wholesalePrice: number;
//     quantity: number;
//     expiry_date: string;
//     manufacture_date: string;
//     supplier: string;
//     batch_number: string;
//     unit: string;
//   }
  
//   export interface Customer {
//     id: string;
//     name: string;
//     contact: string;
//     address: string;
//     debt: number; // Debt amount owed by customer
//   }
  
//   export interface Transaction {
//     id: string;
//     customer_id: string;
//     items: WholesaleItem[];
//     total_amount: number;
//     date: string;
//     payment_status: 'paid' | 'pending' | 'partial';
//   }
  
//   export interface Supplier {
//     id: string;
//     name: string;
//     contact: string;
//     address: string;
//     email: string;
//   }
  
//   export interface StockAdjustment {
//     id: string;
//     item_id: string;
//     quantity_adjusted: number;
//     reason: string;
//     date: string;
//   }
  
//   export interface StockReceiving {
//     id: string;
//     supplier_id: string;
//     items: WholesaleItem[];
//     quantity_received: number;
//     date: string;
//     invoice_number: string;
//   }