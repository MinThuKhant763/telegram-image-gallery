import type { GalleryImage } from '@/src/types/api';
import { Image } from 'expo-image';
import { StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

type Props = { image: Pick<GalleryImage, 'imageUrl' | 'blurhash'>; style?: StyleProp<ImageStyle> };

export function AppImage({ image, style }: Props) {
  return (
    <Image
      source={{ uri: image.imageUrl }}
      placeholder={image.blurhash ? { blurhash: image.blurhash } : undefined}
      cachePolicy="memory-disk"
      contentFit="cover"
      transition={150}
      style={[styles.image, style]}
    />
  );
}

const styles = StyleSheet.create({ image: { backgroundColor: '#252525' } });
