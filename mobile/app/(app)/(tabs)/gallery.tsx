import { AppImage } from '@/src/components/AppImage';
import { ErrorState, EmptyState, LoadingView } from '@/src/components/StateViews';
import { Screen } from '@/src/components/Screen';
import { useGallery } from '@/src/features/gallery/hooks';
import { useAppTheme } from '@/src/theme';
import type { GalleryImage } from '@/src/types/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

const GAP = 10;

const GalleryCard = memo(function GalleryCard({ item, width }: { item: GalleryImage; width: number }) {
  return (
    <Pressable onPress={() => router.push({ pathname: '/image/[id]', params: { id: item.id } })} style={({ pressed }) => [{ marginBottom: GAP, opacity: pressed ? 0.84 : 1, width }] }>
      <AppImage image={item} style={{ aspectRatio: 1, borderRadius: 14, width }} />
    </Pressable>
  );
});

export default function GalleryScreen() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const gallery = useGallery();
  const images = useMemo(() => gallery.data?.pages.flatMap((page) => page.items) ?? [], [gallery.data]);
  const cellWidth = (width - 32 - GAP) / 2;

  if (gallery.isLoading && !gallery.data) return <Screen><LoadingView /></Screen>;
  if (gallery.isError && !gallery.data) return <Screen><ErrorState message={gallery.error.message} retry={() => void gallery.refetch()} /></Screen>;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={images}
        numColumns={2}
        columnWrapperStyle={images.length ? styles.row : undefined}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <GalleryCard item={item} width={cellWidth} />}
        refreshing={gallery.isRefetching && !gallery.isFetchingNextPage}
        onRefresh={() => void gallery.refetch()}
        onEndReached={() => {
          if (gallery.hasNextPage && !gallery.isFetchingNextPage) void gallery.fetchNextPage();
        }}
        onEndReachedThreshold={0.45}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: theme.text }]}>Memories</Text>
              <View style={[styles.dot, { backgroundColor: theme.accent }]} />
            </View>
            <Text style={[styles.subtitle, { color: theme.mutedText }]}>{gallery.isFetching ? 'Syncing your gallery…' : 'Your latest moments'}</Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>
        }
        ListEmptyComponent={<EmptyState title="Nothing here yet" detail="Photos sent to Telegram will appear in this gallery." />}
        ListFooterComponent={gallery.isFetchingNextPage ? <Ionicons color={theme.accent} name="ellipsis-horizontal" size={24} style={styles.loader} /> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 28 },
  row: { gap: GAP },
  header: { paddingBottom: 18, paddingTop: 16 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  title: { fontFamily: 'Georgia', fontSize: 46, letterSpacing: -1.4 },
  dot: { borderRadius: 99, height: 10, marginTop: 7, width: 10 },
  subtitle: { fontSize: 15, marginTop: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 18 },
  loader: { alignSelf: 'center', marginTop: 14 }
});
