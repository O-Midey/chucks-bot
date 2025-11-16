import axios from "axios";

const BASE_URL = "https://waba-v2.360dialog.io";
export default async function handler(req, res) {
  try {
    // Handle GET request for webhook verification
    if (req.method === "GET") {
      const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

      if (!VERIFY_TOKEN) {
        console.error("VERIFY_TOKEN not set in environment variables");
        return res.status(500).json({ error: "Server configuration error" });
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
        return res.status(200).send(challenge);
      } else {
        console.log("❌ Verification failed");
        return res.status(403).send("Forbidden");
      }
    }

    // Handle POST request for incoming messages
    if (req.method === "POST") {
      const body = req.body;

      console.log("📥 Webhook POST received");
      console.log("Body:", JSON.stringify(body, null, 2)); // Added for debugging

      // Check if this is a message
      if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from;
        const text = message.text?.body;
        const messageType = message.type;

        console.log(`Message: ${messageType} from ${from}`);
        console.log(`Text: "${text}"`);

        // Only reply to text messages
        if (messageType === "text" && text) {
          const API_KEY = process.env.DIALOG_360_API_KEY;

          if (!API_KEY) {
            console.error("❌ DIALOG_360_API_KEY not set");
            return res
              .status(200)
              .json({ success: false, error: "API key missing" });
          }

          const reply = `Hello! I'm Chuks, your AI Insurance assistant. I can help you buy affordable, fast, and reliable insurance. What insurance do you need today?\n
1️⃣ Car Insurance\n
2️⃣ Health Insurance\n
3️⃣ Travel Insurance\n
4️⃣ Life Insurance\n
5️⃣ Gadget/Phone Insurance`;

          console.log("🚀 Attempting to send reply to:", from);

          const response = await axios.post(
            `${BASE_URL}/messages`,
            {
              messaging_product: "whatsapp",
              to: from,
              type: "text",
              text: { body: reply },
            },
            {
              headers: {
                "D360-API-KEY": API_KEY,
                "Content-Type": "application/json",
              },
            }
          );

          console.log("✅ Reply sent successfully!");
          console.log("Message ID:", response.data.messages?.[0]?.id);
        } else {
          console.log("⚠️ Not a text message or empty text, skipping reply");
        }
      } else {
        console.log("⚠️ No message found in webhook payload");
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("❌ Error in webhook:", error.message);
    console.error("Stack:", error.stack);

    // Return 200 to prevent retries from 360dialog
    return res.status(200).json({
      success: false,
      error: error.message,
    });
  }
}
