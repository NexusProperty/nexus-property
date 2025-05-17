import React, { lazy, Suspense, ComponentType } from 'react';

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
 * Default loading fallback component
 */
export const DefaultLoadingFallback: React.FC = () => (
  <div className="flex justify-center items-center p-4 min-h-[100px]">
    <div className="animate-pulse flex space-x-4">
      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
      <div className="flex-1 space-y-2 py-1">
        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
        <div className="h-2 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

/**
 * Default error component
 */
const DefaultErrorComponent: React.FC<{ error: Error }> = ({ error }) => (
  <div className="rounded-md bg-red-50 p-4 border border-red-200">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Error loading component</h3>
        <div className="mt-2 text-sm text-red-700">
          {error.message || 'Something went wrong while loading this component.'}
        </div>
      </div>
    </div>
  </div>
);

/**
 * Error boundary to catch errors in lazy loaded components
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; errorComponent?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; errorComponent?: React.ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in lazy loaded component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const ErrorComp = this.props.errorComponent || DefaultErrorComponent;
      return <ErrorComp error={this.state.error} />;
    }

    return this.props.children;
  }
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

/**
 * Usage example:
 * 
 * // Single component lazy loading
 * const LazyDashboard = lazyLoad(() => import('./pages/Dashboard'));
 * 
 * // Multiple components lazy loading
 * const {
 *   Dashboard,
 *   UserProfile,
 *   Settings
 * } = lazyLoadComponents({
 *   Dashboard: () => import('./pages/Dashboard'),
 *   UserProfile: () => import('./pages/UserProfile'),
 *   Settings: () => import('./pages/Settings')
 * });
 */ 