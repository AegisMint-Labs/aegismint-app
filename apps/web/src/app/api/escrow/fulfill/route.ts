import { NextRequest, NextResponse } from 'next/server';
import { ServerSorobanTxService } from '@/server/soroban-service';

/**
 * POST /api/escrow/fulfill
 * Dedicated server-side helper to prepare atomic order fulfillment XDR.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { buyerOrSeller, orderId, fillAmount, network = 'TESTNET' } = body;

    if (!buyerOrSeller || !orderId || !fillAmount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Required fields: buyerOrSeller, orderId, fillAmount',
        },
        { status: 400 }
      );
    }

    const txService = new ServerSorobanTxService(network);
    const result = await txService.buildFulfillEscrowOrderTx({
      buyerOrSeller,
      orderId,
      fillAmount: BigInt(fillAmount),
    });

    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
