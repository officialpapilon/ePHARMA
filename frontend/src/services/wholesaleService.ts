// src/services/wholesaleService.ts
import { apiClient } from '../utils/apiClient';

// Types
export interface WholesaleOrder {
  id: number;
  order_number: string;
  invoice_number: string;
  customer: {
    id: number;
    business_name: string;
    contact_person: string;
    phone: string;
  };
  order_date: string;
  delivery_date: string;
  status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface WholesaleDelivery {
  id: number;
  delivery_number: string;
  order: {
    id: number;
    order_number: string;
    total_amount: number;
  };
  customer: {
    id: number;
    business_name: string;
    contact_person: string;
    phone: string;
    address: string;
  };
  scheduled_date: string;
  actual_delivery_date: string | null;
  status: 'scheduled' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  delivery_address: string;
  contact_person: string;
  contact_phone: string;
  delivery_fee: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface WholesalePayment {
  id: number;
  payment_number: string;
  order: {
    id: number;
    order_number: string;
    total_amount: number;
    balance_amount: number;
  };
  customer: {
    id: number;
    business_name: string;
    contact_person: string;
    phone: string;
  };
  payment_date: string;
  due_date: string;
  amount: number;
  payment_type: string;
  reference_number: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface WholesaleCustomer {
  id: number;
  business_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  customer_type: string;
  credit_limit: number;
  current_balance: number;
  payment_terms: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// API Parameters types
export interface ApiParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  customer_id?: number;
}

export interface OrderData {
  customer_id: number;
  order_type: string;
  items: Array<{
    product_id: string;
    batch_no: string;
    quantity_ordered: number;
    wholesale_price: number;
    discount_percentage: number;
    tax_percentage: number;
  }>;
  expected_delivery_date: string;
  notes?: string;
  shipping_amount: number;
}

export interface DeliveryData {
  order_id: number;
  customer_id: number;
  delivery_date: string;
  delivery_address: string;
  contact_person: string;
  contact_phone: string;
  delivery_fee: number;
  notes?: string;
}

export interface PaymentData {
  order_id: number;
  customer_id: number;
  payment_date: string;
  due_date: string;
  amount: number;
  payment_type: string;
  reference_number: string;
  notes?: string;
}

// Orders API
export const wholesaleOrdersApi = {
  getAll: (params?: ApiParams) => apiClient.get('/api/wholesale/orders', { params }),
  getById: (id: number) => apiClient.get(`/api/wholesale/orders/${id}`),
  create: (data: OrderData) => apiClient.post('/api/wholesale/orders', data),
  update: (id: number, data: Partial<OrderData>) => apiClient.put(`/api/wholesale/orders/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/wholesale/orders/${id}`),
  confirm: (id: number) => apiClient.post(`/api/wholesale/orders/${id}/confirm`),
  cancel: (id: number) => apiClient.post(`/api/wholesale/orders/${id}/cancel`),
  process: (id: number) => apiClient.post(`/api/wholesale/orders/${id}/process`),
  readyForDelivery: (id: number) => apiClient.post(`/api/wholesale/orders/${id}/ready-for-delivery`),
  complete: (id: number) => apiClient.post(`/api/wholesale/orders/${id}/complete`),
  getProducts: (params?: ApiParams) => apiClient.get('/api/wholesale/products', { params }),
  searchProducts: (params?: ApiParams) => apiClient.get('/api/wholesale/products/search', { params }),
};

// Deliveries API
export const wholesaleDeliveriesApi = {
  getAll: (params?: ApiParams) => apiClient.get('/api/wholesale/deliveries', { params }),
  getById: (id: number) => apiClient.get(`/api/wholesale/deliveries/${id}`),
  create: (data: DeliveryData) => apiClient.post('/api/wholesale/deliveries', data),
  update: (id: number, data: Partial<DeliveryData>) => apiClient.put(`/api/wholesale/deliveries/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/wholesale/deliveries/${id}`),
  markInTransit: (id: number) => apiClient.post(`/api/wholesale/deliveries/${id}/in-transit`),
  markDelivered: (id: number) => apiClient.post(`/api/wholesale/deliveries/${id}/delivered`),
  markFailed: (id: number) => apiClient.post(`/api/wholesale/deliveries/${id}/failed`),
  getDeliveryMethods: () => apiClient.get('/api/wholesale/deliveries/methods'),
};

// Payments API
export const wholesalePaymentsApi = {
  getAll: (params?: ApiParams) => apiClient.get('/api/wholesale/payments', { params }),
  getById: (id: number) => apiClient.get(`/api/wholesale/payments/${id}`),
  create: (data: PaymentData) => apiClient.post('/api/wholesale/payments', data),
  update: (id: number, data: Partial<PaymentData>) => apiClient.put(`/api/wholesale/payments/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/wholesale/payments/${id}`),
  markCompleted: (id: number) => apiClient.post(`/api/wholesale/payments/${id}/complete`),
  markFailed: (id: number) => apiClient.post(`/api/wholesale/payments/${id}/fail`),
  markRefunded: (id: number) => apiClient.post(`/api/wholesale/payments/${id}/refund`),
  generateReceipt: (id: number) => apiClient.post(`/api/wholesale/payments/${id}/receipt`),
  getPaymentMethods: () => apiClient.get('/api/wholesale/payments/methods'),
};

// Customers API
export const wholesaleCustomersApi = {
  getAll: (params?: ApiParams) => apiClient.get('/api/wholesale/customers', { params }),
  getById: (id: number) => apiClient.get(`/api/wholesale/customers/${id}`),
  create: (data: Partial<WholesaleCustomer>) => apiClient.post('/api/wholesale/customers', data),
  update: (id: number, data: Partial<WholesaleCustomer>) => apiClient.put(`/api/wholesale/customers/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/wholesale/customers/${id}`),
  getCustomerTypes: () => apiClient.get('/api/wholesale/customers/types'),
  getPaymentTerms: () => apiClient.get('/api/wholesale/customers/payment-terms'),
  updateBalance: (id: number, data: { balance: number }) => apiClient.post(`/api/wholesale/customers/${id}/balance`, data),
};

// Reports API
export const wholesaleReportsApi = {
  getSales: (params?: ApiParams) => apiClient.get('/api/wholesale/reports/sales', { params }),
  getCustomers: (params?: ApiParams) => apiClient.get('/api/wholesale/reports/customers', { params }),
  getDeliveries: (params?: ApiParams) => apiClient.get('/api/wholesale/reports/deliveries', { params }),
  getPayments: (params?: ApiParams) => apiClient.get('/api/wholesale/reports/payments', { params }),
  getOverdue: (params?: ApiParams) => apiClient.get('/api/wholesale/reports/overdue', { params }),
  getDashboard: (params?: ApiParams) => apiClient.get('/api/wholesale/reports/dashboard', { params }),
};

// Utility functions
export const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD${timestamp}${random}`;
};

export const generateDeliveryNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `DEL${timestamp}${random}`;
};

export const generatePaymentNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `PAY${timestamp}${random}`;
};

export const generateTrackingNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `TRK${timestamp}${random}`;
};

export const generateReferenceNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `REF${timestamp}${random}`;
};

// Status helpers
export const getOrderStatusColor = (status: string) => {
  const colors = {
    pending: 'warning',
    confirmed: 'info',
    processing: 'primary',
    ready: 'secondary',
    completed: 'success',
    cancelled: 'error',
  };
  return colors[status as keyof typeof colors] || 'default';
};

export const getDeliveryStatusColor = (status: string) => {
  const colors = {
    pending: 'warning',
    in_transit: 'info',
    delivered: 'success',
    failed: 'error',
    returned: 'default',
  };
  return colors[status as keyof typeof colors] || 'default';
};

export const getPaymentStatusColor = (status: string) => {
  const colors = {
    pending: 'warning',
    completed: 'success',
    failed: 'error',
    refunded: 'info',
    cancelled: 'default',
  };
  return colors[status as keyof typeof colors] || 'default';
};

export const getPaymentStatusColor2 = (status: string) => {
  const colors = {
    pending: 'warning',
    partial: 'info',
    paid: 'success',
    overdue: 'error',
  };
  return colors[status as keyof typeof colors] || 'default';
};

// Validation helpers
export const validateOrderData = (data: OrderData) => {
  const errors: string[] = [];
  
  if (!data.customer_id) errors.push('Customer is required');
  if (!data.order_date) errors.push('Order date is required');
  if (!data.delivery_date) errors.push('Delivery date is required');
  if (!data.items || data.items.length === 0) errors.push('At least one item is required');
  
  return errors;
};

export const validateDeliveryData = (data: DeliveryData) => {
  const errors: string[] = [];
  
  if (!data.order_id) errors.push('Order is required');
  if (!data.customer_id) errors.push('Customer is required');
  if (!data.delivery_date) errors.push('Delivery date is required');
  if (!data.estimated_delivery) errors.push('Estimated delivery date is required');
  if (!data.tracking_number) errors.push('Tracking number is required');
  if (!data.delivery_method) errors.push('Delivery method is required');
  if (data.delivery_cost < 0) errors.push('Delivery cost cannot be negative');
  
  return errors;
};

export const validatePaymentData = (data: PaymentData) => {
  const errors: string[] = [];
  
  if (!data.order_id) errors.push('Order is required');
  if (!data.customer_id) errors.push('Customer is required');
  if (!data.payment_date) errors.push('Payment date is required');
  if (!data.due_date) errors.push('Due date is required');
  if (!data.amount || data.amount <= 0) errors.push('Valid payment amount is required');
  if (!data.payment_method) errors.push('Payment method is required');
  if (!data.reference_number) errors.push('Reference number is required');
  
  return errors;
};

export default {
  orders: wholesaleOrdersApi,
  deliveries: wholesaleDeliveriesApi,
  payments: wholesalePaymentsApi,
  customers: wholesaleCustomersApi,
  reports: wholesaleReportsApi,
};