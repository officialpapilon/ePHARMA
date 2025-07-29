import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../../constants';

interface User {
  id: number;
  name: string | null;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  position?: string | null;
  phone_number?: string | null;
  address?: string | null;
  belonged_branches?: number[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string, branchId: string) => Promise<void>;
  logout: () => void;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const [isInitializing, setIsInitializing] = useState(true);
  // Validate token on app initialization
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            // Token is valid, keep the user logged in
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear everything
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('branch_id');
            localStorage.removeItem('branch_name');
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch {
          // Network error or other issues, clear authentication
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('branch_id');
          localStorage.removeItem('branch_name');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // No token or user data, ensure clean state
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsInitializing(false);
    };

    validateToken();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    setIsAuthenticated(!!user);
  }, [user]);

  // Fix: Actually authenticate with backend
  const login = async (username: string, password: string, branchId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password, branch_id: branchId }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Login failed' };
        }
        throw new Error(errorData.message || 'Login failed');
      }
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid response format from server');
      }
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', data.token);
      
      // Store branch info from login response
      if (data.branch_id) {
        localStorage.setItem('branch_id', data.branch_id.toString());
      }
      if (data.branch_name) {
        localStorage.setItem('branch_name', data.branch_name);
      }
      
      // Use enhanced user data from login response
      if (data.user) {
        const userData: User = {
          id: data.user.id,
          name: data.user.first_name && data.user.last_name 
            ? `${data.user.first_name} ${data.user.last_name}` 
            : data.user.username,
          username: data.user.username,
          first_name: data.user.first_name || null,
          last_name: data.user.last_name || null,
          email: data.user.email || null,
          position: data.user.position || null,
          phone_number: data.user.phone_number || null,
          address: data.user.address || null,
          belonged_branches: data.user.belonged_branches || [],
        };
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // Fallback to old format if user data not available
        const userData: User = {
          id: data.user_id,
          name: data.name || data.username || username,
          username: data.username || username,
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          email: data.email || null,
          position: data.position || null,
          phone_number: data.phone_number || null,
          address: data.address || null,
          belonged_branches: data.belonged_branches || [],
        };
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('branch_id');
    localStorage.removeItem('branch_name');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access AuthContext values
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
