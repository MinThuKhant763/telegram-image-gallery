import { getGallery, getGalleryImage } from '@/src/api/endpoints';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

export const galleryKey = ['gallery'] as const;

export function useGallery() {
  return useInfiniteQuery({
    queryKey: galleryKey,
    queryFn: ({ pageParam }) => getGallery(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });
}

export function useGalleryImage(id: string) {
  return useQuery({
    queryKey: ['gallery-image', id],
    queryFn: () => getGalleryImage(id).then((result) => result.item),
    enabled: Boolean(id)
  });
}
