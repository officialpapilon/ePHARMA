// src/services/storeService.ts
import { StockAdjustment, StockTaking, StockReceiving, StoreReport } from '../types/store';
import { Item } from '../types/item';
import { API_BASE_URL } from '../constants';

export const fetchInventory = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_BASE_URL}/api/store/inventory`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export const updateInventory = async (id: number, data: any) => {
  const response = await fetch(`${API_BASE_URL}/api/store/inventory/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteInventory = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/api/store/inventory/${id}`, {
    method: 'DELETE',
  });
  return response.json();
};

export const createInventory = async (data: any) => {
  const response = await fetch(`${API_BASE_URL}/api/store/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const fetchSuppliers = async () => {
  const response = await fetch(`${API_BASE_URL}/api/store/suppliers`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export const createStockAdjustment = async (data: any) => {
  const response = await fetch(`${API_BASE_URL}/api/store/stock/adjustment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const createStockTaking = async (data: any) => {
  const response = await fetch(`${API_BASE_URL}/api/store/stock/taking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const createStockReceiving = async (data: any) => {
  const response = await fetch(`${API_BASE_URL}/api/store/stock/receiving`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const fetchReports = async (type: string, startDate: string, endDate: string) => {
  const response = await fetch(`${API_BASE_URL}/api/store/reports/${type}?start=${startDate}&end=${endDate}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};