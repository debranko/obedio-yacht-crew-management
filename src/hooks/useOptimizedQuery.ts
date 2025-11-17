/**
 * Optimized Query Hook
 * Adds performance optimizations to React Query
 */

import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';

interface OptimizedQueryOptions<TData, TError = unknown> extends UseQueryOptions<TData, TError> {
  /**
   * Enable aggressive caching (longer stale time)
   * Good for data that doesn't change often
   */
  aggressiveCache?: boolean;

  /**
   * Enable background refetch on window focus
   * Disabled by default for performance
   */
  refetchOnFocus?: boolean;

  /**
   * Enable automatic retry on error
   * Disabled by default to avoid unnecessary requests
   */
  enableRetry?: boolean;

  /**
   * Cache time in milliseconds
   * How long to keep data in cache after query becomes inactive
   */
  cacheTime?: number;
}

/**
 * Optimized useQuery with performance best practices
 * - Longer stale time by default
 * - Disabled window focus refetch
 * - Disabled automatic retry
 * - Optimized cache time
 */
export function useOptimizedQuery<TData = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: OptimizedQueryOptions<TData, TError>
) {
  const {
    aggressiveCache = false,
    refetchOnFocus = false,
    enableRetry = false,
    cacheTime = 1000 * 60 * 5, // 5 minutes default
    ...restOptions
  } = options || {};

  // Calculate optimal stale time based on aggressive cache setting
  const staleTime = useMemo(() => {
    if (aggressiveCache) {
      return 1000 * 60 * 10; // 10 minutes for aggressive caching
    }
    return restOptions.staleTime ?? 1000 * 60; // 1 minute default
  }, [aggressiveCache, restOptions.staleTime]);

  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    staleTime,
    cacheTime,
    refetchOnWindowFocus: refetchOnFocus,
    retry: enableRetry ? 1 : false,
    ...restOptions,
  });
}

/**
 * Optimized query for static/rarely changing data
 * - Very long stale time (1 hour)
 * - Very long cache time (1 hour)
 * - No refetch on window focus
 * - No retry on error
 */
export function useStaticQuery<TData = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData, TError>
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
}

/**
 * Optimized query for frequently changing data
 * - Short stale time (10 seconds)
 * - Refetch on window focus enabled
 * - Retry enabled
 */
export function useRealtimeQuery<TData = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData, TError>
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    staleTime: 1000 * 10, // 10 seconds
    cacheTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
    retry: 1,
    refetchInterval: 1000 * 30, // Auto-refetch every 30 seconds
    ...options,
  });
}

/**
 * Debounced query function
 * Prevents excessive API calls when query params change rapidly
 */
export function useDebouncedQuery<TData = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  debounceMs: number = 300,
  options?: UseQueryOptions<TData, TError>
) {
  const debouncedQueryFn = useCallback(() => {
    return new Promise<TData>((resolve, reject) => {
      const timeout = setTimeout(() => {
        queryFn().then(resolve).catch(reject);
      }, debounceMs);

      // Cleanup function
      return () => clearTimeout(timeout);
    });
  }, [queryFn, debounceMs]);

  return useQuery<TData, TError>({
    queryKey,
    queryFn: debouncedQueryFn,
    ...options,
  });
}

/**
 * Paginated query with optimized cache
 * Keeps previous data while loading next page
 */
export function usePaginatedQuery<TData = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData, TError>
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    staleTime: 1000 * 60, // 1 minute
    cacheTime: 1000 * 60 * 5, // 5 minutes
    keepPreviousData: true, // Prevent loading state on page change
    ...options,
  });
}

/**
 * Prefetch data in background
 * Good for anticipating user navigation
 */
export function usePrefetch<TData = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
  }
) {
  const { staleTime = 1000 * 60, cacheTime = 1000 * 60 * 5 } = options || {};

  return useCallback(() => {
    return queryFn();
  }, [queryFn]);
}
