import { NextRequest, NextResponse } from 'next/server';
import { ServerSorobanTxService } from '@/server/soroban-service';
import {
  encodeFulfillOrderArgs,
  encodeCreateOrderArgs,
  encodeCancelOrderArgs,
  encodeTransferArgs,
  encodeSetWhitelistArgs,
  encodeMintArgs,
  encodeBurnArgs,
  DEFAULT_TESTNET_CONTRACTS,
} from '@aegismint/sdk';
import { xdr } from '@stellar/stellar-sdk';

/**
 * POST /api/tx/build
 * Server-side endpoint to construct and simulate unsigned Soroban transaction XDR.
 * The client browser (Freighter extension) then signs this XDR safely client-side.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userAddress,
      contractId,
      method,
      params,
      network = 'TESTNET',
      baseFee = '100',
    } = body;

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: userAddress' },
        { status: 400 }
      );
    }

    if (!contractId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: contractId' },
        { status: 400 }
      );
    }

    if (!method) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: method' },
        { status: 400 }
      );
    }

    // Encode method arguments based on method signature
    let encodedArgs: xdr.ScVal[] = [];

    switch (method) {
      case 'fulfill_order':
        encodedArgs = encodeFulfillOrderArgs({
          orderId: params.orderId,
          buyerOrSeller: params.buyerOrSeller || userAddress,
          fillAmount: BigInt(params.fillAmount),
        });
        break;

      case 'create_order':
        encodedArgs = encodeCreateOrderArgs({
          orderId: params.orderId,
          creator: params.creator || userAddress,
          asset: params.asset || DEFAULT_TESTNET_CONTRACTS.USTB_TOKEN,
          quoteAsset: params.quoteAsset || DEFAULT_TESTNET_CONTRACTS.AUSD_TOKEN,
          amount: BigInt(params.amount),
          pricePerUnit: BigInt(params.pricePerUnit),
          expirationTimestamp: Number(params.expirationTimestamp || Date.now() + 86400 * 7 * 1000),
        });
        break;

      case 'cancel_order':
        encodedArgs = encodeCancelOrderArgs({
          creator: params.creator || userAddress,
          orderId: params.orderId,
        });
        break;

      case 'transfer':
        encodedArgs = encodeTransferArgs(
          userAddress,
          params.to,
          BigInt(params.amount)
        );
        break;

      case 'set_whitelist':
        encodedArgs = encodeSetWhitelistArgs(
          params.account,
          Boolean(params.status)
        );
        break;

      case 'mint':
        encodedArgs = encodeMintArgs(params.to, BigInt(params.amount));
        break;

      case 'burn':
        encodedArgs = encodeBurnArgs(userAddress, BigInt(params.amount));
        break;

      default:
        // Raw or empty args
        encodedArgs = [];
    }

    const txService = new ServerSorobanTxService(network);
    const result = await txService.buildUnsignedContractTx({
      userAddress,
      contractId,
      method,
      args: encodedArgs,
      baseFee,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
