import { API_BASE_URL } from '../constants';

export const fetchItems = async () => {
  const response = await fetch(`${API_BASE_URL}/api/items`);
  return response.json();
};