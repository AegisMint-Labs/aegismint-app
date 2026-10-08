import { NextRequest, NextResponse } from 'next/server';
import { ServerSorobanTxService } from '@/server/soroban-service';

/**
 * POST /api/tx/submit
 * Submits client-signed transaction XDR to the Stellar Soroban network
 * and polls for final consensus execution.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signedXdr, network = 'TESTNET', maxWaitSeconds = 30 } = body;

    if (!signedXdr) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: signedXdr' },
        { status: 400 }
      );
    }

    const txService = new ServerSorobanTxService(network);
    const result = await txService.submitSignedTransaction(
      signedXdr,
      maxWaitSeconds
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Failed to submit transaction: ${message}` },
      { status: 500 }
    );
  }
}
