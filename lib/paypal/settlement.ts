// lib/paypal/settlement.ts
import { createDraftInvoice, sendInvoice } from './client';
import { SettlementResult } from './types';

/**
 * Executes the full settlement lifecycle: 
 * 1. Generates a draft invoice.
 * 2. Sends the invoice to the roommate.
 * 
 * @param roommateEmail - The target recipient's sandbox email.
 * @param amount - The financial amount to settle.
 * @param reason - Human-readable explanation for the ledger.
 * @returns A structured result indicating success or failure.
 */
export async function executeSettlement(
  roommateEmail: string, 
  amount: number, 
  reason: string
): Promise<SettlementResult> {
  try {
    console.log(`[FairShare] Initiating settlement for ${roommateEmail} ($${amount})`);
    
    const invoiceId = await createDraftInvoice(roommateEmail, amount, reason);
    console.log(`[FairShare] Draft invoice created: ${invoiceId}`);
    
    await sendInvoice(invoiceId);
    console.log(`[FairShare] Invoice ${invoiceId} successfully sent.`);

    return { success: true, invoiceId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown PayPal error';
    console.error(`[FairShare] Settlement failed: ${errorMessage}`);
    
    return { success: false, error: errorMessage };
  }
}