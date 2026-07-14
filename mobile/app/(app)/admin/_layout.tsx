import { useAuth } from '@/src/auth/auth-provider';
import { useAppTheme } from '@/src/theme';
import { Redirect, Stack } from 'expo-router';

export default function AdminLayout() {
  const theme = useAppTheme();
  const { profile } = useAuth();

  if (!profile || profile.role === 'viewer') return <Redirect href="/settings" />;

  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.accent, headerTitleStyle: { color: theme.text, fontWeight: '700' }, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="images" options={{ title: 'Manage gallery' }} />
      <Stack.Screen name="image/[id]" options={{ title: 'Edit photo' }} />
      <Stack.Screen name="create-image" options={{ title: 'Add image', presentation: 'modal' }} />
      <Stack.Screen name="notes" options={{ title: 'Manage notes' }} />
      <Stack.Screen name="create-note" options={{ title: 'New note', presentation: 'modal' }} />
    </Stack>
  );
}
