import { useAppTheme } from '@/src/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export function LoadingView() {
  const theme = useAppTheme();
  return <View style={styles.center}><ActivityIndicator color={theme.accent} size="large" /></View>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.detail, { color: theme.mutedText }]}>{detail}</Text>
    </View>
  );
}

export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  const theme = useAppTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.title, { color: theme.text }]}>Couldn’t load this</Text>
      <Text style={[styles.detail, { color: theme.mutedText }]}>{message}</Text>
      <Pressable onPress={retry} style={[styles.retry, { borderColor: theme.border }]}>
        <Text style={{ color: theme.accent, fontWeight: '700' }}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 32 },
  title: { fontSize: 19, fontWeight: '700', textAlign: 'center' },
  detail: { fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 280, textAlign: 'center' },
  retry: { borderRadius: 999, borderWidth: 1, marginTop: 20, paddingHorizontal: 18, paddingVertical: 10 }
});
