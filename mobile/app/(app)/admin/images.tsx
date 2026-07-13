import { getAdminImages } from '@/src/api/endpoints';
import { AppImage } from '@/src/components/AppImage';
import { EmptyState, ErrorState, LoadingView } from '@/src/components/StateViews';
import { Screen } from '@/src/components/Screen';
import { useAppTheme } from '@/src/theme';
import type { GalleryImage } from '@/src/types/api';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

function AdminImageRow({ item }: { item: GalleryImage }) {
  const theme = useAppTheme();
  return (
    <Pressable onPress={() => router.push({ pathname: '/admin/image/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.row, { borderBottomColor: theme.border, opacity: pressed ? 0.75 : 1 }]}>
      <AppImage image={item} style={styles.thumbnail} />
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.caption, { color: theme.text }]}>{item.caption || 'Untitled photo'}</Text>
        <Text style={[styles.metadata, { color: theme.mutedText }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.status, { color: item.status === 'published' ? theme.accent : theme.mutedText }]}>{item.status}</Text>
    </Pressable>
  );
}

export default function AdminImagesScreen() {
  const theme = useAppTheme();
  const images = useInfiniteQuery({ queryKey: ['admin-images'], queryFn: ({ pageParam }) => getAdminImages(pageParam), initialPageParam: null as string | null, getNextPageParam: (last) => last.nextCursor });
  const items = images.data?.pages.flatMap((page) => page.items) ?? [];

  if (images.isLoading && !images.data) return <Screen><LoadingView /></Screen>;
  if (images.isError && !images.data) return <Screen><ErrorState message={images.error.message} retry={() => void images.refetch()} /></Screen>;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AdminImageRow item={item} />}
        refreshing={images.isRefetching && !images.isFetchingNextPage}
        onRefresh={() => void images.refetch()}
        onEndReached={() => images.hasNextPage && !images.isFetchingNextPage && void images.fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={<Text style={[styles.help, { color: theme.mutedText }]}>Edit captions, visibility, and photo lifecycle.</Text>}
        ListEmptyComponent={<EmptyState title="No images" detail="There are no images to manage." />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  help: { fontSize: 14, lineHeight: 20, paddingBottom: 9 },
  row: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, minHeight: 86, paddingVertical: 10 },
  thumbnail: { borderRadius: 10, height: 62, width: 62 },
  copy: { flex: 1, gap: 5 },
  caption: { fontSize: 16, fontWeight: '600' },
  metadata: { fontSize: 13 },
  status: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize' }
});
