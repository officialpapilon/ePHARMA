import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, FilterOptions } from '../types';
import { apiClient } from '../utils/apiClient';

interface UseApiOptions {
  immediate?: boolean;
  dependencies?: any[];
}

export function useApi<T>(
  endpoint: string,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { immediate = true, dependencies = [] } = options;

  const execute = useCallback(async (params?: FilterOptions) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<ApiResponse<T>>(endpoint, { params });
      setData(response.data.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const mutate = useCallback(async (method: 'POST' | 'PUT' | 'DELETE', data?: any, id?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = id ? `${endpoint}/${id}` : endpoint;
      let response;
      
      switch (method) {
        case 'POST':
          response = await apiClient.post<ApiResponse<T>>(url, data);
          break;
        case 'PUT':
          response = await apiClient.put<ApiResponse<T>>(url, data);
          break;
        case 'DELETE':
          response = await apiClient.delete<ApiResponse<T>>(url);
          break;
      }
      
      return response.data;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate, ...dependencies]);

  return {
    data,
    loading,
    error,
    execute,
    mutate,
    setData,
    setError
  };
}

export function usePaginatedApi<T>(
  endpoint: string,
  initialFilters: FilterOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const fetchData = useCallback(async (newFilters?: FilterOptions) => {
    setLoading(true);
    setError(null);
    
    const params = { ...filters, ...newFilters };
    
    try {
      const response = await apiClient.get<ApiResponse<T[]>>(endpoint, { params });
      setData(response.data.data);
      if (response.data.meta) {
        setPagination(response.data.meta);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, filters]);

  const updateFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const changePage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const changePerPage = useCallback((per_page: number) => {
    setFilters(prev => ({ ...prev, per_page, page: 1 }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    loading,
    error,
    filters,
    fetchData,
    updateFilters,
    changePage,
    changePerPage,
    setData,
    setError
  };
}