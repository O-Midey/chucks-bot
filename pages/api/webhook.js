import { WhatsAppService } from "../../lib/services/whatsappService.js";
import { MessageRouter } from "../../lib/messageRouter.js";
import { SessionManager } from "../../lib/session/sessionManager.js";
import { serverLogger } from "../../lib/utils/comprehensiveLogger.js";

export default async function handler(req, res) {
  const startTime = Date.now();

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    // ============ WEBHOOK VERIFICATION (GET) ============
    if (req.method === "GET") {
      const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

      if (!VERIFY_TOKEN) {
        serverLogger.error("VERIFY_TOKEN not set in environment variables");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      serverLogger.api.request("GET", "/api/webhook", "webhook_verification", {
        mode,
        tokenMatch: token === VERIFY_TOKEN,
      });

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        serverLogger.info("Webhook verification successful", { challenge });
        res.status(200).send(challenge);
        return;
      } else {
        serverLogger.warn("Webhook verification failed", { mode, tokenMatch: token === VERIFY_TOKEN });
        res.status(403).send("Forbidden");
        return;
      }
    }

    // ============ MESSAGE HANDLING (POST) ============
    if (req.method === "POST") {
      const body = req.body;

      // Extract message from webhook payload
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!message) {
        serverLogger.api.response("POST", "/api/webhook", 200, Date.now() - startTime, "no_message");
        res.status(200).json({ success: true });
        return;
      }

      const from = message.from;
      const text = message.text?.body;
      const messageType = message.type;

      serverLogger.user.input(from, text, "webhook");
      serverLogger.whatsapp.messageReceived(from, messageType, text?.length || 0);

      // Only reply to text messages
      if (messageType !== "text" || !text) {
        serverLogger.info("Ignoring non-text message", { messageType, from });
        res.status(200).json({ success: true });
        return;
      }

      const API_KEY = process.env.DIALOG_360_API_KEY;
      const isTestMode = !API_KEY || process.env.TEST_MODE === "true";

      serverLogger.info("Processing message", { from, textLength: text.length, isTestMode });

      // Route message through message router
      const response = await MessageRouter.route(from, text);

      if (isTestMode) {
        // ============ TEST MODE ============
        serverLogger.info("Test mode response", { from, state: response.state });

        res.status(200).json({
          success: true,
          test_mode: true,
          message_preview: response.message,
          state: response.state,
          note: "This is a test. No actual WhatsApp message was sent.",
        });
        return;
      } else {
        // ============ PRODUCTION MODE ============
        if (!API_KEY) {
          serverLogger.error("DIALOG_360_API_KEY not set");
          res.status(200).json({ success: false, error: "API key missing" });
          return;
        }

        try {
          const whatsappService = new WhatsAppService(API_KEY);
          const result = await whatsappService.sendMessage(
            from,
            response.message
          );

          serverLogger.whatsapp.messageSent(from, response.message.length, true);
          serverLogger.api.response("POST", "/api/webhook", 200, Date.now() - startTime, from);

          res.status(200).json({ success: true });
          return;
        } catch (whatsappError) {
          serverLogger.external.error("whatsapp", "/send", whatsappError);

          // Still return 200 to prevent 360dialog retries
          res.status(200).json({
            success: false,
            error: "WhatsApp API error",
            details: whatsappError.response?.data,
          });
          return;
        }
      }
    }

    // Unsupported method
    serverLogger.warn("Unsupported method", { method: req.method });
    res.status(405).json({ error: "Method not allowed" });
    return;
  } catch (error) {
    serverLogger.api.error("POST", "/api/webhook", error, req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from);

    // Return 200 to prevent retries from 360dialog
    res.status(200).json({
      success: false,
      error: error.message,
    });
    return;
  }
}

// Cleanup function (can be called from a cron job)
export function cleanupSessions() {
  serverLogger.info("Starting session cleanup");
  const cleaned = SessionManager.cleanupOldSessions();
  serverLogger.info("Session cleanup completed", { cleanedSessions: cleaned });
}
