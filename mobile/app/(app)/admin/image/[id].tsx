import { deleteImage, getAdminImage, updateImage } from '@/src/api/endpoints';
import { AppImage } from '@/src/components/AppImage';
import { ErrorState, LoadingView } from '@/src/components/StateViews';
import { Screen } from '@/src/components/Screen';
import { galleryKey } from '@/src/features/gallery/hooks';
import { useAuth } from '@/src/auth/auth-provider';
import { queryClient } from '@/src/api/query-client';
import { useAppTheme } from '@/src/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AdminImageScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const image = useQuery({ queryKey: ['admin-image', id], queryFn: () => getAdminImage(id).then((result) => result.item), enabled: Boolean(id) });
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<'published' | 'hidden'>('published');

  useEffect(() => {
    if (image.data) {
      setCaption(image.data.caption || '');
      setStatus(image.data.status === 'hidden' ? 'hidden' : 'published');
    }
  }, [image.data]);

  const refreshCaches = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin-images'] }),
    queryClient.invalidateQueries({ queryKey: ['admin-image', id] }),
    queryClient.invalidateQueries({ queryKey: galleryKey }),
    queryClient.invalidateQueries({ queryKey: ['gallery-image', id] })
  ]);

  const save = useMutation({ mutationFn: () => updateImage(id, { caption, status }), onSuccess: refreshCaches });
  const remove = useMutation({ mutationFn: () => deleteImage(id), onSuccess: async () => { await refreshCaches(); router.back(); } });

  if (image.isLoading) return <Screen><LoadingView /></Screen>;
  if (image.isError || !image.data) return <Screen><ErrorState message={image.error?.message || 'Image not found'} retry={() => void image.refetch()} /></Screen>;

  const confirmDelete = () => Alert.alert('Delete photo?', 'It will be hidden from all gallery views and queued for storage cleanup.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => void remove.mutateAsync() }
  ]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppImage image={image.data} style={styles.image} />
        <Text style={[styles.label, { color: theme.mutedText }]}>Caption</Text>
        <TextInput multiline maxLength={1000} value={caption} onChangeText={setCaption} placeholder="Describe this moment" placeholderTextColor={theme.faintText} style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]} />
        <Text style={[styles.label, { color: theme.mutedText }]}>Visibility</Text>
        <View style={[styles.segmented, { borderColor: theme.border }]}>
          {(['published', 'hidden'] as const).map((option) => <Pressable key={option} onPress={() => setStatus(option)} style={[styles.segment, status === option && { backgroundColor: theme.elevated }]}><Text style={{ color: status === option ? theme.accent : theme.mutedText, fontWeight: '800', textTransform: 'capitalize' }}>{option}</Text></Pressable>)}
        </View>
        {save.error ? <Text style={{ color: theme.danger }}>{save.error.message}</Text> : null}
        <Pressable onPress={() => void save.mutateAsync()} disabled={save.isPending} style={[styles.save, { backgroundColor: theme.accent, opacity: save.isPending ? 0.7 : 1 }]}>{save.isPending ? <ActivityIndicator color={theme.background} /> : <Text style={{ color: theme.background, fontSize: 16, fontWeight: '800' }}>Save changes</Text>}</Pressable>
        {profile?.role === 'admin' ? <Pressable onPress={confirmDelete} disabled={remove.isPending} style={styles.delete}><Text style={{ color: theme.danger, fontSize: 16, fontWeight: '800' }}>{remove.isPending ? 'Deleting…' : 'Delete photo'}</Text></Pressable> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, padding: 16, paddingBottom: 38 },
  image: { aspectRatio: 1.26, borderRadius: 20, width: '100%' },
  label: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginTop: 12, textTransform: 'uppercase' },
  input: { borderRadius: 14, borderWidth: 1, fontSize: 16, minHeight: 100, padding: 14, textAlignVertical: 'top' },
  segmented: { borderRadius: 14, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  segment: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 49 },
  save: { alignItems: 'center', borderRadius: 14, justifyContent: 'center', marginTop: 16, minHeight: 53 },
  delete: { alignItems: 'center', marginTop: 16, minHeight: 46, justifyContent: 'center' }
});
