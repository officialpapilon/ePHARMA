// src/types/pharmacy.ts
export interface Medicine {
    id: string;
    name: string;
    code: string;
    category: string;
    price: number;
    quantity: number;
    expiry_date: string;
    manufacture_date: string;
    supplier: string;
    batch_number: string;
    unit: string;
  }
  
  export interface Patient {
    id: string;
    name: string;
    contact: string;
    medical_history: string;
    prescriptions: Medicine[];
  }
  
  export interface DispensingRecord {
    id: string;
    patient_id: string;
    medicine: Medicine;
    quantity_dispensed: number;
    date: string;
    total_price: number;
  }