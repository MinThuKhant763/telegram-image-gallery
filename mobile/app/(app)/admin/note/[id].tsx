import { updateNote } from '@/src/api/endpoints';
import { queryClient } from '@/src/api/query-client';
import { Screen } from '@/src/components/Screen';
import { ErrorState } from '@/src/components/StateViews';
import { notesKey } from '@/src/features/notes/hooks';
import { useAppTheme } from '@/src/theme';
import type { GalleryNote, Page } from '@/src/types/api';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type NotesCache = { pages: Page<GalleryNote>[] };

const findCachedNote = (id: string | undefined) => {
  if (!id) return undefined;

  const cached = queryClient.getQueryData<NotesCache>(notesKey);
  return cached?.pages.flatMap((page) => page.items).find((note) => note.id === id);
};

export default function EditNoteScreen() {
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const note = useMemo(() => findCachedNote(id), [id]);
  const [content, setContent] = useState(note?.content ?? '');
  const trimmedContent = content.trim();
  const isInvalid = !trimmedContent || content.length > 1000;

  const update = useMutation({
    mutationFn: () => updateNote(id, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notesKey });
      router.back();
    }
  });

  if (!id || !note) {
    return (
      <Screen>
        <ErrorState message="Note not found. Return to the notes list and try again." retry={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={[styles.help, { color: theme.mutedText }]}>Update the note text shown in your gallery.</Text>
        <TextInput autoFocus multiline maxLength={1000} value={content} onChangeText={setContent} placeholder="Write a note…" placeholderTextColor={theme.faintText} style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]} />
        <Text style={[styles.count, { color: theme.faintText }]}>{content.length}/1000</Text>
        {update.error ? <Text style={{ color: theme.danger }}>{update.error.message}</Text> : null}
        <Pressable disabled={isInvalid || update.isPending} onPress={() => void update.mutateAsync()} style={[styles.button, { backgroundColor: theme.accent, opacity: isInvalid || update.isPending ? 0.7 : 1 }]}>{update.isPending ? <ActivityIndicator color={theme.background} /> : <Text style={{ color: theme.background, fontSize: 16, fontWeight: '800' }}>Save changes</Text>}</Pressable>
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
