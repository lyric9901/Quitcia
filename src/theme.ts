import { createContext, useContext } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  accent: string;
  accentForeground: string;
  accentMint: string;
  success: string;
  emergency: string;
}

export const lightColors: ThemeColors = {
  background: '#FAF9F6',
  foreground: '#070F26',
  card: '#FFFFFF',
  cardForeground: '#070F26',
  muted: '#F1F5F9',
  mutedForeground: '#475569',
  border: '#CBD5E1',
  accent: '#0D9488',
  accentForeground: '#FFFFFF',
  accentMint: '#14B8A6',
  success: '#10B981',
  emergency: '#E05252',
};

export const darkColors: ThemeColors = {
  background: '#070D1B',
  foreground: '#F8FAFC',
  card: '#0F172A',
  cardForeground: '#F8FAFC',
  muted: '#1E293B',
  mutedForeground: '#94A3B8',
  border: '#334155',
  accent: '#14B8A6',
  accentForeground: '#FFFFFF',
  accentMint: '#2DD4BF',
  success: '#10B981',
  emergency: '#E05252',
};

export const matrixColors: ThemeColors = {
  background: '#050D0A',
  foreground: '#F8FAFC',
  card: '#0A1612',
  cardForeground: '#F8FAFC',
  muted: '#0F261F',
  mutedForeground: '#10B981',
  border: '#065F46',
  accent: '#10B981',
  accentForeground: '#FFFFFF',
  accentMint: '#34D399',
  success: '#10B981',
  emergency: '#E05252',
};

export interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: darkColors,
  setMode: () => {},
  toggleTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);
