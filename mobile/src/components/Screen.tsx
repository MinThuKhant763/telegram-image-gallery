import { OfflineIndicator } from './OfflineIndicator';
import { useAppTheme } from '@/src/theme';
import type { PropsWithChildren } from 'react';
import { SafeAreaView, StyleSheet, View, type ViewStyle } from 'react-native';

export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const theme = useAppTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.content, style]}>
        {children}
        <OfflineIndicator />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1 }
});
