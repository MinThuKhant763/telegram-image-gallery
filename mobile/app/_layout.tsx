import { AuthProvider, useAuth } from '@/src/auth/auth-provider';
import { queryClient } from '@/src/api/query-client';
import { queryPersister } from '@/src/api/query-persistence';
import { useAppSync } from '@/src/hooks/use-app-sync';
import { useAppTheme } from '@/src/theme';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLoading, session } = useAuth();
  const theme = useAppTheme();
  useAppSync();

  useEffect(() => {
    if (!isLoading) void SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <>
      <StatusBar style={theme.statusBar} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister, maxAge: 7 * 24 * 60 * 60_000 }}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
