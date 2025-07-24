// src/services/storeService.ts
import { StockAdjustment, StockTaking, StockReceiving, StoreReport } from '../types/store';
import { Item } from '../types/item';

export const fetchInventory = async (): Promise<Item[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/store/inventory', {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`, // Ensure authentication token
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error Response for inventory:', errorText);
    throw new Error(`Failed to fetch inventory: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  console.log('API Response for inventory:', data);

  if (data.status === 'success' && Array.isArray(data.data)) {
    return data.data.map((item: any) => ({
      id: item.id.toString(),
      name: item.name || '',
      code: item.code || '',
      category: item.category || '',
      price: item.price || '0.00',
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
      description: item.description || null,
      quantity: item.quantity || '0.00',
      brand: item.brand || null,
      unit: item.unit || null,
      supplier: item.supplier || null,
      manufacture_date: item.manufacture_date || null,
      expire_date: item.expire_date || null,
      batch_number: item.batch_number || null,
    }));
  }

  console.warn('Unexpected API response format for inventory:', data);
  throw new Error('Invalid API response format for inventory');
};


export const fetchSuppliers = async (): Promise<any[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/store/suppliers', {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`, // Ensure authentication token
    },
  });
  if (!response.ok) throw new Error('Failed to fetch suppliers');
  return response.json();
};

export const createStockAdjustment = async (adjustment: StockAdjustment): Promise<void> => {
  const response = await fetch('http://127.0.0.1:8000/api/store/stock/adjustment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`, // Ensure authentication token
    },
    body: JSON.stringify(adjustment),
  });
  if (!response.ok) throw new Error('Failed to adjust stock');
};

export const performStockTaking = async (): Promise<StockTaking[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/store/stock/taking', {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`, // Ensure authentication token
    },
  });
  if (!response.ok) throw new Error('Failed to perform stock taking');
  return response.json();
};

export const receiveStock = async (receiving: StockReceiving): Promise<void> => {
  const response = await fetch('http://127.0.0.1:8000/api/store/stock/receiving', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`, // Ensure authentication token
    },
    body: JSON.stringify(receiving),
  });
  if (!response.ok) throw new Error('Failed to receive stock');
};

export const generateStoreReport = async (type: string, startDate: string, endDate: string): Promise<StoreReport> => {
  const response = await fetch(`http://127.0.0.1:8000/api/store/reports/${type}?start=${startDate}&end=${endDate}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`, // Ensure authentication token
    },
  });
  if (!response.ok) throw new Error('Failed to generate report');
  return response.json();
};