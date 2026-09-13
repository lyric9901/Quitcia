import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LayoutDashboard, BarChart3, User } from 'lucide-react-native';
import { useAppTheme } from '../theme';
import * as Haptics from 'expo-haptics';

export type TabRoute = 'dashboard' | 'progress' | 'profile';

interface BottomNavProps {
  currentRoute: TabRoute;
  onNavigate: (route: TabRoute) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  const { colors } = useAppTheme();

  const navItems = [
    { icon: LayoutDashboard, route: 'dashboard' as TabRoute, label: 'Dashboard' },
    { icon: BarChart3, route: 'progress' as TabRoute, label: 'Progress' },
    { icon: User, route: 'profile' as TabRoute, label: 'Profile' },
  ];

  const handlePress = (route: TabRoute) => {
    if (route !== currentRoute) {
      Haptics.selectionAsync().catch(() => {});
      onNavigate(route);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentRoute === item.route;
        return (
          <Pressable
            key={item.route}
            onPress={() => handlePress(item.route)}
            style={({ pressed }) => [
              styles.navButton,
              isActive && { backgroundColor: `${colors.accent}20` },
              pressed && { opacity: 0.8, transform: [{ scale: 0.92 }] },
            ]}
          >
            <Icon
              size={22}
              color={isActive ? colors.accent : colors.mutedForeground}
              strokeWidth={isActive ? 3 : 2}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    elevation: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    zIndex: 50,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
