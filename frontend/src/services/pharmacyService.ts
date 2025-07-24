// src/services/pharmacyService.ts
export const fetchMedicines = async (): Promise<Medicine[]> => {
    const response = await fetch('http://127.0.0.1:8000/api/itens');
    if (!response.ok) throw new Error('Failed to fetch medicines');
    return response.json();
  };
  
  export const fetchpatients = async (): Promise<Medicine[]> => {
    const response = await fetch('http://192.168.100.211:8000/api/patients');
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
  };
  

  export const dispenseMedicine = async (record: DispensingRecord): Promise<void> => {
    const response = await fetch('http://127.0.0.1:8000/api/pharmacy/dispense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error('Failed to dispense medicine');
  };
  
  export const getDispensedRecords = async (): Promise<DispensingRecord[]> => {
    const response = await fetch('http://127.0.0.1:8000/api/pharmacy/dispensed');
    if (!response.ok) throw new Error('Failed to fetch dispensed records');
    return response.json();
  };
  
  export const getPatients = async (): Promise<Patient[]> => {
    const response = await fetch('http://127.0.0.1:8000/api/customers');
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
  };
  
  export const generateDispensingReport = async (startDate: string, endDate: string): Promise<any> => {
    const response = await fetch(`http://127.0.0.1:8000/api/pharmacy/report?start=${startDate}&end=${endDate}`);
    if (!response.ok) throw new Error('Failed to generate report');
    return response.json();
  };