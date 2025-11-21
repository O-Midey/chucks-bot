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

      console.log("Verification attempt:", {
        mode,
        hasToken: !!token,
        hasChallenge: !!challenge,
      });

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verified");
        res.status(200).send(challenge);
        return;
      } else {
        console.log("❌ Verification failed");
        res.status(403).send("Forbidden");
        return;
      }
    }

    // ============ MESSAGE HANDLING (POST) ============
    if (req.method === "POST") {
      const body = req.body;

      console.log("📥 Webhook POST received");
      console.log("Body:", JSON.stringify(body, null, 2));

      // Extract message from webhook payload
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!message) {
        console.log("⚠️ No message found in webhook payload");
        res.status(200).json({ success: true });
        return;
      }

      const from = message.from;
      const text = message.text?.body;
      const messageType = message.type;

      console.log(`Message: ${messageType} from ${from}`);
      console.log(`Text: "${text}"`);

      // Only reply to text messages
      if (messageType !== "text" || !text) {
        console.log("⚠️ Not a text message or empty text, skipping reply");
        res.status(200).json({ success: true });
        return;
      }

      const API_KEY = process.env.DIALOG_360_API_KEY;
      const isTestMode = !API_KEY || process.env.TEST_MODE === "true";

      // Route message through message router
      const response = await MessageRouter.route(from, text);

      if (isTestMode) {
        // ============ TEST MODE ============
        console.log("🧪 TEST MODE - Would send this reply:");
        console.log(response.message);
        console.log("State:", response.state);
        console.log("✅ Test successful! (No actual WhatsApp message sent)");

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

        console.log("🚀 Attempting to send reply to:", from);

        try {
          const whatsappService = new WhatsAppService(API_KEY);
          const result = await whatsappService.sendMessage(
            from,
            response.message
          );

          console.log("✅ Reply sent successfully!");
          console.log("Message ID:", result.messageId);
          console.log("Current State:", response.state);

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
