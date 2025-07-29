import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, PaletteMode, CssBaseline } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
  isDark: boolean;
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

  const isDark = mode === 'dark';

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode,
        ...(mode === 'light'
          ? {
              primary: {
                main: '#2563eb',
                light: '#60a5fa',
                dark: '#1d4ed8',
                contrastText: '#fff',
              },
              secondary: {
                main: '#10b981',
                light: '#6ee7b7',
                dark: '#059669',
                contrastText: '#fff',
              },
              background: {
                default: '#f8fafc',
                paper: '#fff',
              },
              text: {
                primary: '#1e293b',
                secondary: '#64748b',
              },
              divider: '#e2e8f0',
              success: { main: '#10b981', contrastText: '#fff' },
              error: { main: '#ef4444', contrastText: '#fff' },
              warning: { main: '#f59e0b', contrastText: '#fff' },
              info: { main: '#3b82f6', contrastText: '#fff' },
              action: {
                hover: '#f1f5f9',
                selected: '#e2e8f0',
                disabled: '#94a3b8',
                disabledBackground: '#f1f5f9',
              },
            }
          : {
              primary: {
                main: '#3b82f6',
                light: '#60a5fa',
                dark: '#2563eb',
                contrastText: '#fff',
              },
              secondary: {
                main: '#10b981',
                light: '#6ee7b7',
                dark: '#059669',
                contrastText: '#fff',
              },
              background: {
                default: '#0f172a',
                paper: '#1e293b',
              },
              text: {
                primary: '#f1f5f9',
                secondary: '#94a3b8',
              },
              divider: '#334155',
              success: { main: '#10b981', contrastText: '#fff' },
              error: { main: '#ef4444', contrastText: '#fff' },
              warning: { main: '#f59e0b', contrastText: '#000' },
              info: { main: '#3b82f6', contrastText: '#fff' },
              action: {
                hover: '#334155',
                selected: '#475569',
                disabled: '#64748b',
                disabledBackground: '#334155',
              },
            }),
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.2 },
        h2: { fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.3 },
        h3: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.4 },
        h4: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.4 },
        h5: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4 },
        h6: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 },
        body1: { fontSize: '1rem', lineHeight: 1.6 },
        body2: { fontSize: '0.875rem', lineHeight: 1.5 },
        button: { fontWeight: 600, textTransform: 'none', fontSize: '1rem' },
        caption: { fontSize: '0.75rem', lineHeight: 1.4 },
        overline: { fontSize: '0.75rem', lineHeight: 1.4 },
      },
      shape: {
        borderRadius: 12,
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              fontSize: '1rem',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',
              fontSize: '1rem',
              padding: '8px 16px',
              minHeight: '44px',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              fontSize: '1rem',
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              fontSize: '1rem',
              '& .MuiOutlinedInput-root': {
                borderRadius: 8,
                fontSize: '1rem',
              },
              '& .MuiInputLabel-root': {
                fontSize: '1rem',
              },
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 6,
              fontSize: '0.875rem',
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              fontSize: '0.875rem',
              padding: '8px 12px',
            },
          },
        },
        MuiTableHead: {
          styleOverrides: {
            root: {
              '& .MuiTableCell-root': {
                fontSize: '0.875rem',
                fontWeight: 600,
              },
            },
          },
        },
        MuiTypography: {
          styleOverrides: {
            root: {
              fontSize: 'inherit',
            },
          },
        },
      },
    }),
  [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, isDark }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
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