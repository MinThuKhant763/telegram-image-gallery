import { useAuth } from '@/src/auth/auth-provider';
import { Screen } from '@/src/components/Screen';
import { useAppTheme } from '@/src/theme';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { profile, error, refreshProfile, signOut } = useAuth();
  const canEdit = profile && profile.role !== 'viewer';

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <View style={[styles.account, { borderColor: theme.border }]}>
          <Text style={[styles.name, { color: theme.text }]}>{profile?.displayName || 'Gallery member'}</Text>
          <Text style={[styles.email, { color: theme.mutedText }]}>{profile?.email || 'Loading account…'}</Text>
          <Text style={[styles.role, { color: theme.accent }]}>{profile?.role || 'viewer'}</Text>
        </View>
        {canEdit ? <Pressable onPress={() => router.push('/admin/images')} style={[styles.row, { borderBottomColor: theme.border }]}><Text style={[styles.rowText, { color: theme.text }]}>Manage gallery</Text><Text style={{ color: theme.accent }}>›</Text></Pressable> : null}
        <View style={[styles.row, { borderBottomColor: theme.border }]}><Text style={[styles.rowText, { color: theme.text }]}>Appearance</Text><Text style={{ color: theme.mutedText }}>System</Text></View>
        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
        <Pressable onPress={() => void refreshProfile()} style={[styles.secondaryButton, { borderColor: theme.border }]}><Text style={{ color: theme.text, fontWeight: '700' }}>Refresh account</Text></Pressable>
        <Pressable onPress={() => void signOut()} style={styles.signOut}><Text style={{ color: theme.danger, fontSize: 16, fontWeight: '700' }}>Sign out</Text></Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -0.8, marginTop: 12 },
  account: { borderBottomWidth: StyleSheet.hairlineWidth, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 28, paddingVertical: 19 },
  name: { fontSize: 18, fontWeight: '700' },
  email: { fontSize: 14, marginTop: 5 },
  role: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginTop: 13, textTransform: 'uppercase' },
  row: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 62 },
  rowText: { fontSize: 16 },
  error: { fontSize: 14, marginTop: 18 },
  secondaryButton: { alignItems: 'center', borderRadius: 14, borderWidth: 1, marginTop: 24, minHeight: 50, justifyContent: 'center' },
  signOut: { alignItems: 'center', marginTop: 20, minHeight: 48, justifyContent: 'center' }
});
