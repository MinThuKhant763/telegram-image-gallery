import { Screen } from '@/src/components/Screen';
import { useAppTheme } from '@/src/theme';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  const theme = useAppTheme();
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>This memory isn’t here.</Text>
        <Text style={[styles.copy, { color: theme.mutedText }]}>The link may be old, or the item is no longer available.</Text>
        <Link href="/" style={[styles.link, { borderColor: theme.border, color: theme.accent }]}>Return to Memories</Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 32 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  copy: { fontSize: 16, lineHeight: 23, marginTop: 10, maxWidth: 290, textAlign: 'center' },
  link: { borderRadius: 999, borderWidth: 1, fontSize: 15, fontWeight: '700', marginTop: 24, overflow: 'hidden', paddingHorizontal: 18, paddingVertical: 11 }
});
