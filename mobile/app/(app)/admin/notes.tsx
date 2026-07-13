import { deleteNote } from '@/src/api/endpoints';
import { queryClient } from '@/src/api/query-client';
import { Screen } from '@/src/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/src/components/StateViews';
import { notesKey, useNotes } from '@/src/features/notes/hooks';
import { useAuth } from '@/src/auth/auth-provider';
import { useAppTheme } from '@/src/theme';
import type { GalleryNote } from '@/src/types/api';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

function AdminNoteRow({ item }: { item: GalleryNote }) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const remove = useMutation({ mutationFn: () => deleteNote(item.id), onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey }) });
  const confirmDelete = () => Alert.alert('Delete note?', 'This note will no longer be shown in the gallery.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => void remove.mutateAsync() }]);

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Text style={[styles.content, { color: theme.text }]}>{item.content}</Text>
      <View style={styles.metaRow}>
        <Text style={{ color: theme.mutedText, fontSize: 13 }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        {profile?.role === 'admin' ? <Pressable onPress={confirmDelete} hitSlop={10}><Text style={{ color: theme.danger, fontWeight: '700' }}>{remove.isPending ? 'Deleting…' : 'Delete'}</Text></Pressable> : null}
      </View>
    </View>
  );
}

export default function AdminNotesScreen() {
  const theme = useAppTheme();
  const notes = useNotes();
  const items = notes.data?.pages.flatMap((page) => page.items) ?? [];

  if (notes.isLoading && !notes.data) return <Screen><LoadingView /></Screen>;
  if (notes.isError && !notes.data) return <Screen><ErrorState message={notes.error.message} retry={() => void notes.refetch()} /></Screen>;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AdminNoteRow item={item} />}
        refreshing={notes.isRefetching && !notes.isFetchingNextPage}
        onRefresh={() => void notes.refetch()}
        onEndReached={() => notes.hasNextPage && !notes.isFetchingNextPage && void notes.fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={<EmptyState title="No notes" detail="Create the first note for your gallery." />}
      />
      <Pressable onPress={() => router.push('/admin/create-note')} style={[styles.fab, { backgroundColor: theme.accent }]}><Text style={{ color: theme.background, fontSize: 24, lineHeight: 24 }}>+</Text><Text style={{ color: theme.background, fontWeight: '800' }}> New note</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 },
  row: { borderBottomWidth: StyleSheet.hairlineWidth, gap: 11, paddingVertical: 18 },
  content: { fontSize: 17, lineHeight: 25 },
  metaRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  fab: { alignItems: 'center', borderRadius: 999, bottom: 24, flexDirection: 'row', gap: 7, paddingHorizontal: 18, paddingVertical: 14, position: 'absolute', right: 20 }
});
