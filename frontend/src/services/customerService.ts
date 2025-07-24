// src/services/customerService.ts
export const fetchCustomers = async (): Promise<Customer[]> => {
    const response = await fetch('http://127.0.0.1:8000/api/customers');
    if (!response.ok) throw new Error('Failed to fetch customers');
    const data = await response.json();
    return data.map((customer: any) => ({
      ...customer,
      age: parseInt(customer.age, 10),
    }));
  };