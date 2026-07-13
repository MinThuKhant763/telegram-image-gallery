import { createNote } from '@/src/api/endpoints';
import { queryClient } from '@/src/api/query-client';
import { Screen } from '@/src/components/Screen';
import { notesKey } from '@/src/features/notes/hooks';
import { useAppTheme } from '@/src/theme';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

export default function CreateNoteScreen() {
  const theme = useAppTheme();
  const [content, setContent] = useState('');
  const create = useMutation({
    mutationFn: () => createNote(content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notesKey });
      router.back();
    }
  });

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={[styles.help, { color: theme.mutedText }]}>Keep it short, specific, and worth returning to.</Text>
        <TextInput autoFocus multiline maxLength={1000} value={content} onChangeText={setContent} placeholder="Write a note…" placeholderTextColor={theme.faintText} style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]} />
        <Text style={[styles.count, { color: theme.faintText }]}>{content.length}/1000</Text>
        {create.error ? <Text style={{ color: theme.danger }}>{create.error.message}</Text> : null}
        <Pressable disabled={!content.trim() || create.isPending} onPress={() => void create.mutateAsync()} style={[styles.button, { backgroundColor: theme.accent, opacity: !content.trim() || create.isPending ? 0.7 : 1 }]}>{create.isPending ? <ActivityIndicator color={theme.background} /> : <Text style={{ color: theme.background, fontSize: 16, fontWeight: '800' }}>Save note</Text>}</Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 18 },
  help: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  input: { borderRadius: 16, borderWidth: 1, flex: 1, fontSize: 18, lineHeight: 27, minHeight: 200, padding: 16, textAlignVertical: 'top' },
  count: { alignSelf: 'flex-end', fontSize: 12, marginTop: 8 },
  button: { alignItems: 'center', borderRadius: 14, justifyContent: 'center', marginTop: 20, minHeight: 53 }
});
