import axios from "axios";

const BASE_URL = "https://waba-v2.360dialog.io";

// Function to get insurance type response
function getInsuranceResponse(userInput) {
  const input = userInput.toLowerCase().trim();

  // Check for number selection or keyword
  if (input === "1" || input.includes("car insurance")) {
    return `🚗 *Car Insurance*\n\nGreat choice! Our car insurance covers:\n• Third-party liability\n• Comprehensive coverage\n• Accident protection\n• Theft coverage\n\nPremiums start from ₦15,000/year.\n\nWould you like to:\nA) Get a quote\nB) Learn more\nC) Speak to an agent`;
  } else if (input === "2" || input.includes("health insurance")) {
    return `🏥 *Health Insurance*\n\nExcellent! Our health insurance includes:\n• Hospital bills coverage\n• Outpatient services\n• Prescription drugs\n• Emergency care\n\nPlans start from ₦25,000/year.\n\nWould you like to:\nA) Get a quote\nB) Learn more\nC) Speak to an agent`;
  } else if (input === "3" || input.includes("travel insurance")) {
    return `✈️ *Travel Insurance*\n\nPerfect for your trips! We cover:\n• Medical emergencies abroad\n• Trip cancellations\n• Lost luggage\n• Flight delays\n\nFrom ₦5,000 per trip.\n\nWould you like to:\nA) Get a quote\nB) Learn more\nC) Speak to an agent`;
  } else if (input === "4" || input.includes("life insurance")) {
    return `❤️ *Life Insurance*\n\nSecure your family's future with:\n• Death benefit payout\n• Terminal illness cover\n• Flexible premium payments\n• Investment options\n\nFrom ₦10,000/month.\n\nWould you like to:\nA) Get a quote\nB) Learn more\nC) Speak to an agent`;
  } else if (
    input === "5" ||
    input.includes("gadget") ||
    input.includes("phone insurance")
  ) {
    return `📱 *Gadget/Phone Insurance*\n\nProtect your devices with:\n• Screen damage coverage\n• Theft protection\n• Liquid damage\n• Worldwide coverage\n\nFrom ₦3,000/year.\n\nWould you like to:\nA) Get a quote\nB) Learn more\nC) Speak to an agent`;
  } else if (input === "a" || input.includes("quote")) {
    return `📋 *Get a Quote*\n\nI'll help you get a personalized quote!\n\nPlease provide:\n1. Your full name\n2. Phone number\n3. Email address\n\nOr type "agent" to speak with a human agent directly.`;
  } else if (
    input === "b" ||
    input.includes("learn") ||
    input.includes("more")
  ) {
    return `📚 *Learn More*\n\nI can provide detailed information about:\n• Coverage details\n• Claim process\n• Policy terms\n• Payment options\n\nWhat would you like to know more about?`;
  } else if (
    input === "c" ||
    input.includes("agent") ||
    input.includes("speak")
  ) {
    return `👤 *Connect with Agent*\n\nGreat! I'm connecting you with one of our insurance experts.\n\nYou'll receive a call within 30 minutes during business hours (9 AM - 5 PM, Mon-Fri).\n\nOr call us directly: +234 XXX XXX XXXX`;
  } else {
    // Default response for unrecognized input
    return `I'm not sure I understood that. Please choose from the following options:\n\n1️⃣ Car Insurance\n2️⃣ Health Insurance\n3️⃣ Travel Insurance\n4️⃣ Life Insurance\n5️⃣ Gadget/Phone Insurance\n\nOr type the name of the insurance you're interested in.`;
  }
}

// Check if message is a greeting
function isGreetingMessage(text) {
  const greetings = ["hi", "hello", "hey", "start", "help", "menu"];
  const lowerText = text.toLowerCase().trim();
  return greetings.some(
    (greeting) => lowerText === greeting || lowerText.startsWith(greeting + " ")
  );
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

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

      console.log(
        "Verification attempt:",
        {
          mode,
          hasToken: !!token,
          hasChallenge: !!challenge,
        },
        token
      );

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
      console.log("Body:", JSON.stringify(body, null, 2));

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

          // Check if we're in test mode (no API key or test phone number)
          const isTestMode = true;

          let reply;

          // Check if this is a greeting message
          if (isGreetingMessage(text)) {
            // Send initial menu
            reply = `Hello! I'm Chuks, your AI Insurance assistant. I can help you buy affordable, fast, and reliable insurance. What insurance do you need today?\n\n1️⃣ Car Insurance\n2️⃣ Health Insurance\n3️⃣ Travel Insurance\n4️⃣ Life Insurance\n5️⃣ Gadget/Phone Insurance`;
          } else {
            // Handle user selection (numbers, letters, or keywords)
            reply = getInsuranceResponse(text);
          }

          if (isTestMode) {
            // Test mode - just log the response
            console.log("🧪 TEST MODE - Would send this reply:");
            console.log(reply);
            console.log(
              "✅ Test successful! (No actual WhatsApp message sent)"
            );

            return res.status(200).json({
              success: true,
              test_mode: true,
              message_preview: reply,
              note: "This is a test. No actual WhatsApp message was sent.",
            });
          } else {
            // Production mode - send actual WhatsApp message
            if (!API_KEY) {
              console.error("❌ DIALOG_360_API_KEY not set");
              return res
                .status(200)
                .json({ success: false, error: "API key missing" });
            }

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
          }
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
