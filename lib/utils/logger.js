import pino from "pino";
import pinoHttp from "pino-http";

// Fields to redact from logs (tweak as needed)
const REDACT = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.body.password",
  "req.body.token",
  "req.body.authorization",
  "response.headers.set-cookie",
];

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");
const pretty = process.env.LOG_PRETTY === "true" && process.env.NODE_ENV !== "production";

const pinoOptions = {
  level,
  redact: REDACT,
  base: {
    pid: false,
    hostname: false,
    service: process.env.SERVICE_NAME || "chucks-bot",
    env: process.env.NODE_ENV || "development",
  },
  transport: pretty
    ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        singleLine: true,
      },
    }
    : undefined,
};

export const logger = pino(pinoOptions);

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers["x-request-id"] || `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  autoLogging: { ignore: () => false },
  customSuccessMessage: (req, res) => `request completed: ${req.method} ${req.url}`,
  customErrorMessage: (req, res, err) => `request errored: ${req.method} ${req.url} -> ${err && err.message}`,
});

export default {
  logger,
  requestLogger,
  info: (...args) => logger.info(...args),
  warn: (...args) => logger.warn(...args),
  error: (...args) => logger.error(...args),
  debug: (...args) => logger.debug(...args),

  logWebhook: (req, body = null) => {
    logger.info({ event: "webhook_received", method: req.method, url: req.url, headers: req.headers, body, timestamp: new Date().toISOString() }, "Webhook received");
  },

  logAPICall: (endpoint, method, data, response) => {
    logger.info({ event: "api_call", endpoint, method, requestData: data, response }, "API call");
  },

  logError: (err, context = {}) => {
    logger.error({ event: "error", error: err && err.stack ? err.stack : err, context }, "Unhandled error");
  },

  async pingCache(cacheService) {
    try {
      await cacheService._ensureClient?.();
      const res = await cacheService.get("ping:logger_test");
      return { ok: true, cached: !!res };
    } catch (e) {
      logger.warn({ event: "cache_ping_failed", error: e.message }, "Cache ping failed");
      return { ok: false, error: e.message };
    }
  },
};
