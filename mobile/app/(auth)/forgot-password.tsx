import { Screen } from '@/src/components/Screen';
import { supabase } from '@/src/auth/supabase';
import { useAppTheme } from '@/src/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setMessage(error ? error.message : 'If that email has an account, reset instructions are on the way.');
    setSubmitting(false);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Text style={[styles.back, { color: theme.accent }]}>‹</Text></Pressable>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Reset password</Text>
          <Text style={[styles.description, { color: theme.mutedText }]}>Enter the email address linked to your Memories account.</Text>
        </View>
        <View style={styles.form}>
          <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="Email address" placeholderTextColor={theme.faintText} value={email} onChangeText={setEmail} style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]} />
          {message ? <Text style={{ color: theme.mutedText, lineHeight: 21 }}>{message}</Text> : null}
          <Pressable disabled={!email || submitting} onPress={submit} style={[styles.button, { backgroundColor: theme.accent, opacity: !email || submitting ? 0.7 : 1 }]}>
            {submitting ? <ActivityIndicator color={theme.background} /> : <Text style={[styles.buttonText, { color: theme.background }]}>Send instructions</Text>}
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 28, padding: 28, paddingTop: 24 },
  back: { fontSize: 42, fontWeight: '300', lineHeight: 42 },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -0.8 },
  description: { fontSize: 16, lineHeight: 23, marginTop: 10 },
  form: { gap: 14, marginTop: 12 },
  input: { borderRadius: 14, borderWidth: 1, fontSize: 16, minHeight: 54, paddingHorizontal: 16 },
  button: { alignItems: 'center', borderRadius: 14, justifyContent: 'center', minHeight: 54 },
  buttonText: { fontSize: 16, fontWeight: '800' }
});
