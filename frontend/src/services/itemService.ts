// src/services/itemService.ts
export const fetchItems = async (): Promise<Item[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/items');
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch items: ${errorText || response.statusText}`);
  }
  const data = await response.json();
  // Ensure data is an array and handle the "status" field if present
  if (data.status === 'success' && Array.isArray(data.data)) {
    return data.data.map((item: any) => ({
      id: item.id.toString(),
      name: item.name || '',
      code: item.code || '',
      category: item.category || '',
      price: item.price || '0.00', // Keep as string to match API
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
      description: item.description || null,
      quantity: item.quantity || '0.00', // Keep as string to match API
      brand: item.brand || null,
      unit: item.unit || null,
      supplier: item.supplier || null,
      manufacture_date: item.manufacture_date || null,
      expire_date: item.expire_date || null,
      batch_number: item.batch_number || null,
    }));
  }
  throw new Error('Invalid API response format');
};