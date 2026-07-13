import { getNotes } from '@/src/api/endpoints';
import { useInfiniteQuery } from '@tanstack/react-query';

export const notesKey = ['notes'] as const;

export function useNotes() {
  return useInfiniteQuery({
    queryKey: notesKey,
    queryFn: ({ pageParam }) => getNotes(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });
}
