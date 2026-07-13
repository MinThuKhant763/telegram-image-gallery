import { useAppTheme } from '@/src/theme';
import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';

export function OfflineIndicator() {
  const theme = useAppTheme();
  const network = useNetInfo();
  const offline = network.isConnected === false || network.isInternetReachable === false;

  if (!offline) return null;

  return (
    <View pointerEvents="none" style={[styles.banner, { backgroundColor: theme.elevated, borderColor: theme.border }]}>
      <View style={[styles.dot, { backgroundColor: theme.accent }]} />
      <Text style={[styles.copy, { color: theme.text }]}>Offline — showing saved content</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { alignItems: 'center', alignSelf: 'center', borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 7, paddingHorizontal: 12, paddingVertical: 7, position: 'absolute', top: 10, zIndex: 20 },
  dot: { borderRadius: 99, height: 7, width: 7 },
  copy: { fontSize: 12, fontWeight: '700' }
});
