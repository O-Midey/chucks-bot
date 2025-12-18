import { GlobalPayAPIService } from '../../lib/services/globalPayApiService.js';
import { WhatsAppService } from '../../lib/services/whatsappService.js';
import { SessionManager } from '../../lib/session/sessionManager.js';
import { STATES } from '../../lib/config/constants.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const payload = req.body;
    console.log('Received GlobalPay Webhook:', JSON.stringify(payload, null, 2));

    // The webhook payload structure from GlobalPay is not documented in the prompt.
    // Assuming it contains 'transactionReference' or 'merchantTransactionReference'.
    const transactionReference = payload.transactionReference || payload.merchantTransactionReference;

    if (!transactionReference) {
      console.error('Webhook payload is missing transaction reference.');
      return res.status(400).json({ success: false, message: 'Missing transaction reference.' });
    }

    // It's good practice to verify the webhook signature if GlobalPay provides one.
    // This is to ensure the request is from GlobalPay. (Not included as not in docs)

    const globalPayService = new GlobalPayAPIService();
    const verification = await globalPayService.verifyPayment(transactionReference);

    // Assuming the verification response contains the merchant's transaction reference.
    const merchantRef = verification.success ? verification.data.merchantTransactionReference : payload.merchantTransactionReference;

    if (verification.success && verification.data.status === 'success') { // Assuming 'success' is the status for a successful payment.
      console.log('Payment successfully verified:', verification.data);

      let userId;
      if (merchantRef && merchantRef.startsWith('SKY_')) {
          const parts = merchantRef.split('_');
          if (parts.length >= 2) {
              userId = parts[1];
          }
      }

      if (userId) {
        console.log(`Found userId: ${userId} for transaction.`);

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
            console.log(`TEST MODE: Would send WhatsApp confirmation to ${userId}`);
        }

      } else {
        console.error('Could not extract userId from merchant reference:', merchantRef);
      }
    } else {
      console.log('Payment verification failed or payment not successful:', verification.error || verification.data);
    }

    res.status(200).json({ success: true, message: 'Webhook received.' });

  } catch (error) {
    console.error('Error processing GlobalPay webhook:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
