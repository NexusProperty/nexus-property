/**
 * Circuit Breaker implementation for CoreLogic API Integration
 * 
 * Provides resilience against API failures by automatically transitioning 
 * between closed, open, and half-open states based on failure thresholds.
 */

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Number of failures required to trip the circuit breaker */
  failureThreshold: number;
  /** Time in milliseconds to wait before transitioning from OPEN to HALF_OPEN */
  resetTimeoutMs: number;
  /** Maximum number of requests allowed in HALF_OPEN state */
  halfOpenMaxRequests: number;
  /** Optional name for the circuit breaker (useful for logging) */
  name?: string;
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastStateChangeTime: number;
  consecutiveSuccessCount: number;
  halfOpenRequestCount: number;
}

export class CircuitBreaker {
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number | null = null;
  private state: CircuitBreakerState = 'CLOSED';
  private lastStateChangeTime: number = Date.now();
  private consecutiveSuccessCount: number = 0;
  private halfOpenRequestCount: number = 0;
  
  constructor(
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeoutMs: 30000, // 30 seconds
      halfOpenMaxRequests: 3,
      name: 'default'
    }
  ) {}
  
  /**
   * Determines if a request should be allowed based on the current circuit state
   */
  public allowRequest(): boolean {
    this.updateState();
    
    // Log state for monitoring
    console.log(JSON.stringify({
      level: 'debug',
      service: 'circuit-breaker',
      event: 'check_allow_request',
      circuitName: this.options.name,
      state: this.state,
      failureCount: this.failureCount
    }));
    
    switch (this.state) {
      case 'CLOSED':
        // In closed state, all requests are allowed
        return true;
      
      case 'HALF_OPEN':
        // In half-open state, only allow a limited number of requests
        if (this.halfOpenRequestCount < this.options.halfOpenMaxRequests) {
          this.halfOpenRequestCount++;
          return true;
        }
        return false;
      
      case 'OPEN':
        // In open state, no requests are allowed
        return false;
    }
  }
  
  /**
   * Records a successful API call
   */
  public recordSuccess(): void {
    this.successCount++;
    
    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccessCount++;
      
      // If we've had enough consecutive successes in half-open state, close the circuit
      if (this.consecutiveSuccessCount >= this.options.halfOpenMaxRequests) {
        this.transitionTo('CLOSED');
      }
    }
    
    // Log success for monitoring
    console.log(JSON.stringify({
      level: 'info',
      service: 'circuit-breaker',
      event: 'record_success',
      circuitName: this.options.name,
      state: this.state,
      successCount: this.successCount,
      consecutiveSuccessCount: this.consecutiveSuccessCount
    }));
  }
  
  /**
   * Records a failed API call
   */
  public recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.consecutiveSuccessCount = 0;
    
    // Log failure for monitoring
    console.log(JSON.stringify({
      level: 'warn',
      service: 'circuit-breaker',
      event: 'record_failure',
      circuitName: this.options.name,
      state: this.state,
      failureCount: this.failureCount
    }));
    
    // In closed state, if we've reached the failure threshold, open the circuit
    if (this.state === 'CLOSED' && this.failureCount >= this.options.failureThreshold) {
      this.transitionTo('OPEN');
    }
    
    // In half-open state, any failure sends us back to open
    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    }
  }
  
  /**
   * Gets the current state of the circuit breaker
   */
  public getState(): CircuitBreakerState {
    this.updateState();
    return this.state;
  }
  
  /**
   * Gets detailed statistics about the circuit breaker
   */
  public getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChangeTime: this.lastStateChangeTime,
      consecutiveSuccessCount: this.consecutiveSuccessCount,
      halfOpenRequestCount: this.halfOpenRequestCount
    };
  }
  
  /**
   * Resets the circuit breaker to its initial state
   */
  public reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.transitionTo('CLOSED');
    this.consecutiveSuccessCount = 0;
    this.halfOpenRequestCount = 0;
    
    console.log(JSON.stringify({
      level: 'info',
      service: 'circuit-breaker',
      event: 'reset',
      circuitName: this.options.name,
      state: this.state
    }));
  }
  
  /**
   * Updates the circuit state based on time-based rules
   */
  private updateState(): void {
    // If we're in open state and enough time has passed, transition to half-open
    if (
      this.state === 'OPEN' && 
      this.lastFailureTime !== null && 
      Date.now() - this.lastFailureTime > this.options.resetTimeoutMs
    ) {
      this.transitionTo('HALF_OPEN');
    }
  }
  
  /**
   * Transitions the circuit to a new state
   */
  private transitionTo(newState: CircuitBreakerState): void {
    if (this.state === newState) return;
    
    // Log state transition for monitoring
    console.log(JSON.stringify({
      level: 'info',
      service: 'circuit-breaker',
      event: 'state_transition',
      circuitName: this.options.name,
      prevState: this.state,
      newState: newState,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    }));
    
    this.state = newState;
    this.lastStateChangeTime = Date.now();
    
    // Reset counters when transitioning states
    if (newState === 'HALF_OPEN') {
      this.halfOpenRequestCount = 0;
      this.consecutiveSuccessCount = 0;
    } else if (newState === 'CLOSED') {
      this.failureCount = 0;
    }
  }
}

/**
 * Creates a wrapper function that applies circuit breaker pattern to an async function
 * 
 * @param fn The async function to wrap with circuit breaker logic
 * @param circuitBreaker The circuit breaker instance to use
 * @param fallbackFn Optional fallback function to call when circuit is open
 * @returns A wrapped function with circuit breaker protection
 */
export function withCircuitBreaker<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  circuitBreaker: CircuitBreaker,
  fallbackFn?: (...args: Args) => Promise<T> | T
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    if (!circuitBreaker.allowRequest()) {
      if (fallbackFn) {
        return await fallbackFn(...args);
      }
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await fn(...args);
      circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      circuitBreaker.recordFailure();
      throw error;
    }
  };
} 