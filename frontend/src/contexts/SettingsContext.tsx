import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { useAuth } from './AuthContext'; 

interface PharmacySettings {
  mode: 'simple' | 'complex';
  dispense_by_dept: string;
  show_expired: string;
  show_prices: string;
  default_dept?: string;
  departments?: string[];
  payment_methods?: string[];
  payment_options?: string[];
  unit_code?: string;
  pharmacyInfo?: {
    id: string;
    name: string;
    value: string;
    description: string;
    logo: string;
    tin_number: string;
    phone_number: string;
    email: string;
    isActive: boolean;
    stamp: string;
  };
}

interface SettingsContextType {
  settings: PharmacySettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  dispensingMode: 'simple' | 'complex';
  dispenseByDept: boolean;
  showExpiredMeds: boolean;
  showPrices: boolean;
  selectedDept: string;
  updateSettings: (newSettings: Partial<PharmacySettings>) => Promise<void>;
  departments: string[];
  paymentMethods: string[];
  paymentOptions: string[];
  unitCode: string;
  pharmacyInfo: PharmacySettings['pharmacyInfo'];
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PharmacySettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dispensingMode, setDispensingMode] = useState<'simple' | 'complex'>('simple');
  const [dispenseByDept, setDispenseByDept] = useState<boolean>(false);
  const [showExpiredMeds, setShowExpiredMeds] = useState<boolean>(false);
  const [showPrices, setShowPrices] = useState<boolean>(true);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<string[]>([]);
  const [unitCode, setUnitCode] = useState<string>('');
  const [pharmacyInfo, setPharmacyInfo] = useState<PharmacySettings['pharmacyInfo']>(undefined);
  
  const { isAuthenticated } = useAuth();

  // Initialize settings when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    } else {
      // Clear settings when logged out
      setSettings(null);
    }
  }, [isAuthenticated]);

  const fetchSettings = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<PharmacySettings>(
        `${API_BASE_URL}/api/settings/pharmacy`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      
      processSettings(response.data);
    } catch (err) {
      setError("Failed to load settings. Please try again later.");
      console.error("Error fetching settings:", err);
      if (axios.isAxiosError(err)) {
        console.error("Error details:", err.response?.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  const processSettings = (loadedSettings: PharmacySettings) => {
    setSettings(loadedSettings);
    
    if (loadedSettings) {
      setDispensingMode(loadedSettings.mode === 'complex' ? 'complex' : 'simple');
      setDispenseByDept(loadedSettings.dispense_by_dept === 'true');
      setShowExpiredMeds(loadedSettings.show_expired === 'true');
      setShowPrices(loadedSettings.show_prices === 'true');
      setSelectedDept(loadedSettings.default_dept || '');
      setDepartments(loadedSettings.departments || []);
      setPaymentMethods(loadedSettings.payment_methods || []);
      setPaymentOptions(loadedSettings.payment_options || []);
      setUnitCode(loadedSettings.unit_code || '');
      setPharmacyInfo(loadedSettings.pharmacyInfo);
    }
  };

  const updateSettings = async (newSettings: Partial<PharmacySettings>) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/settings/pharmacy`,
        newSettings,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      
      processSettings(response.data);
    } catch (err) {
      setError("Failed to update settings. Please try again later.");
      console.error("Error updating settings:", err);
      if (axios.isAxiosError(err)) {
        console.error("Error details:", err.response?.data);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        settings,
        isLoading,
        error,
        fetchSettings,
        refreshSettings,
        dispensingMode,
        dispenseByDept,
        showExpiredMeds,
        showPrices,
        selectedDept,
        updateSettings,
        departments,
        paymentMethods,
        paymentOptions,
        unitCode,
        pharmacyInfo
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};