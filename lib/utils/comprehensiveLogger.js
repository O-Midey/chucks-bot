import pino from "pino";
/* eslint-disable indent */

// Production-ready logger configuration
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(process.env.NODE_ENV === "production"
    ? {
        // Production: JSON format for log aggregation
        serializers: pino.stdSerializers,
      }
    : {
        // Development: Pretty format
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),
});

// Comprehensive logging for every server action
export const serverLogger = {
  // User action logging - captures every user interaction
  user: {
    action: (userId, action, details = {}) => {
      logger.info({
        event: "user_action",
        userId,
        action,
        ...details,
        timestamp: new Date().toISOString(),
      });
    },
    stateChange: (userId, fromState, toState, trigger) => {
      logger.info({
        event: "user_state_change",
        userId,
        fromState,
        toState,
        trigger,
        timestamp: new Date().toISOString(),
      });
    },
    input: (userId, input, currentState) => {
      logger.info({
        event: "user_input",
        userId,
        input: input.substring(0, 100), // Truncate long inputs
        inputLength: input.length,
        currentState,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Payment logging
  payment: {
    initiation: (userId, reference, amount, currency = "NGN") => {
      logger.info({
        event: "payment_initiated",
        userId,
        transactionRef: reference,
        amount,
        currency,
        timestamp: new Date().toISOString(),
      });
    },
    verification: (reference, success, status, amount) => {
      logger.info({
        event: "payment_verified",
        transactionRef: reference,
        success,
        status,
        amount,
        timestamp: new Date().toISOString(),
      });
    },
    error: (reference, error, context = {}) => {
      logger.error({
        event: "payment_error",
        transactionRef: reference,
        error: error.message,
        stack: error.stack,
        ...context,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Session logging - tracks all session operations
  session: {
    created: (userId, state) => {
      logger.info({
        event: "session_created",
        userId,
        state,
        timestamp: new Date().toISOString(),
      });
    },
    updated: (userId, oldState, newState, data = {}) => {
      logger.info({
        event: "session_updated",
        userId,
        oldState,
        newState,
        dataKeys: Object.keys(data),
        timestamp: new Date().toISOString(),
      });
    },
    expired: (userId, reason) => {
      logger.warn({
        event: "session_expired",
        userId,
        reason,
        timestamp: new Date().toISOString(),
      });
    },
    cleared: (userId, reason) => {
      logger.info({
        event: "session_cleared",
        userId,
        reason,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // API logging - captures all HTTP requests/responses
  api: {
    request: (method, url, userId, body = {}) => {
      logger.info({
        event: "api_request",
        method,
        url,
        userId,
        bodySize: JSON.stringify(body).length,
        timestamp: new Date().toISOString(),
      });
    },
    response: (method, url, status, duration, userId) => {
      logger.info({
        event: "api_response",
        method,
        url,
        status,
        duration: `${duration}ms`,
        userId,
        timestamp: new Date().toISOString(),
      });
    },
    error: (method, url, error, userId, context = {}) => {
      logger.error({
        event: "api_error",
        method,
        url,
        error: error.message,
        stack: error.stack,
        userId,
        ...context,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // External API calls - logs all third-party integrations
  external: {
    request: (service, endpoint, method, duration) => {
      logger.info({
        event: "external_api_request",
        service,
        endpoint,
        method,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    },
    response: (service, endpoint, status, duration, success) => {
      logger.info({
        event: "external_api_response",
        service,
        endpoint,
        status,
        duration: `${duration}ms`,
        success,
        timestamp: new Date().toISOString(),
      });
    },
    error: (service, endpoint, error, context = {}) => {
      logger.error({
        event: "external_api_error",
        service,
        endpoint,
        error: error.message,
        stack: error.stack,
        ...context,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // WhatsApp logging
  whatsapp: {
    messageReceived: (from, messageType, text) => {
      logger.info({
        event: "whatsapp_message_received",
        from,
        messageType,
        textLength: text?.length || 0,
        timestamp: new Date().toISOString(),
      });
    },
    messageSent: (to, messageLength, success) => {
      logger.info({
        event: "whatsapp_message_sent",
        to,
        messageLength,
        success,
        timestamp: new Date().toISOString(),
      });
    },
    webhookError: (error, body) => {
      logger.error({
        event: "whatsapp_webhook_error",
        error: error.message,
        stack: error.stack,
        bodyKeys: Object.keys(body || {}),
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Business logic logging
  business: {
    enrollmentStarted: (userId, insuranceType) => {
      logger.info({
        event: "enrollment_started",
        userId,
        insuranceType,
        timestamp: new Date().toISOString(),
      });
    },
    enrollmentCompleted: (userId, insuranceType, providerId) => {
      logger.info({
        event: "enrollment_completed",
        userId,
        insuranceType,
        providerId,
        timestamp: new Date().toISOString(),
      });
    },
    enrollmentFailed: (userId, insuranceType, error, step) => {
      logger.error({
        event: "enrollment_failed",
        userId,
        insuranceType,
        error: error.message,
        step,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Business flow logging - tracks user journey through processes
  flow: {
    stepEntered: (userId, flow, step, data = {}) => {
      logger.info({
        event: "flow_step_entered",
        userId,
        flow,
        step,
        dataKeys: Object.keys(data),
        timestamp: new Date().toISOString(),
      });
    },
    stepCompleted: (userId, flow, step, duration, success = true) => {
      logger.info({
        event: "flow_step_completed",
        userId,
        flow,
        step,
        duration: `${duration}ms`,
        success,
        timestamp: new Date().toISOString(),
      });
    },
    flowAbandoned: (userId, flow, step, reason) => {
      logger.warn({
        event: "flow_abandoned",
        userId,
        flow,
        step,
        reason,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // System events
  system: {
    startup: (service, version, environment) => {
      logger.info({
        event: "system_startup",
        service,
        version,
        environment,
        timestamp: new Date().toISOString(),
      });
    },
    shutdown: (service, reason) => {
      logger.info({
        event: "system_shutdown",
        service,
        reason,
        timestamp: new Date().toISOString(),
      });
    },
    error: (component, error, context = {}) => {
      logger.error({
        event: "system_error",
        component,
        error: error.message,
        stack: error.stack,
        ...context,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Security logging
  security: {
    authAttempt: (userId, method, success, ip) => {
      logger.info({
        event: "auth_attempt",
        userId,
        method,
        success,
        ip,
        timestamp: new Date().toISOString(),
      });
    },
    suspiciousActivity: (userId, activity, details = {}) => {
      logger.warn({
        event: "suspicious_activity",
        userId,
        activity,
        ...details,
        timestamp: new Date().toISOString(),
      });
    },
    rateLimitHit: (userId, endpoint, attempts) => {
      logger.warn({
        event: "rate_limit_hit",
        userId,
        endpoint,
        attempts,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Performance logging
  performance: {
    cacheHit: (key, type) => {
      logger.debug({
        event: "cache_hit",
        key,
        type,
        timestamp: new Date().toISOString(),
      });
    },
    cacheMiss: (key, type) => {
      logger.debug({
        event: "cache_miss",
        key,
        type,
        timestamp: new Date().toISOString(),
      });
    },
    slowQuery: (operation, duration, details = {}) => {
      logger.warn({
        event: "slow_operation",
        operation,
        duration: `${duration}ms`,
        ...details,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Database operations
  database: {
    query: (operation, table, duration, success = true) => {
      logger.info({
        event: "database_query",
        operation,
        table,
        duration: `${duration}ms`,
        success,
        timestamp: new Date().toISOString(),
      });
    },
    error: (operation, error, query = {}) => {
      logger.error({
        event: "database_error",
        operation,
        error: error.message,
        stack: error.stack,
        query,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Generic logging methods
  info: (message, context = {}) => {
    logger.info({
      message,
      ...context,
      timestamp: new Date().toISOString(),
    });
  },
  warn: (message, context = {}) => {
    logger.warn({
      message,
      ...context,
      timestamp: new Date().toISOString(),
    });
  },
  error: (message, error, context = {}) => {
    logger.error({
      message,
      error: error?.message || error,
      stack: error?.stack,
      ...context,
      timestamp: new Date().toISOString(),
    });
  },
  debug: (message, context = {}) => {
    logger.debug({
      message,
      ...context,
      timestamp: new Date().toISOString(),
    });
  },
};

export default logger;
