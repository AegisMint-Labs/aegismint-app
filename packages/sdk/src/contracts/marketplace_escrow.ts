import { SorobanClient } from '../client.js';
import {
  decodeAddress,
  decodeBool,
  decodeI128,
  decodeScVal,
  decodeString,
  decodeU32,
  decodeU64,
  encodeAddress,
  encodeBool,
  encodeI128,
  encodeString,
  encodeSymbol,
  encodeU32,
  encodeU64,
} from '../encoders.js';
import type {
  ContractExecutionResult,
  CreateOrderParams,
  EscrowOrder,
  FulfillOrderParams,
  OrderStatus,
  OrderType,
  WalletSigner,
} from '../types.js';

/**
 * MarketplaceEscrowClient
 * Client wrapper for Soroban P2P Marketplace Escrow contract.
 * Facilitates peer-to-peer atomic trades, escrow custody, multi-asset matching, and dispute settlement.
 */
export class MarketplaceEscrowClient {
  public readonly contractAddress: string;
  public readonly client: SorobanClient;

  constructor(contractAddress: string, client: SorobanClient = new SorobanClient()) {
    if (!contractAddress) {
      throw new Error('[MarketplaceEscrowClient] Contract address is required');
    }
    this.contractAddress = contractAddress;
    this.client = client;
  }

  // ==========================================
  // Read-only Queries
  // ==========================================

  /**
   * Retrieves an individual escrow order by ID
   */
  async get_order(orderId: string): Promise<EscrowOrder | null> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'get_order',
      args: [encodeString(orderId)],
    });

    if (!sim.success || !sim.rawReturnValue) {
      return null;
    }

    try {
      const native = decodeScVal<Record<string, unknown>>(sim.rawReturnValue);
      if (!native) return null;

      return this.mapNativeOrder(native, orderId);
    } catch {
      return null;
    }
  }

  /**
   * Lists all currently active orders, optionally filtered by asset
   */
  async list_active_orders(assetAddress?: string): Promise<EscrowOrder[]> {
    const args = assetAddress ? [encodeAddress(assetAddress)] : [];
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: assetAddress ? 'list_orders_for_asset' : 'list_active_orders',
      args,
    });

    if (!sim.success || !sim.rawReturnValue) {
      return [];
    }

    try {
      const native = decodeScVal<unknown[]>(sim.rawReturnValue);
      if (!Array.isArray(native)) return [];

      return native.map((item, idx) =>
        this.mapNativeOrder(item as Record<string, unknown>, `ORD-${idx}`)
      );
    } catch {
      return [];
    }
  }

  /**
   * Returns total number of orders created in the escrow contract
   */
  async get_order_count(): Promise<number> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'get_order_count',
    });
    if (!sim.success || !sim.rawReturnValue) {
      return 0;
    }
    return decodeU32(sim.rawReturnValue);
  }

  /**
   * Returns locked escrow balance for an order
   */
  async get_escrow_balance(orderId: string): Promise<bigint> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'get_escrow_balance',
      args: [encodeString(orderId)],
    });
    if (!sim.success || !sim.rawReturnValue) {
      return 0n;
    }
    return decodeI128(sim.rawReturnValue);
  }

  // ==========================================
  // State-changing Invocations
  // ==========================================

  /**
   * Creates a new escrow order.
   * If a SELL order, the creator locks the RWA tokens in escrow.
   * If a BUY order, the creator locks the quote payment currency (e.g. AUSD/USDC) in escrow.
   */
  async create_order(
    params: CreateOrderParams,
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    const expirationSeconds = params.expirationSeconds ?? 86400 * 7; // 7 days

    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'create_order',
      args: [
        encodeAddress(params.creator),
        encodeSymbol(params.orderType),
        encodeAddress(params.assetAddress),
        encodeString(params.assetSymbol),
        encodeAddress(params.quoteAssetAddress),
        encodeString(params.quoteAssetSymbol),
        encodeI128(params.amount),
        encodeI128(params.pricePerUnit),
        encodeU64(BigInt(expirationSeconds)),
      ],
      caller: params.creator,
      signer,
    });
  }

  /**
   * Fulfills an open escrow order atomically.
   */
  async fulfill_order(
    params: FulfillOrderParams,
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'fulfill_order',
      args: [
        encodeString(params.orderId),
        encodeAddress(params.buyerOrSeller),
        encodeI128(params.fillAmount),
      ],
      caller: params.buyerOrSeller,
      signer,
    });
  }

  /**
   * Cancels an order and refunds remaining locked escrow back to creator
   */
  async cancel_order(
    params: { creator: string; orderId: string },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'cancel_order',
      args: [encodeAddress(params.creator), encodeString(params.orderId)],
      caller: params.creator,
      signer,
    });
  }

  /**
   * Claims escrow funds upon completion
   */
  async claim_escrow(
    params: { claimant: string; orderId: string },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'claim_escrow',
      args: [encodeAddress(params.claimant), encodeString(params.orderId)],
      caller: params.claimant,
      signer,
    });
  }

  /**
   * Resolves an order under dispute (Arbitrator only)
   */
  async resolve_dispute(
    params: {
      arbitrator: string;
      orderId: string;
      awardToCreator: boolean;
    },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'resolve_dispute',
      args: [
        encodeAddress(params.arbitrator),
        encodeString(params.orderId),
        encodeBool(params.awardToCreator),
      ],
      caller: params.arbitrator,
      signer,
    });
  }

  // ==========================================
  // Internal Mapping Helper
  // ==========================================

  private mapNativeOrder(raw: Record<string, unknown>, fallbackId: string): EscrowOrder {
    const amount = BigInt((raw.amount as string | number | bigint) || 0n);
    const pricePerUnit = BigInt((raw.price_per_unit || raw.pricePerUnit || 0) as string | bigint);
    const totalPrice = (amount * pricePerUnit) / 10_000_000n;

    return {
      id: String(raw.id || raw.order_id || fallbackId),
      creator: String(raw.creator || ''),
      orderType: (raw.order_type || raw.orderType || 'SELL') as OrderType,
      assetAddress: String(raw.asset_address || raw.assetAddress || ''),
      assetSymbol: String(raw.asset_symbol || raw.assetSymbol || 'RWA'),
      quoteAssetAddress: String(raw.quote_asset_address || raw.quoteAssetAddress || ''),
      quoteAssetSymbol: String(raw.quote_asset_symbol || raw.quoteAssetSymbol || 'AUSD'),
      amount,
      remainingAmount: BigInt(
        (raw.remaining_amount || raw.remainingAmount || amount) as string | bigint
      ),
      pricePerUnit,
      totalPrice,
      escrowAddress: String(raw.escrow_address || this.contractAddress),
      escrowLockedAmount: BigInt(
        (raw.escrow_locked_amount || raw.escrowAmount || 0) as string | bigint
      ),
      expirationTimestamp: Number(raw.expiration_timestamp || raw.expiresAt || 0),
      status: (raw.status as OrderStatus) || 'OPEN',
      counterparty: raw.counterparty ? String(raw.counterparty) : undefined,
      disputeReason: raw.dispute_reason ? String(raw.dispute_reason) : undefined,
      createdAt: Number(raw.created_at || Date.now()),
    };
  }
}
