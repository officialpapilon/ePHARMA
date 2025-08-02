import { API_BASE_URL } from '../../constants';

// Global API client with automatic 401 handling
export const apiClient = {
  async fetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Only add Authorization header if token exists and URL is not a public endpoint
    if (token && !url.includes('/wholesale/')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized responses only for protected endpoints
    if (response.status === 401 && !url.includes('/wholesale/')) {
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('branch_id');
      localStorage.removeItem('branch_name');
      
      // Redirect to login page
      window.location.href = '/login';
      throw new Error('Unauthorized - Please log in again');
    }

    // Parse JSON response
    const data = await response.json();
    return data;
  },

  async get(url: string, options: RequestInit = {}) {
    return this.fetch(url, { ...options, method: 'GET' });
  },

  async post(url: string, data: unknown, options: RequestInit = {}) {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async put(url: string, data: unknown, options: RequestInit = {}) {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(url: string, options: RequestInit = {}) {
    return this.fetch(url, { ...options, method: 'DELETE' });
  },
};