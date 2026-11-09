// app/api/payout/route.ts
import { NextResponse } from 'next/server';
import { executePayout } from '@/lib/paypal/payout';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, amount, reason } = body;

    if (!email || !amount) {
      return NextResponse.json({ error: 'Missing email or amount' }, { status: 400 });
    }

    const result = await executePayout(email, amount, reason || 'FairShare Settlement');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payout successfully dispatched',
      payoutBatchId: result.batch_header?.payout_batch_id 
    });

  } catch (error: any) {
    console.error('[Payout Error]:', error);
    // If the sandbox lacks funds, we catch it gracefully
    if (error.message.includes('INSUFFICIENT_FUNDS')) {
       return NextResponse.json({ error: 'Sandbox business account has insufficient funds to payout. Please add funds in the PayPal Sandbox dashboard.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}