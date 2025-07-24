// src/types/item.ts
export interface Item {
    expire_date: string;
    id: string;
    name: string;
    code: string;
    category: string;
    price: number; // Allow string (e.g., "20.00") or number
    created_at: string;
    updated_at: string;
    description: string | null;
    quantity: number; // Allow string (e.g., "0.00") or number
    brand: string | null;
    unit: string | null;
    supplier: string | null;
    manufacture_date: string | null;
    expiry_date: string | null; // Renamed from expiry_date for consistency with API
    batch_number: string | null;
  }