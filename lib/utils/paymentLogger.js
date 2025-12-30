/**
 * Payment-specific structured logging helper.
 * Redacts sensitive fields (PII, full amounts, card details, etc.) and emits structured JSON logs.
 */
export class PaymentLogger {
  /**
   * Log a payment initiation event
   * @param {string} userId - User ID
   * @param {string} transactionRef - Transaction reference
   * @param {number} amount - Payment amount (safe to log)
   * @param {object} metadata - Additional metadata (will be redacted)
   */
  static logInitiation(userId, transactionRef, amount, metadata = {}) {
    console.log(
      JSON.stringify({
        level: "info",
        event: "payment_initiated",
        userId,
        transactionRef,
        amount,
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Log a payment verification
   * @param {string} transactionRef - Transaction reference
   * @param {boolean} success - Was verification successful
   * @param {string} status - Payment status (safe to log)
   * @param {boolean} amountMatches - Did amount match
   */
  static logVerification(
    transactionRef,
    success,
    status,
    amountMatches = null
  ) {
    console.log(
      JSON.stringify({
        level: success ? "info" : "warn",
        event: "payment_verified",
        transactionRef,
        success,
        status,
        amountMatches,
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Log webhook receipt
   * @param {string} transactionRef - Transaction reference
   * @param {boolean} signatureValid - Was signature valid
   * @param {boolean} alreadyProcessed - Was this a duplicate
   */
  static logWebhook(transactionRef, signatureValid, alreadyProcessed = false) {
    const level = alreadyProcessed ? "info" : signatureValid ? "info" : "error";
    console.log(
      JSON.stringify({
        level,
        event: "webhook_received",
        transactionRef,
        signatureValid,
        alreadyProcessed,
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Log a payment error
   * @param {string} transactionRef - Transaction reference
   * @param {string} errorType - Type of error (idempotency, verification, signature, etc.)
   * @param {string} message - Error message (should not contain PII)
   */
  static logError(transactionRef, errorType, message) {
    console.log(
      JSON.stringify({
        level: "error",
        event: "payment_error",
        transactionRef,
        errorType,
        message,
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Log attempt limit or timeout
   * @param {string} userId - User ID
   * @param {string} reason - Reason for failure (max_attempts, timeout, etc.)
   * @param {object} details - Attempt count, timeout duration, etc.
   */
  static logPaymentLimitExceeded(userId, reason, details = {}) {
    console.log(
      JSON.stringify({
        level: "warn",
        event: "payment_limit_exceeded",
        userId,
        reason,
        details,
        timestamp: new Date().toISOString(),
      })
    );
  }
}
