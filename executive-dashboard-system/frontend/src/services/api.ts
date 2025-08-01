const API_BASE_URL = 'http://192.168.100.101:8001';

export const fetchDashboardData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/overview`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const fetchFinancialSummary = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/financial-summary`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const fetchInventoryStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/inventory-status`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const fetchEmployeeProductivity = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/employee-productivity`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const fetchAlerts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/alerts`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}; 