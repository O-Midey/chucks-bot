import { GlobalPayAPIService } from "../../lib/services/globalPayApiService.js";
import { WhatsAppService } from "../../lib/services/whatsappService.js";
import { SessionManager } from "../../lib/session/sessionManager.js";
import { STATES } from "../../lib/config/constants.js";
import { cacheService } from "../../lib/services/cacheService.js";
import { PaymentLogger } from "../../lib/utils/paymentLogger.js";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const payload = req.body;
    const transactionReference =
      payload.transactionReference || payload.merchantTransactionReference;

    const logKey = transactionReference || "unknown";
    console.log(
      `[PAYMENT] Received GlobalPay webhook for transaction ${logKey}`
    );

    // WEBHOOK SIGNATURE VALIDATION: Verify authenticity
    const signature =
      req.headers["x-globalpay-signature"] || req.headers["x-signature"];
    if (signature && process.env.GLOBALPAY_WEBHOOK_SECRET) {
      const secret = process.env.GLOBALPAY_WEBHOOK_SECRET;
      const payload_str =
        typeof payload === "string" ? payload : JSON.stringify(payload);
      const hash = crypto
        .createHmac("sha256", secret)
        .update(payload_str)
        .digest("hex");

      if (hash !== signature) {
        console.error(
          `[PAYMENT] Invalid webhook signature for transaction ${logKey}. Rejecting.`
        );
        PaymentLogger.logError(
          logKey,
          "invalid_signature",
          "Webhook signature verification failed"
        );
        return res
          .status(403)
          .json({ success: false, message: "Invalid signature." });
      }
      PaymentLogger.logWebhook(logKey, true, false);
    } else {
      console.warn(
        "[PAYMENT] No GLOBALPAY_WEBHOOK_SECRET configured. Skipping signature validation (WARNING: PRODUCTION RISK)."
      );
    }

    if (!transactionReference) {
      console.error("Webhook payload is missing transaction reference.");
      return res
        .status(400)
        .json({ success: false, message: "Missing transaction reference." });
    }

    // IDEMPOTENCY CHECK: Prevent duplicate processing of same transaction
    const processedKey = `payment:processed:${transactionReference}`;
    const alreadyProcessed = await cacheService.get(processedKey);
    if (alreadyProcessed) {
      console.log(
        `[PAYMENT] Transaction ${transactionReference} already processed. Skipping.`
      );
      PaymentLogger.logWebhook(transactionReference, true, true);
      return res
        .status(200)
        .json({
          success: true,
          message: "Webhook already processed (idempotent).",
        });
    }

    const globalPayService = new GlobalPayAPIService();
    const verification = await globalPayService.verifyPayment(
      transactionReference
    );

    const merchantRef = verification.success
      ? verification.data.merchantTransactionReference
      : payload.merchantTransactionReference;

    if (
      verification.success &&
      (verification.data.status === "success" ||
        verification.data.status === "completed")
    ) {
      console.log(
        `[PAYMENT] Payment verified for transaction ${transactionReference}`
      );
      PaymentLogger.logVerification(
        transactionReference,
        true,
        verification.data.status
      );

      let userId;
      if (merchantRef && merchantRef.startsWith("SKY_")) {
        const parts = merchantRef.split("_");
        if (parts.length >= 2) {
          userId = parts[1];
        }
      }

      // Fallback: Try to extract userId from payload if merchantRef parsing fails
      if (!userId && payload.userId) {
        userId = payload.userId;
      }

      // Fallback: Try other common field names
      if (!userId && (payload.customer_id || payload.customerId)) {
        userId = payload.customer_id || payload.customerId;
      }

      if (userId) {
        console.log(
          `[PAYMENT] Found userId: ${userId} for transaction ${transactionReference}.`
        );

        // Mark transaction as processed BEFORE taking action (prevent race conditions)
        await cacheService.set(
          processedKey,
          { processedAt: new Date().toISOString(), userId },
          86400
        ); // 24hr TTL

        SessionManager.clearSession(userId);

        const policyNumber = "SKY" + Date.now().toString().slice(-8);
        const effectiveDate = new Date().toLocaleDateString();

        const message = `🎉 *Payment Successful!*

Your policy is now active!

📋 *Policy Details:*
Policy Number: ${policyNumber}
Effective Date: ${effectiveDate}

📄 Your policy document has been sent to your email.

Type MENU for more options or HELP for assistance.`;

        const API_KEY = process.env.DIALOG_360_API_KEY;
        if (API_KEY && process.env.TEST_MODE !== "true") {
          const whatsappService = new WhatsAppService(API_KEY);
          await whatsappService.sendMessage(userId, message);
          console.log(`Sent payment confirmation to ${userId}`);
        } else {
          console.log(
            `TEST MODE: Would send WhatsApp confirmation to ${userId}`
          );
        }
      } else {
        console.error(
          `[PAYMENT] Could not extract userId from merchant reference (${merchantRef}), payload fields (userId, customer_id, customerId), or other sources for transaction ${transactionReference}. Manual investigation required.`
        );
      }
    } else {
      console.log(
        `[PAYMENT] Payment verification failed for ${transactionReference}`
      );
      PaymentLogger.logVerification(
        transactionReference,
        false,
        verification.data?.status
      );
      if (verification.error) {
        console.log("Verification error (details omitted for security)");
      }
    }

    res.status(200).json({ success: true, message: "Webhook received." });
  } catch (error) {
    console.error("Error processing GlobalPay webhook:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
