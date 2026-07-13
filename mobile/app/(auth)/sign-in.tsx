import { Screen } from '@/src/components/Screen';
import { supabase } from '@/src/auth/supabase';
import { useAppTheme } from '@/src/theme';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SignInScreen() {
  const theme = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const signIn = async () => {
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) setError(signInError.message);
    setSubmitting(false);
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })} style={styles.container}>
        <View>
          <Text style={[styles.brand, { color: theme.text }]}>Memories</Text>
          <Text style={[styles.description, { color: theme.mutedText }]}>Sign in to your private gallery.</Text>
        </View>
        <View style={styles.form}>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="Email address"
            placeholderTextColor={theme.faintText}
            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            autoComplete="current-password"
            placeholder="Password"
            placeholderTextColor={theme.faintText}
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
          <Pressable disabled={submitting || !email || !password} onPress={signIn} style={({ pressed }) => [styles.button, { backgroundColor: theme.accent, opacity: pressed || submitting ? 0.75 : 1 }]}>
            {submitting ? <ActivityIndicator color={theme.background} /> : <Text style={[styles.buttonText, { color: theme.background }]}>Sign in</Text>}
          </Pressable>
          <Link href="/forgot-password" style={[styles.link, { color: theme.mutedText }]}>Forgot password?</Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', padding: 28, paddingBottom: 56, paddingTop: 64 },
  brand: { fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), fontSize: 54, letterSpacing: -1.5 },
  description: { fontSize: 17, lineHeight: 24, marginTop: 10 },
  form: { gap: 12 },
  input: { borderRadius: 14, borderWidth: 1, fontSize: 16, minHeight: 54, paddingHorizontal: 16 },
  error: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  button: { alignItems: 'center', borderRadius: 14, justifyContent: 'center', marginTop: 8, minHeight: 54 },
  buttonText: { fontSize: 16, fontWeight: '800' },
  link: { alignSelf: 'center', fontSize: 15, marginTop: 12, padding: 8 }
});
