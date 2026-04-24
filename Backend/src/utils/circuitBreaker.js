/**
 * ============================================================================
 * CIRCUIT BREAKER - Database Protection Utility
 * ============================================================================
 * Protects database connections from being overwhelmed by too many AI requests.
 * Implements the Circuit Breaker pattern with:
 * - CLOSED: Normal operation
 * - OPEN: Blocking requests after too many failures
 * - HALF_OPEN: Testing if service recovered
 * ============================================================================
 */

const logger = require('./logger');

// Circuit states
const CIRCUIT_STATE = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN'
};

class CircuitBreaker {
    constructor(options = {}) {
        // Configuration with defaults
        this.name = options.name || 'default';
        this.failureThreshold = options.failureThreshold || 5;     // Failures before opening
        this.successThreshold = options.successThreshold || 2;      // Successes to close from half-open
        this.timeout = options.timeout || 30000;                    // Time to wait before half-open (30s)
        this.requestTimeout = options.requestTimeout || 10000;      // Individual request timeout (10s)
        this.monitorInterval = options.monitorInterval || 5000;     // Health check interval (5s)

        // State tracking
        this.state = CIRCUIT_STATE.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;

        // Statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rejectedRequests: 0,
            lastStateChange: new Date().toISOString(),
            circuitOpenCount: 0
        };

        logger.info(`CircuitBreaker '${this.name}' initialized (threshold: ${this.failureThreshold})`);
    }

    /**
     * Get current circuit state
     */
    getState() {
        return {
            name: this.name,
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            stats: this.stats,
            isOpen: this.state === CIRCUIT_STATE.OPEN,
            canAcceptRequests: this.state !== CIRCUIT_STATE.OPEN
        };
    }

    /**
     * Check if circuit allows requests
     */
    canRequest() {
        if (this.state === CIRCUIT_STATE.CLOSED) {
            return true;
        }

        if (this.state === CIRCUIT_STATE.OPEN) {
            // Check if timeout has passed
            if (this.nextAttemptTime && Date.now() >= this.nextAttemptTime) {
                this._transitionToHalfOpen();
                return true; // Allow one test request
            }
            return false;
        }

        // HALF_OPEN - allow limited requests
        return true;
    }

    /**
     * Execute a function with circuit breaker protection
     * @param {Function} fn - Async function to execute
     * @param {Object} options - Execution options
     * @returns {Promise} Result of the function
     */
    async execute(fn, options = {}) {
        const requestId = options.requestId || `req_${Date.now()}`;

        this.stats.totalRequests++;

        // Check if circuit allows requests
        if (!this.canRequest()) {
            this.stats.rejectedRequests++;
            logger.warn(`CircuitBreaker '${this.name}' REJECTED request ${requestId} (circuit OPEN)`);
            throw new CircuitBreakerError(
                `Circuit breaker '${this.name}' is OPEN. Too many failures. Try again later.`,
                'CIRCUIT_OPEN',
                this.nextAttemptTime
            );
        }

        try {
            // Execute with timeout
            const result = await this._executeWithTimeout(fn, this.requestTimeout);

            this._onSuccess();
            this.stats.successfulRequests++;

            return result;

        } catch (error) {
            this._onFailure(error);
            this.stats.failedRequests++;

            throw error;
        }
    }

    /**
     * Execute function with timeout
     */
    async _executeWithTimeout(fn, timeout) {
        return new Promise(async (resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Request timeout after ${timeout}ms`));
            }, timeout);

            try {
                const result = await fn();
                clearTimeout(timer);
                resolve(result);
            } catch (error) {
                clearTimeout(timer);
                reject(error);
            }
        });
    }

    /**
     * Record success
     */
    _onSuccess() {
        this.failureCount = 0;

        if (this.state === CIRCUIT_STATE.HALF_OPEN) {
            this.successCount++;

            if (this.successCount >= this.successThreshold) {
                this._transitionToClosed();
            }
        }
    }

    /**
     * Record failure
     */
    _onFailure(error) {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        logger.warn(`CircuitBreaker '${this.name}' failure #${this.failureCount}: ${error.message}`);

        if (this.state === CIRCUIT_STATE.HALF_OPEN) {
            // Failure in half-open means back to open
            this._transitionToOpen();
        } else if (this.state === CIRCUIT_STATE.CLOSED && this.failureCount >= this.failureThreshold) {
            this._transitionToOpen();
        }
    }

    /**
     * Transition to OPEN state
     */
    _transitionToOpen() {
        this.state = CIRCUIT_STATE.OPEN;
        this.nextAttemptTime = Date.now() + this.timeout;
        this.successCount = 0;
        this.stats.circuitOpenCount++;
        this.stats.lastStateChange = new Date().toISOString();

        logger.error(`CircuitBreaker '${this.name}' OPENED after ${this.failureCount} failures. Retry at: ${new Date(this.nextAttemptTime).toISOString()}`);
    }

    /**
     * Transition to HALF_OPEN state
     */
    _transitionToHalfOpen() {
        this.state = CIRCUIT_STATE.HALF_OPEN;
        this.successCount = 0;
        this.stats.lastStateChange = new Date().toISOString();

        logger.info(`CircuitBreaker '${this.name}' HALF-OPEN. Testing with limited requests...`);
    }

    /**
     * Transition to CLOSED state
     */
    _transitionToClosed() {
        this.state = CIRCUIT_STATE.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttemptTime = null;
        this.stats.lastStateChange = new Date().toISOString();

        logger.info(`CircuitBreaker '${this.name}' CLOSED. Service recovered.`);
    }

    /**
     * Force circuit to open (manual intervention)
     */
    forceOpen(reason = 'Manual intervention') {
        logger.warn(`CircuitBreaker '${this.name}' FORCE OPENED: ${reason}`);
        this._transitionToOpen();
    }

    /**
     * Force circuit to close (manual intervention)
     */
    forceClose(reason = 'Manual intervention') {
        logger.info(`CircuitBreaker '${this.name}' FORCE CLOSED: ${reason}`);
        this._transitionToClosed();
    }

    /**
     * Reset all stats and state
     */
    reset() {
        this.state = CIRCUIT_STATE.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rejectedRequests: 0,
            lastStateChange: new Date().toISOString(),
            circuitOpenCount: 0
        };

        logger.info(`CircuitBreaker '${this.name}' RESET`);
    }
}

