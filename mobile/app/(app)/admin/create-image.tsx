import { createImage } from '@/src/api/endpoints';
import { queryClient } from '@/src/api/query-client';
import { Screen } from '@/src/components/Screen';
import { galleryKey } from '@/src/features/gallery/hooks';
import { useAppTheme } from '@/src/theme';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Visibility = 'published' | 'hidden';

export default function CreateImageScreen() {
  const theme = useAppTheme();
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<Visibility>('published');
  const [pickerError, setPickerError] = useState<string | null>(null);

  const pickImage = async () => {
    setPickerError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPickerError('Photo library access is required to choose an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.92,
      allowsEditing: false
    });

    if (!result.canceled) {
      setAsset(result.assets[0]);
    }
  };

  const create = useMutation({
    mutationFn: () => {
      if (!asset) throw new Error('Choose an image first');
      return createImage({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
        caption,
        status
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-images'] }),
        queryClient.invalidateQueries({ queryKey: galleryKey })
      ]);
      router.back();
    }
  });

  const errorMessage = pickerError || create.error?.message;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.help, { color: theme.mutedText }]}>Choose a photo, add an optional caption, and decide whether it should be visible immediately.</Text>
        <Pressable onPress={pickImage} disabled={create.isPending} style={[styles.picker, { backgroundColor: theme.input, borderColor: theme.border }]}>
          {asset ? <Image source={{ uri: asset.uri }} style={styles.preview} contentFit="cover" /> : <Text style={[styles.pickText, { color: theme.accent }]}>Choose image</Text>}
        </Pressable>
        {asset ? <Text style={[styles.metadata, { color: theme.faintText }]}>{asset.width}×{asset.height}{asset.mimeType ? ` · ${asset.mimeType}` : ''}</Text> : null}

        <Text style={[styles.label, { color: theme.mutedText }]}>Caption</Text>
        <TextInput multiline maxLength={1000} value={caption} onChangeText={setCaption} placeholder="Describe this moment" placeholderTextColor={theme.faintText} style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]} />
        <Text style={[styles.count, { color: theme.faintText }]}>{caption.length}/1000</Text>

        <Text style={[styles.label, { color: theme.mutedText }]}>Visibility</Text>
        <View style={[styles.segmented, { borderColor: theme.border }]}> 
          {(['published', 'hidden'] as const).map((option) => <Pressable key={option} onPress={() => setStatus(option)} disabled={create.isPending} style={[styles.segment, status === option && { backgroundColor: theme.elevated }]}><Text style={{ color: status === option ? theme.accent : theme.mutedText, fontWeight: '800', textTransform: 'capitalize' }}>{option}</Text></Pressable>)}
        </View>

        {errorMessage ? <Text style={{ color: theme.danger }}>{errorMessage}</Text> : null}
        <Pressable disabled={!asset || create.isPending} onPress={() => void create.mutateAsync()} style={[styles.submit, { backgroundColor: theme.accent, opacity: !asset || create.isPending ? 0.7 : 1 }]}>{create.isPending ? <ActivityIndicator color={theme.background} /> : <Text style={{ color: theme.background, fontSize: 16, fontWeight: '800' }}>Add image</Text>}</Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, padding: 16, paddingBottom: 38 },
  help: { fontSize: 15, lineHeight: 22, marginBottom: 4 },
  picker: { alignItems: 'center', aspectRatio: 1.2, borderRadius: 20, borderWidth: 1, justifyContent: 'center', overflow: 'hidden', width: '100%' },
  preview: { height: '100%', width: '100%' },
  pickText: { fontSize: 17, fontWeight: '800' },
  metadata: { fontSize: 12, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginTop: 12, textTransform: 'uppercase' },
  input: { borderRadius: 14, borderWidth: 1, fontSize: 16, minHeight: 100, padding: 14, textAlignVertical: 'top' },
  count: { alignSelf: 'flex-end', fontSize: 12 },
  segmented: { borderRadius: 14, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  segment: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 49 },
  submit: { alignItems: 'center', borderRadius: 14, justifyContent: 'center', marginTop: 16, minHeight: 53 }
});
