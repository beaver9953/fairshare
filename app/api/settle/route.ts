// app/api/settle/route.ts
import { NextResponse } from 'next/server';
import { executeSettlement } from '@/lib/paypal/settlement';

/**
 * POST /api/settle
 * Triggered by the "Settle Fair Share" button in the UI.
 * Expects JSON: { email: string, amount: number, reason?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, amount, reason } = body;

    // 1. Validate Input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid recipient email is required' }, 
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' }, 
        { status: 400 }
      );
    }

    // 2. Execute Domain Logic
    const result = await executeSettlement(
      email, 
      amount, 
      reason || 'FairShare Usage Settlement'
    );

    // 3. Handle Result
    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice generated and dispatched successfully',
      invoiceId: result.invoiceId 
    });

  } catch (error) {
    console.error('[API Error] Failed to parse request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}