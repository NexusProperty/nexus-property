import type { ComponentType } from 'react';
import { DefaultLoadingFallback, ErrorBoundary } from '../lib/loading/loading-components';
import { lazyLoad, lazyLoadComponents } from '../lib/loading/lazy-load-utils';

// Re-export components and functions
export { 
  DefaultLoadingFallback, 
  ErrorBoundary,
  lazyLoad, 
  lazyLoadComponents 
};

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