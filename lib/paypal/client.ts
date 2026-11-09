// lib/paypal/client.ts
import { PayPalAuthResponse, CreateInvoicePayload } from './types';

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE;
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const CURRENCY_CODE = process.env.PAYPAL_CURRENCY;

/**
 * Retrieves a short-lived OAuth2 access token from PayPal.
 * Utilizes the Client Credentials grant type.
 * @throws {Error} If the authentication request fails or environment variables are missing.
 */
async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET || !PAYPAL_API_BASE) {
    throw new Error('Missing PayPal API credentials in environment variables.');
  }

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal Auth Failed [${response.status}]: ${errorText}`);
  }

  const data = (await response.json()) as PayPalAuthResponse;
  return data.access_token;
}

/**
 * Creates a draft invoice in the PayPal system.
 * @param recipientEmail - The sandbox email of the roommate who owes money.
 * @param amount - The total amount owed.
 * @param description - The itemized reason for the settlement.
 * @returns The PayPal-generated Invoice ID.
 */
export async function createDraftInvoice(
  recipientEmail: string, 
  amount: number, 
  description: string
): Promise<string> {
  const accessToken = await getAccessToken();
  const invoicerEmail = process.env.PAYPAL_BUSINESS_EMAIL;

  if (!invoicerEmail || !CURRENCY_CODE) {
    throw new Error('Missing PAYPAL_BUSINESS_EMAIL or PAYPAL_CURRENCY in environment variables.');
  }

  const invoiceNumber = `FS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const payload: CreateInvoicePayload = {
    detail: {
      invoice_number: invoiceNumber,
      currency_code: CURRENCY_CODE,
      note: "FairShare Automated Settlement",
      payment_term: {
        term_type: "DUE_ON_DATE_SPECIFIED",
        due_date: tomorrow.toISOString().split('T')[0]
      }
    },
    invoicer: {
      email_address: invoicerEmail
    },
    primary_recipients: [
      {
        billing_info: {
          email_address: recipientEmail
        }
      }
    ],
    items: [
      {
        name: "FairShare Usage Settlement",
        description: description,
        quantity: "1",
        unit_amount: {
          currency_code: CURRENCY_CODE,
          value: amount.toFixed(2)
        }
      }
    ]
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v2/invoicing/invoices`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create invoice [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  return data.href.split('/').pop() as string;
}

/**
 * Sends an existing draft invoice to the recipient via email.
 * @param invoiceId - The ID returned from createDraftInvoice.
 * @throws {Error} If the invoice fails to send.
 */
export async function sendInvoice(invoiceId: string): Promise<void> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/invoicing/invoices/${invoiceId}/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      send_to_invoicer: false,
      send_to_recipient: true,
    }),
  });

  if (!response.ok && response.status !== 202) {
    const errorText = await response.text();
    throw new Error(`Failed to send invoice [${response.status}]: ${errorText}`);
  }
}