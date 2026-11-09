// lib/paypal/types.ts

export interface PayPalAuthResponse {
  scope: string;
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
}

export interface InvoiceItem {
  name: string;
  description: string;
  quantity: string;
  unit_amount: {
    currency_code: string;
    value: string;
  };
}

export interface CreateInvoicePayload {
  detail: {
    invoice_number: string;
    currency_code: string;
    note: string;
    payment_term: {
      term_type: string;
      due_date: string;
    };
  };
  invoicer: {
    email_address: string;
  };
  primary_recipients: Array<{
    billing_info: {
      email_address: string;
    };
  }>;
  items: InvoiceItem[];
}

export interface SettlementResult {
  success: boolean;
  invoiceId?: string;
  error?: string;
}