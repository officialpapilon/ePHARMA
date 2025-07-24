// src/types/store.ts
import { Item } from './item';
import { Supplier } from './wholesale'; // Reuse Supplier type from wholesale

export interface StockAdjustment {
  id: string;
  item_id: string;
  quantity_adjusted: number;
  reason: string;
  date: string;
}

export interface StockTaking {
  id: string;
  item_id: string;
  quantity_counted: number;
  date: string;
}

export interface StockReceiving {
  id: string;
  supplier_id: string;
  items: Item[];
  quantity_received: number;
  date: string;
  invoice_number: string;
}

export interface StoreReport {
  id: string;
  type: 'inventory' | 'stock_taking' | 'stock_adjustment' | 'stock_receiving';
  data: any;
  date: string;
}