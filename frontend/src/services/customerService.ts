import { API_BASE_URL } from '../constants';

export const fetchCustomers = async () => {
  const response = await fetch(`${API_BASE_URL}/api/customers`);
  return response.json();
};