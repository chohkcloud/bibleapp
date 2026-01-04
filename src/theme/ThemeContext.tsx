import React, { createContext, useContext, useState, ReactNode } from 'react';
import { lightColors, darkColors, Colors } from './colors';
import { spacing, borderRadius } from './spacing';
import { typography } from './typography';

interface Theme {
  colors: Colors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  isDark: boolean;
}

interface ThemeContextValue extends Theme {
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDark, setIsDark] = useState(false);

  const theme: ThemeContextValue = {
    colors: isDark ? darkColors : lightColors,
    spacing,
    borderRadius,
    typography,
    isDark,
    toggleTheme: () => setIsDark(!isDark),
    setTheme: (dark: boolean) => setIsDark(dark),
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
