/**
 * Circuit Breaker Implementation for CoreLogic API
 * 
 * This implements the circuit breaker pattern to prevent cascading failures
 * when the CoreLogic API experiences issues.
 */

/**
 * Circuit breaker states
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  failureThreshold: number;   // Number of failures before opening circuit
  resetTimeoutMs: number;     // Time to wait before attempting reset (half-open)
  halfOpenMaxRequests: number; // Max requests to allow in half-open state
  monitorIntervalMs?: number;  // Optional interval to check for reset
}

/**
 * Implementation of the circuit breaker pattern
 */
export class CircuitBreaker {
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private state: CircuitState = 'CLOSED';
  private halfOpenRequests: number = 0;
  private lastStateChange: number = Date.now();
  private stateChangeListeners: Array<(state: CircuitState, prevState: CircuitState) => void> = [];
  private monitorInterval: number | null = null;

  /**
   * Create a new circuit breaker
   */
  constructor(
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeoutMs: 30000,     // 30 seconds
      halfOpenMaxRequests: 3,
      monitorIntervalMs: 5000    // 5 seconds
    }
  ) {
    // Start monitoring for state changes if interval is provided
    if (options.monitorIntervalMs && options.monitorIntervalMs > 0) {
      this.startMonitoring();
    }

    // Log initialization
    console.log(JSON.stringify({
      level: 'info',
      service: 'circuit-breaker',
      event: 'initialized',
      message: 'Circuit breaker initialized',
      options: this.options
    }));
  }

  /**
   * Start monitoring for state changes
   */
  private startMonitoring(): void {
    if (this.monitorInterval !== null) return;
    
    const checkForStateChange = () => {
      // If in OPEN state, check if it's time to transition to HALF_OPEN
      if (this.state === 'OPEN') {
        const timeElapsed = Date.now() - this.lastFailureTime;
        if (timeElapsed >= this.options.resetTimeoutMs) {
          this.transitionToState('HALF_OPEN');
        }
      }
    };

    // Use setInterval in browser or Node.js
    if (typeof setInterval === 'function') {
      this.monitorInterval = setInterval(
        checkForStateChange, 
        this.options.monitorIntervalMs
      ) as unknown as number;
    }
  }

  /**
   * Stop monitoring for state changes
   */
  public stopMonitoring(): void {
    if (this.monitorInterval !== null && typeof clearInterval === 'function') {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * Check if a request is allowed to proceed
   */
  public allowRequest(): boolean {
    // CLOSED state: all requests are allowed
    if (this.state === 'CLOSED') {
      return true;
    }

    // OPEN state: no requests are allowed
    if (this.state === 'OPEN') {
      // Check if it's time to try half-open
      const timeElapsed = Date.now() - this.lastFailureTime;
      if (timeElapsed >= this.options.resetTimeoutMs) {
        this.transitionToState('HALF_OPEN');
        this.halfOpenRequests = 1;
        return true;
      }
      
      // Log blocked request
      console.log(JSON.stringify({
        level: 'info',
        service: 'circuit-breaker',
        event: 'request_blocked',
        message: 'Request blocked by circuit breaker',
        state: this.state,
        timeElapsed,
        resetTimeout: this.options.resetTimeoutMs
      }));
      
      return false;
    }

    // HALF_OPEN state: limited requests are allowed
    if (this.state === 'HALF_OPEN') {
      if (this.halfOpenRequests < this.options.halfOpenMaxRequests) {
        this.halfOpenRequests++;
        return true;
      }
      
      // Log blocked request in half-open state
      console.log(JSON.stringify({
        level: 'info',
        service: 'circuit-breaker',
        event: 'request_blocked',
        message: 'Request blocked by circuit breaker in half-open state',
        state: this.state,
        halfOpenRequests: this.halfOpenRequests,
        halfOpenMaxRequests: this.options.halfOpenMaxRequests
      }));
      
      return false;
    }

    return false;
  }

  /**
   * Record a successful request
   */
  public recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      
      // If we've had enough successes in half-open state, close the circuit
      if (this.successCount >= this.options.halfOpenMaxRequests) {
        this.transitionToState('CLOSED');
      }
    }
    
    // Reset failure count in CLOSED state to prevent threshold bugs
    if (this.state === 'CLOSED') {
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed request
   */
  public recordFailure(): void {
    this.lastFailureTime = Date.now();
    
    if (this.state === 'CLOSED') {
      this.failureCount++;
      
      // If we've reached the failure threshold, open the circuit
      if (this.failureCount >= this.options.failureThreshold) {
        this.transitionToState('OPEN');
      }
    } else if (this.state === 'HALF_OPEN') {
      // Any failure in half-open state immediately opens the circuit
      this.transitionToState('OPEN');
    }
  }

  /**
   * Get the current state of the circuit
   */
  public getState(): CircuitState {
    return this.state;
  }

  /**
   * Get metrics about the circuit breaker
   */
  public getMetrics(): Record<string, any> {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      halfOpenRequests: this.halfOpenRequests,
      lastStateChange: this.lastStateChange,
      timeInCurrentState: Date.now() - this.lastStateChange,
    };
  }

  /**
   * Reset the circuit breaker to its initial state
   */
  public reset(): void {
    const previousState = this.state;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenRequests = 0;
    this.lastStateChange = Date.now();
    
    // Notify listeners of state change
    this.notifyStateChangeListeners(previousState);
    
    console.log(JSON.stringify({
      level: 'info',
      service: 'circuit-breaker',
      event: 'reset',
      message: 'Circuit breaker has been reset',
      previousState,
      currentState: this.state
    }));
  }

  /**
   * Add a listener for state changes
   */
  public onStateChange(listener: (state: CircuitState, prevState: CircuitState) => void): void {
    this.stateChangeListeners.push(listener);
  }

  /**
   * Remove a state change listener
   */
  public removeStateChangeListener(listener: (state: CircuitState, prevState: CircuitState) => void): void {
    const index = this.stateChangeListeners.indexOf(listener);
    if (index !== -1) {
      this.stateChangeListeners.splice(index, 1);
    }
  }

  /**
   * Transition to a new state
   */
  private transitionToState(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    
    // Reset counters on state change
    if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === 'OPEN') {
      this.successCount = 0;
    } else if (newState === 'HALF_OPEN') {
      this.successCount = 0;
      this.halfOpenRequests = 0;
    }
    
    // Notify listeners of state change
    this.notifyStateChangeListeners(previousState);
    
    console.log(JSON.stringify({
      level: 'info',
      service: 'circuit-breaker',
      event: 'state_change',
      message: `Circuit breaker state changed from ${previousState} to ${newState}`,
      previousState,
      currentState: newState
    }));
  }

  /**
   * Notify all state change listeners
   */
  private notifyStateChangeListeners(previousState: CircuitState): void {
    for (const listener of this.stateChangeListeners) {
      try {
        listener(this.state, previousState);
      } catch (error) {
        console.error(JSON.stringify({
          level: 'error',
          service: 'circuit-breaker',
          event: 'listener_error',
          message: 'Error in circuit breaker state change listener',
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    }
  }
}

/**
 * Create a circuit breaker instance with default options
 */
export function createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker {
  return new CircuitBreaker(options);
}

/**
 * Create circuit breakers for different endpoints
 */
export function createCircuitBreakerRegistry(): Record<string, CircuitBreaker> {
  const DEFAULT_OPTIONS: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeoutMs: 30000,
    halfOpenMaxRequests: 3
  };
  
  // Create circuit breakers for each CoreLogic API endpoint
  return {
    'address-match': new CircuitBreaker({ ...DEFAULT_OPTIONS, failureThreshold: 3 }),
    'property-attributes': new CircuitBreaker({ ...DEFAULT_OPTIONS, failureThreshold: 5 }),
    'sales-history': new CircuitBreaker({ ...DEFAULT_OPTIONS, failureThreshold: 5 }),
    'avm': new CircuitBreaker({ ...DEFAULT_OPTIONS, failureThreshold: 4 }),
    'market-statistics': new CircuitBreaker({ ...DEFAULT_OPTIONS, failureThreshold: 3 }),
    'authentication': new CircuitBreaker({ ...DEFAULT_OPTIONS, failureThreshold: 2, resetTimeoutMs: 60000 }),
    'global': new CircuitBreaker({ ...DEFAULT_OPTIONS, failureThreshold: 10, resetTimeoutMs: 120000 })
  };
} 