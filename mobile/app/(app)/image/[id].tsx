import { AppImage } from '@/src/components/AppImage';
import { ErrorState, LoadingView } from '@/src/components/StateViews';
import { Screen } from '@/src/components/Screen';
import { useGalleryImage } from '@/src/features/gallery/hooks';
import { useAppTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Share, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ImageDetailScreen() {
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const image = useGalleryImage(id);

  if (image.isLoading) return <Screen><LoadingView /></Screen>;
  if (image.isError || !image.data) return <Screen><ErrorState message={image.error?.message || 'Image not found'} retry={() => void image.refetch()} /></Screen>;

  const item = image.data;
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.nav}>
          <Pressable hitSlop={12} onPress={() => router.back()}><Ionicons color={theme.accent} name="chevron-back" size={30} /></Pressable>
          <Pressable hitSlop={12} onPress={() => void Share.share({ message: item.imageUrl, url: item.imageUrl })}><Ionicons color={theme.accent} name="share-outline" size={24} /></Pressable>
        </View>
        <AppImage image={item} style={styles.image} />
        <Text style={[styles.caption, { color: theme.text }]}>{item.caption || 'A moment from the gallery'}</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>{[item.senderName, new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })].filter(Boolean).join(' · ')}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 36 },
  nav: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, minHeight: 38 },
  image: { aspectRatio: 1, borderRadius: 20, width: '100%' },
  caption: { fontSize: 22, fontWeight: '700', lineHeight: 30, marginTop: 22 },
  meta: { fontSize: 14, lineHeight: 20, marginTop: 8 }
});