/**
 * Custom error for circuit breaker rejections
 */
class CircuitBreakerError extends Error {
    constructor(message, code, retryAfter) {
        super(message);
        this.name = 'CircuitBreakerError';
        this.code = code;
        this.retryAfter = retryAfter;
    }
}

// ============================================================================
// GLOBAL CIRCUIT BREAKERS FOR DIFFERENT SERVICES
// ============================================================================

const circuitBreakers = {
    // Circuit breaker for AI Python API (Port 8001)
    aiService: new CircuitBreaker({
        name: 'AI_SERVICE_8001',
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 30000,
        requestTimeout: 15000
    }),

    // Circuit breaker for Database (Port 3307)
    database: new CircuitBreaker({
        name: 'DATABASE_3307',
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 60000,  // Longer timeout for DB recovery
        requestTimeout: 10000
    }),

    // Circuit breaker for external APIs
    externalApi: new CircuitBreaker({
        name: 'EXTERNAL_API',
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 45000,
        requestTimeout: 20000
    })
};

/**
 * Get a circuit breaker by name
 */
function getCircuitBreaker(name) {
    return circuitBreakers[name] || null;
}

/**
 * Get status of all circuit breakers
 */
function getAllCircuitBreakerStatus() {
    const status = {};
    for (const [name, breaker] of Object.entries(circuitBreakers)) {
        status[name] = breaker.getState();
    }
    return status;
}

/**
 * Create a new circuit breaker
 */
function createCircuitBreaker(name, options = {}) {
    if (circuitBreakers[name]) {
        logger.warn(`CircuitBreaker '${name}' already exists, returning existing instance`);
        return circuitBreakers[name];
    }

    circuitBreakers[name] = new CircuitBreaker({ name, ...options });
    return circuitBreakers[name];
}

module.exports = {
    CircuitBreaker,
    CircuitBreakerError,
    CIRCUIT_STATE,
    circuitBreakers,
    getCircuitBreaker,
    getAllCircuitBreakerStatus,
    createCircuitBreaker
};
