import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import {
  ThemeContext,
  ThemeMode,
  lightColors,
  darkColors,
  matrixColors,
} from './src/theme';
import {
  initLocalStorage,
  getUserProfile,
  getItemSync,
  setItemSync,
} from './src/lib/localStore';
import { initializeAdMob } from './src/lib/admob';

import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PanicScreen } from './src/screens/PanicScreen';
import { AudioScreen } from './src/screens/AudioScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { MatrixScreen } from './src/screens/MatrixScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { TabRoute } from './src/components/BottomNav';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [route, setRoute] = useState<string>('dashboard');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    initializeAdMob();
    initLocalStorage().then(() => {
      const profile = getUserProfile();
      const savedTheme = getItemSync('theme_mode') as ThemeMode | null;
      if (savedTheme) {
        setThemeMode(savedTheme);
      } else {
        setThemeMode('dark');
        setItemSync('theme_mode', 'dark');
      }
      if (!profile?.name) {
        setRoute('onboarding');
      } else {
        setRoute('dashboard');
      }
      setIsReady(true);
    });
  }, []);

  const themeValue = useMemo(() => {
    let colors = darkColors;
    if (route === 'matrix') {
      colors = matrixColors;
    } else if (themeMode === 'light') {
      colors = lightColors;
    }

    return {
      mode: themeMode,
      colors,
      setMode: (m: ThemeMode) => {
        setThemeMode(m);
        setItemSync('theme_mode', m);
      },
      toggleTheme: () => {
        const next = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(next);
        setItemSync('theme_mode', next);
      },
    };
  }, [themeMode, route]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  const currentTab: TabRoute =
    route === 'progress' ? 'progress' : route === 'profile' ? 'profile' : 'dashboard';

  let ScreenComponent: React.ReactNode;

  switch (route) {
    case 'onboarding':
      ScreenComponent = <OnboardingScreen onComplete={() => setRoute('dashboard')} />;
      break;
    case 'panic':
      ScreenComponent = <PanicScreen onNavigate={setRoute} />;
      break;
    case 'audio':
      ScreenComponent = <AudioScreen onNavigate={setRoute} />;
      break;
    case 'progress':
      ScreenComponent = <ProgressScreen onNavigate={setRoute} currentTab={currentTab} />;
      break;
    case 'profile':
      ScreenComponent = <ProfileScreen onNavigate={setRoute} currentTab={currentTab} />;
      break;
    case 'matrix':
      ScreenComponent = <MatrixScreen onNavigate={setRoute} currentTab={currentTab} />;
      break;
    case 'tasks':
      ScreenComponent = <TasksScreen onNavigate={setRoute} />;
      break;
    case 'dashboard':
    default:
      ScreenComponent = <DashboardScreen onNavigate={setRoute} currentTab={currentTab} />;
      break;
  }

  const isDarkStatus = route === 'panic' || route === 'audio' || route === 'matrix' || themeMode === 'dark';

  return (
    <ThemeContext.Provider value={themeValue}>
      <SafeAreaProvider>
        <StatusBar style={isDarkStatus ? 'light' : 'dark'} />
        {ScreenComponent}
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#070D1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
