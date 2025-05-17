import React, { lazy, Suspense, ComponentType } from 'react';
import { DefaultLoadingFallback, ErrorBoundary } from './loading-components';

/**
 * Creates a lazily loaded component with customizable loading fallback
 * 
 * @param importFn - Function that imports the component
 * @param fallback - Optional fallback component to show while loading
 * @param errorComponent - Optional component to show on error
 * @param options - Additional options (chunks, preload, etc.)
 * @returns Lazy loaded component
 */
export function lazyLoad<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <DefaultLoadingFallback />,
  errorComponent?: React.ComponentType<{ error: Error }>,
  options?: {
    preload?: boolean;
    chunkName?: string;
    timeout?: number;
  }
): React.ComponentType<React.ComponentProps<T>> {
  // Preload the component if option is set
  if (options?.preload) {
    void importFn();
  }

  const LazyComponent = lazy(importFn);

  // Create a wrapper component that includes Suspense and error handling
  const WrappedComponent = (props: React.ComponentProps<T>) => {
    return (
      <Suspense fallback={fallback}>
        <ErrorBoundary errorComponent={errorComponent}>
          <LazyComponent {...props} />
        </ErrorBoundary>
      </Suspense>
    );
  };

  // For better debugging in React DevTools
  WrappedComponent.displayName = `Lazy(${options?.chunkName || 'Component'})`;

  return WrappedComponent;
}

/**
 * Load several components in parallel (useful for route-based code splitting)
 * 
 * @param components - Object with component import functions
 * @returns Object with lazy-loaded components
 */
export function lazyLoadComponents<T extends Record<string, () => Promise<{ default: ComponentType<unknown> }>>>(
  components: T
): { [K in keyof T]: React.ComponentType<unknown> } {
  return Object.entries(components).reduce(
    (acc, [key, importFn]) => {
      acc[key as keyof T] = lazyLoad(importFn);
      return acc;
    },
    {} as { [K in keyof T]: React.ComponentType<unknown> }
  );
} 
