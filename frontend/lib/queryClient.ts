import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { ApiError } from "./api";

const handleAuthError = (error: unknown) => {
  if (error instanceof ApiError && error.status === 401) {
    if (typeof window !== "undefined") {
      // Clean redirect to login page when unauthorized
      window.location.href = "/login";
    }
  }
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => handleAuthError(error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => handleAuthError(error),
  }),
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 60 seconds default stale time
      gcTime: 300000, // 5 minutes garbage collection time
    },
  },
});
