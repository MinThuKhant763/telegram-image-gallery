import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 7 * 24 * 60 * 60_000,
      retry: (failureCount, error: unknown) => {
        const status = error instanceof Error && 'status' in error ? Number(error.status) : 0;
        return status !== 401 && status !== 403 && failureCount < 2;
      }
    },
    mutations: { retry: false }
  }
});
