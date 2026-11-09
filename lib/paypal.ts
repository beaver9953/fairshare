// lib/paypal.ts

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// 1. Get OAuth2 Token
async function getAccessToken() {
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
    const error = await response.text();
    throw new Error(`Failed to get PayPal token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// 2. Create an Invoice (Draft)
export async function createInvoice(roommateEmail: string, amount: number, description: string) {
  const accessToken = await getAccessToken();
  
  // Generate a unique invoice ID for the sandbox
  const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const payload = {
    detail: {
      invoice_number: invoiceId,
      currency_code: "USD",
      note: "FairShare Settlement",
      payment_term: {
        term_type: "DUE_ON_DATE_SPECIFIED",
        due_date: tomorrow.toISOString().split('T')[0]
      }
    },
    invoicer: {
      // Note: In sandbox, the business account email is required here
      email_address: "sb-uiepi53520867@business.example.com" 
    },
    primary_recipients: [
      {
        billing_info: {
          email_address: roommateEmail
        }
      }
    ],
    items: [
      {
        name: "Usage Overage",
        description: description,
        quantity: "1",
        unit_amount: {
          currency_code: "USD",
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
    const error = await response.text();
    throw new Error(`Failed to create invoice: ${error}`);
  }

  const data = await response.json();
  // The API returns the invoice ID in the URL of the response
  const createdInvoiceId = data.href.split('/').pop();
  
  return createdInvoiceId;
}

// 3. Send the Invoice
export async function sendInvoice(invoiceId: string) {
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

  // Note: The /send endpoint often returns a 202 Accepted with no content
  if (!response.ok && response.status !== 202) {
    const error = await response.text();
    throw new Error(`Failed to send invoice: ${error}`);
  }

  return true;
}

// Wrapper function to do both
export async function settleFairShare(roommateEmail: string, amount: number, reason: string) {
  try {
    const invoiceId = await createInvoice(roommateEmail, amount, reason);
    await sendInvoice(invoiceId);
    return { success: true, invoiceId };
  } catch (error) {
    console.error("PayPal Settlement Error:", error);
    return { success: false, error: (error as Error).message };
  }
}