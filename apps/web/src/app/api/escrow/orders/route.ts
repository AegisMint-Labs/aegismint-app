import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceEscrowClient, DEFAULT_TESTNET_CONTRACTS } from '@aegismint/sdk';

/**
 * GET /api/escrow/orders
 * Returns active escrow orders from the Soroban marketplace contract.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractId =
      searchParams.get('contractId') ||
      DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW;

    const escrowClient = new MarketplaceEscrowClient(contractId);
    const orders = await escrowClient.list_active_orders();

    return NextResponse.json(
      {
        success: true,
        orders: orders.map((o) => ({
          ...o,
          amount: o.amount.toString(),
          remainingAmount: o.remainingAmount.toString(),
          pricePerUnit: o.pricePerUnit.toString(),
          totalPrice: o.totalPrice.toString(),
          escrowLockedAmount: o.escrowLockedAmount.toString(),
        })),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
