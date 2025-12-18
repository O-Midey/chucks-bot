import { WhatsAppService } from "../../lib/services/whatsappService.js";
import { MessageRouter } from "../../lib/messageRouter.js";
import { SessionManager } from "../../lib/session/sessionManager.js";

export default async function handler(req, res) {
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
        console.error("VERIFY_TOKEN not set in environment variables");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
        return;
      } else {
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
        res.status(200).json({ success: true });
        return;
      }

      const from = message.from;
      const text = message.text?.body;
      const messageType = message.type;

      // Only reply to text messages
      if (messageType !== "text" || !text) {
        res.status(200).json({ success: true });
        return;
      }

      const API_KEY = process.env.DIALOG_360_API_KEY;
      const isTestMode = !API_KEY || process.env.TEST_MODE === "true";

      // Route message through message router
      const response = await MessageRouter.route(from, text);

      if (isTestMode) {
        // ============ TEST MODE ============

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
          console.error("❌ DIALOG_360_API_KEY not set");
          res.status(200).json({ success: false, error: "API key missing" });
          return;
        }

        try {
          const whatsappService = new WhatsAppService(API_KEY);
          const result = await whatsappService.sendMessage(
            from,
            response.message
          );

          res.status(200).json({ success: true });
          return;
        } catch (whatsappError) {
          console.error(
            "❌ WhatsApp API Error:",
            whatsappError.response?.status
          );
          console.error("Error details:", whatsappError.response?.data);

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
    res.status(405).json({ error: "Method not allowed" });
    return;
  } catch (error) {
    console.error("❌ Error in webhook:", error.message);
    console.error("Stack:", error.stack);

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
  SessionManager.cleanupOldSessions();
}
