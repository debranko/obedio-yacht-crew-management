/**
 * Performance Utilities
 * Helpers for optimizing React component performance
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * Debounce function calls
 * Delays execution until after a specified time has passed since last call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Throttle function calls
 * Ensures function is called at most once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}

/**
 * Hook for debounced value
 * Returns a value that only updates after specified delay
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Hook for throttled value
 * Returns a value that updates at most once per specified time
 */
export function useThrottle<T>(value: T, limitMs: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastUpdate = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();

    if (now - lastUpdate.current >= limitMs) {
      setThrottledValue(value);
      lastUpdate.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastUpdate.current = Date.now();
      }, limitMs - (now - lastUpdate.current));

      return () => clearTimeout(timer);
    }
  }, [value, limitMs]);

  return throttledValue;
}

/**
 * Hook for debounced callback
 * Returns a memoized callback that only executes after specified delay
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delayMs);
    },
    [callback, delayMs]
  );
}

/**
 * Hook for throttled callback
 * Returns a memoized callback that executes at most once per specified time
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  const inThrottle = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limitMs);
      }
    },
    [callback, limitMs]
  );
}

/**
 * Hook to track component render count (development only)
 */
export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`[${componentName}] Render count:`, renderCount.current);
  }

  return renderCount.current;
}

/**
 * Hook to measure component render performance
 */
export function useRenderPerformance(componentName: string): void {
  const startTime = useRef<number>(0);

  if (process.env.NODE_ENV === 'development') {
    startTime.current = performance.now();

    useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime.current;

      if (renderTime > 16) {
        // More than one frame (60fps)
        console.warn(
          `[${componentName}] Slow render: ${renderTime.toFixed(2)}ms`
        );
      }
    });
  }
}

/**
 * Hook for lazy initialization
 * Only runs expensive function once
 */
export function useLazyInit<T>(initializer: () => T): T {
  const initialized = useRef(false);
  const value = useRef<T>();

  if (!initialized.current) {
    value.current = initializer();
    initialized.current = true;
  }

  return value.current as T;
}

/**
 * Hook for window size with throttling
 * Prevents excessive re-renders on window resize
 */
export function useWindowSize(throttleMs: number = 200) {
  const [size, setSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = throttle(() => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, throttleMs);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [throttleMs]);

  return size;
}

/**
 * Hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIntersecting] = React.useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Memoize expensive calculations
 * Only recalculates when dependencies change
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Check if component is mounted
 * Prevents state updates on unmounted components
 */
export function useIsMounted(): () => boolean {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}

/**
 * Batch state updates to reduce re-renders
 */
export function useBatchedState<T>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = React.useState<T>(initialState);

  const batchUpdate = useCallback((updates: Partial<T>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  return [state, batchUpdate];
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();

  /**
   * Start performance measurement
   */
  static start(label: string): void {
    if (process.env.NODE_ENV === 'development') {
      this.marks.set(label, performance.now());
    }
  }

  /**
   * End performance measurement and log result
   */
  static end(label: string): void {
    if (process.env.NODE_ENV === 'development') {
      const startTime = this.marks.get(label);
      if (startTime) {
        const duration = performance.now() - startTime;
        console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
        this.marks.delete(label);
      }
    }
  }

  /**
   * Measure function execution time
   */
  static measure<T>(label: string, fn: () => T): T {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }

  /**
   * Measure async function execution time
   */
  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}

// Fix React import
import React from 'react';
