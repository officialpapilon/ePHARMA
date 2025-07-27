import { API_BASE_URL } from '../constants';

export const fetchItems = async () => {
  const response = await fetch(`${API_BASE_URL}/api/itens`);
  return response.json();
};

export const dispenseMedicine = async (dispenseData: any) => {
  const response = await fetch(`${API_BASE_URL}/api/pharmacy/dispense`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dispenseData),
  });
  return response.json();
};

export const fetchDispensed = async () => {
  const response = await fetch(`${API_BASE_URL}/api/pharmacy/dispensed`);
  return response.json();
};

export const fetchCustomers = async () => {
  const response = await fetch(`${API_BASE_URL}/api/customers`);
  return response.json();
};

export const fetchPharmacyReport = async (startDate: string, endDate: string) => {
  const response = await fetch(`${API_BASE_URL}/api/pharmacy/report?start=${startDate}&end=${endDate}`);
  return response.json();
};