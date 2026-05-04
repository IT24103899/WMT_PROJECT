import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        setIsDarkMode(systemScheme === 'dark');
      }
    };
    loadTheme();
  }, [systemScheme]);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const theme = {
    dark: isDarkMode,
    colors: isDarkMode ? darkColors : lightColors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

const lightColors = {
  primary: '#4f46e5',
  secondary: '#6366f1',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  card: '#ffffff',
  accent: '#fbbf24',
  error: '#ef4444',
  success: '#10b981',
  headerGradient: ['#1e1b4b', '#4338ca', '#6366f1'],
  tabBar: '#ffffff',
};

const darkColors = {
  primary: '#818cf8',
  secondary: '#6366f1',
  background: '#000000', // Amoled Black
  surface: '#121212',    // Deep Surface
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#1e293b',
  card: '#121212',
  accent: '#fbbf24',
  error: '#f87171',
  success: '#34d399',
  headerGradient: ['#000000', '#0a0a0a', '#1e1b4b'], // Darker Gradient
  tabBar: '#000000',
};

export const useTheme = () => useContext(ThemeContext);
