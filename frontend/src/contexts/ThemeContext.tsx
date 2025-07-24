import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const stored = localStorage.getItem('theme');
    return (stored === 'dark' || stored === 'light') ? stored : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', mode);
    if (mode === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [mode]);

  const toggleTheme = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode,
        ...(mode === 'light'
          ? {
              primary: {
                main: '#1976d2', // pharmacy blue
                light: '#63a4ff',
                dark: '#004ba0',
                contrastText: '#fff',
              },
              secondary: {
                main: '#43cea2', // teal accent
                light: '#b2f7ef',
                dark: '#11998e',
                contrastText: '#fff',
              },
              background: {
                default: '#f4f8fb', // soft blue/gray
                paper: '#fff',
              },
              text: {
                primary: '#1a237e', // deep blue
                secondary: '#546e7a', // blue-gray
              },
              divider: '#e3eaf2',
              success: { main: '#43a047', contrastText: '#fff' },
              error: { main: '#e53935', contrastText: '#fff' },
              warning: { main: '#fbc02d', contrastText: '#fff' },
              info: { main: '#1976d2', contrastText: '#fff' },
              action: {
                hover: '#e3f2fd',
                selected: '#bbdefb',
                disabled: '#b0bec5',
                disabledBackground: '#eceff1',
              },
            }
          : {
              primary: {
                main: '#22304a', // deep blue-gray
                light: '#3a4a6b',
                dark: '#101c2c',
                contrastText: '#fff',
              },
              secondary: {
                main: '#43cea2',
                light: '#b2f7ef',
                dark: '#11998e',
                contrastText: '#fff',
              },
              background: {
                default: '#181f2a', // soft deep blue
                paper: '#232e42', // card bg
              },
              text: {
                primary: '#f4f8fb', // very light
                secondary: '#b0bec5', // blue-gray
              },
              divider: '#2c3a4e',
              success: { main: '#43a047', contrastText: '#fff' },
              error: { main: '#e57373', contrastText: '#fff' },
              warning: { main: '#ffd54f', contrastText: '#fff' },
              info: { main: '#63a4ff', contrastText: '#fff' },
              action: {
                hover: '#22304a',
                selected: '#2c3a4e',
                disabled: '#3a4a6b',
                disabledBackground: '#232e42',
              },
            }),
      },
      typography: {
        fontFamily: 'Inter, Roboto, Arial, sans-serif',
        h1: { fontWeight: 800, fontSize: '2.5rem', letterSpacing: 0.5 },
        h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: 0.3 },
        h3: { fontWeight: 700, fontSize: '1.5rem', letterSpacing: 0.2 },
        h4: { fontWeight: 600, fontSize: '1.2rem', letterSpacing: 0.1 },
        body1: { fontSize: '1rem', fontWeight: 500 },
        body2: { fontSize: '0.95rem', fontWeight: 400 },
        button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0.1 },
      },
      shape: {
        borderRadius: 16,
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              boxShadow: '0 4px 32px rgba(0, 80, 180, 0.08)',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '1rem',
              padding: '10px 24px',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 20,
              boxShadow: '0 4px 32px rgba(0, 80, 180, 0.08)',
            },
          },
        },
      },
    }),
  [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
};

// Export theme for custom styles if needed
export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: '#1976d2', light: '#63a4ff', dark: '#004ba0', contrastText: '#fff' },
            secondary: { main: '#43cea2', light: '#b2f7ef', dark: '#11998e', contrastText: '#fff' },
            background: { default: '#f4f8fb', paper: '#fff' },
            text: { primary: '#1a237e', secondary: '#546e7a' },
            divider: '#e3eaf2',
          }
        : {
            primary: { main: '#22304a', light: '#3a4a6b', dark: '#101c2c', contrastText: '#fff' },
            secondary: { main: '#43cea2', light: '#b2f7ef', dark: '#11998e', contrastText: '#fff' },
            background: { default: '#181f2a', paper: '#232e42' },
            text: { primary: '#f4f8fb', secondary: '#b0bec5' },
            divider: '#2c3a4e',
          }),
    },
  }); 