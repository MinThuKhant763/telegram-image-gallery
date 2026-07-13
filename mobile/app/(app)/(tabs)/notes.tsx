import { EmptyState, ErrorState, LoadingView } from '@/src/components/StateViews';
import { Screen } from '@/src/components/Screen';
import { useNotes } from '@/src/features/notes/hooks';
import { useAppTheme } from '@/src/theme';
import type { GalleryNote } from '@/src/types/api';
import { FlatList, StyleSheet, Text, View } from 'react-native';

function NoteRow({ item }: { item: GalleryNote }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.note, { borderBottomColor: theme.border }]}>
      <Text style={[styles.content, { color: theme.text }]}>{item.content}</Text>
      <Text style={[styles.date, { color: theme.mutedText }]}>{new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
    </View>
  );
}

export default function NotesScreen() {
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
        renderItem={({ item }) => <NoteRow item={item} />}
        refreshing={notes.isRefetching && !notes.isFetchingNextPage}
        onRefresh={() => void notes.refetch()}
        onEndReached={() => notes.hasNextPage && !notes.isFetchingNextPage && void notes.fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={<View style={styles.header}><Text style={[styles.title, { color: theme.text }]}>Notes</Text><Text style={[styles.subtitle, { color: theme.mutedText }]}>Small things worth keeping.</Text></View>}
        ListEmptyComponent={<EmptyState title="No notes yet" detail="Notes from your gallery will appear here." />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 32 },
  header: { paddingBottom: 22, paddingTop: 12 },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -0.8 },
  subtitle: { fontSize: 15, marginTop: 5 },
  note: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 20, paddingTop: 18 },
  content: { fontSize: 18, lineHeight: 27 },
  date: { fontSize: 13, marginTop: 9 }
});
