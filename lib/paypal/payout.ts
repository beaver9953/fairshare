// lib/paypal/payout.ts
import { PayPalAuthResponse } from "./types";

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const data = (await response.json()) as PayPalAuthResponse;
  return data.access_token;
}

export async function executePayout(recipientEmail: string, amount: number, reason: string) {
  const accessToken = await getAccessToken();
  const currency = process.env.PAYPAL_CURRENCY || 'GBP';

  const payload = {
    sender_batch_header: {
      sender_batch_id: `FS-PAYOUT-${Date.now()}`,
      email_subject: "FairShare Reimbursement",
      email_message: `You have received a FairShare reimbursement for: ${reason}`
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: amount.toFixed(2),
          currency: currency
        },
        receiver: recipientEmail,
        note: reason
      }
    ]
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal Payout Failed: ${errorText}`);
  }

  return await response.json();
}