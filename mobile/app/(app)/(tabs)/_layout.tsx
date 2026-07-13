import { useAppTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

const icons = {
  gallery: 'images-outline',
  notes: 'document-text-outline',
  settings: 'settings-outline'
} as const;

export default function TabsLayout() {
  const theme = useAppTheme();
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: theme.accent,
      tabBarInactiveTintColor: theme.faintText,
      tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border, height: 70, paddingTop: 6 },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      tabBarIcon: ({ color, size }) => <Ionicons color={color} name={icons[route.name as keyof typeof icons]} size={size} />
    })}>
      <Tabs.Screen name="gallery" options={{ title: 'Gallery' }} />
      <Tabs.Screen name="notes" options={{ title: 'Notes' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
