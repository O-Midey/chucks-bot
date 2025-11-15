import axios from "axios";

export default async function handler(req, res) {
  // Handle GET request for webhook verification
  if (req.method === "GET") {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("Webhook verification attempt:", {
      mode,
      token: token ? "***" : "missing",
    });

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified successfully");
      return res.status(200).send(challenge);
    } else {
      console.log("Webhook verification failed");
      return res.status(403).send("Forbidden");
    }
  }

  // Handle POST request for incoming messages
  if (req.method === "POST") {
    try {
      const body = req.body;

      // Log incoming webhook (helpful for debugging)
      console.log("Webhook received:", JSON.stringify(body, null, 2));

      // Check if this is a message
      if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from;
        const text = message.text?.body;
        const messageType = message.type;

        console.log(
          `Message received - From: ${from}, Type: ${messageType}, Text: ${text}`
        );

        // Only reply to text messages
        if (messageType === "text" && text) {
          const reply = `Hello! Welcome to Chuks! You said: "${text}". How can I help you today?`;

          // Send reply via 360dialog API
          const response = await axios.post(
            "https://waba.360dialog.io/v1/messages",
            {
              messaging_product: "whatsapp",
              to: from,
              type: "text",
              text: { body: reply },
            },
            {
              headers: {
                "D360-API-KEY": process.env.DIALOG_360_API_KEY,
                "Content-Type": "application/json",
              },
            }
          );

          console.log("Reply sent successfully:", response.data);
        }
      }

      // Always return 200 to acknowledge receipt
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(
        "Error processing webhook:",
        error.response?.data || error.message
      );
      // Still return 200 to prevent 360dialog from retrying
      return res.status(200).json({ success: true, error: error.message });
    }
  }

  // Handle other methods
  return res.status(405).json({ error: "Method not allowed" });
}
```

## Vercel Configuration

### 1. Environment Variables in Vercel

Go to your Vercel project dashboard:
1. Click on **Settings** → **Environment Variables**
2. Add these variables:
```;
VERIFY_TOKEN = your_secret_verify_token_here;
DIALOG_360_API_KEY = your_360dialog_api_key;
