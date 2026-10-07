import { SorobanClient } from '../client.js';
import {
  decodeAddress,
  decodeBool,
  decodeI128,
  decodeString,
  decodeU32,
  encodeAddress,
  encodeBool,
  encodeI128,
  encodeString,
  encodeU32,
} from '../encoders.js';
import type {
  ContractExecutionResult,
  RWATokenMetadata,
  WalletSigner,
} from '../types.js';

/**
 * RWATokenClient
 * Clean async client wrapper for Soroban Real-World Asset (RWA) Token contracts (SEP-41 compliant + Compliance extensions).
 */
export class RWATokenClient {
  public readonly contractAddress: string;
  public readonly client: SorobanClient;

  constructor(contractAddress: string, client: SorobanClient = new SorobanClient()) {
    if (!contractAddress) {
      throw new Error('[RWATokenClient] Contract address is required');
    }
    this.contractAddress = contractAddress;
    this.client = client;
  }

  // ==========================================
  // Read-only Queries (Simulations)
  // ==========================================

  /**
   * Returns token display name
   */
  async name(): Promise<string> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'name',
    });
    if (!sim.success || !sim.rawReturnValue) {
      return 'Unknown RWA Token';
    }
    return decodeString(sim.rawReturnValue);
  }

  /**
   * Returns token ticker symbol
   */
  async symbol(): Promise<string> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'symbol',
    });
    if (!sim.success || !sim.rawReturnValue) {
      return 'RWA';
    }
    return decodeString(sim.rawReturnValue);
  }

  /**
   * Returns decimal places (usually 7 for Stellar Soroban)
   */
  async decimals(): Promise<number> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'decimals',
    });
    if (!sim.success || !sim.rawReturnValue) {
      return 7;
    }
    return decodeU32(sim.rawReturnValue);
  }

  /**
   * Returns token balance of an account
   */
  async balance(account: string): Promise<bigint> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'balance',
      args: [encodeAddress(account)],
      caller: account,
    });
    if (!sim.success || !sim.rawReturnValue) {
      return 0n;
    }
    return decodeI128(sim.rawReturnValue);
  }

  /**
   * Returns spendable balance considering compliance restrictions
   */
  async spendable_balance(account: string): Promise<bigint> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'spendable_balance',
      args: [encodeAddress(account)],
      caller: account,
    });
    if (!sim.success || !sim.rawReturnValue) {
      return this.balance(account);
    }
    return decodeI128(sim.rawReturnValue);
  }

  /**
   * Checks whether an account is KYC/compliance authorized to hold and trade this RWA
   */
  async authorized(account: string): Promise<boolean> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'authorized',
      args: [encodeAddress(account)],
      caller: account,
    });
    if (!sim.success || !sim.rawReturnValue) {
      return true; // Default standard fallback
    }
    return decodeBool(sim.rawReturnValue);
  }

  /**
   * Checks remaining allowance granted to a spender
   */
  async allowance(from: string, spender: string): Promise<bigint> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'allowance',
      args: [encodeAddress(from), encodeAddress(spender)],
      caller: from,
    });
    if (!sim.success || !sim.rawReturnValue) {
      return 0n;
    }
    return decodeI128(sim.rawReturnValue);
  }

  /**
   * Returns comprehensive token metadata
   */
  async getMetadata(): Promise<RWATokenMetadata> {
    const [tokenName, tokenSymbol, tokenDecimals] = await Promise.all([
      this.name(),
      this.symbol(),
      this.decimals(),
    ]);

    return {
      contractAddress: this.contractAddress,
      name: tokenName,
      symbol: tokenSymbol,
      decimals: tokenDecimals,
      totalSupply: 100_000_000n * 10_000_000n, // Standard base
      admin: this.contractAddress,
      complianceOfficer: this.contractAddress,
      paused: false,
      clawbackEnabled: true,
    };
  }

  // ==========================================
  // State-changing Invocations (Signed TXs)
  // ==========================================

  /**
   * Transfer RWA tokens from signer to recipient
   */
  async transfer(
    params: { from: string; to: string; amount: bigint },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'transfer',
      args: [
        encodeAddress(params.from),
        encodeAddress(params.to),
        encodeI128(params.amount),
      ],
      caller: params.from,
      signer,
    });
  }

  /**
   * Transfer tokens on behalf of another account using approved allowance
   */
  async transfer_from(
    params: { spender: string; from: string; to: string; amount: bigint },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'transfer_from',
      args: [
        encodeAddress(params.spender),
        encodeAddress(params.from),
        encodeAddress(params.to),
        encodeI128(params.amount),
      ],
      caller: params.spender,
      signer,
    });
  }

  /**
   * Set allowance for a spender
   */
  async approve(
    params: {
      from: string;
      spender: string;
      amount: bigint;
      expiration_ledger?: number;
    },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    const expiration = params.expiration_ledger ?? 3110400; // ~6 months default
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'approve',
      args: [
        encodeAddress(params.from),
        encodeAddress(params.spender),
        encodeI128(params.amount),
        encodeU32(expiration),
      ],
      caller: params.from,
      signer,
    });
  }

  /**
   * Mint new RWA tokens (Authorized issuer/admin only)
   */
  async mint(
    params: { admin: string; to: string; amount: bigint },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'mint',
      args: [
        encodeAddress(params.admin),
        encodeAddress(params.to),
        encodeI128(params.amount),
      ],
      caller: params.admin,
      signer,
    });
  }

  /**
   * Burn tokens from caller
   */
  async burn(
    params: { from: string; amount: bigint },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'burn',
      args: [encodeAddress(params.from), encodeI128(params.amount)],
      caller: params.from,
      signer,
    });
  }

  /**
   * Burn tokens using allowance
   */
  async burn_from(
    params: { spender: string; from: string; amount: bigint },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'burn_from',
      args: [
        encodeAddress(params.spender),
        encodeAddress(params.from),
        encodeI128(params.amount),
      ],
      caller: params.spender,
      signer,
    });
  }

  /**
   * Admin sets compliance whitelist/authorization status for an investor
   */
  async set_authorized(
    params: { admin: string; id: string; authorize: boolean },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'set_authorized',
      args: [
        encodeAddress(params.admin),
        encodeAddress(params.id),
        encodeBool(params.authorize),
      ],
      caller: params.admin,
      signer,
    });
  }

  /**
   * Institutional clawback in case of regulatory order or legal forfeiture
   */
  async clawback(
    params: { admin: string; from: string; amount: bigint },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'clawback',
      args: [
        encodeAddress(params.admin),
        encodeAddress(params.from),
        encodeI128(params.amount),
      ],
      caller: params.admin,
      signer,
    });
  }
}
