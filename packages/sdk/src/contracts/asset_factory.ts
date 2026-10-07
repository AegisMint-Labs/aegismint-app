import { SorobanClient } from '../client.js';
import {
  decodeAddress,
  decodeBool,
  decodeI128,
  decodeScVal,
  decodeString,
  decodeU32,
  encodeAddress,
  encodeBool,
  encodeI128,
  encodeString,
  encodeSymbol,
  encodeU32,
  encodeVec,
} from '../encoders.js';
import type {
  AssetComplianceRules,
  AssetTier,
  ContractExecutionResult,
  CreateAssetParams,
  RWADeployedAsset,
  WalletSigner,
} from '../types.js';

/**
 * AssetFactoryClient
 * Client wrapper for Soroban RWA Asset Factory contract.
 * Manages deployment, compliance gating, registry, and tier verification of real-world assets.
 */
export class AssetFactoryClient {
  public readonly contractAddress: string;
  public readonly client: SorobanClient;

  constructor(contractAddress: string, client: SorobanClient = new SorobanClient()) {
    if (!contractAddress) {
      throw new Error('[AssetFactoryClient] Contract address is required');
    }
    this.contractAddress = contractAddress;
    this.client = client;
  }

  // ==========================================
  // Read-only Queries
  // ==========================================

  /**
   * Retrieves asset registration record from factory registry
   */
  async get_asset(assetAddress: string): Promise<RWADeployedAsset | null> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'get_asset',
      args: [encodeAddress(assetAddress)],
    });

    if (!sim.success || !sim.rawReturnValue) {
      return null;
    }

    try {
      const native = decodeScVal<Record<string, unknown>>(sim.rawReturnValue);
      if (!native) return null;

      return {
        contractAddress: assetAddress,
        assetCode: String(native.code || native.symbol || 'RWA'),
        assetName: String(native.name || 'Real-World Asset'),
        decimals: Number(native.decimals || 7),
        issuer: String(native.issuer || native.admin || ''),
        tier: (native.tier as AssetTier) || 'TIER_1_TREASURY',
        underlyingDocHash: String(native.doc_hash || native.underlyingDocHash || ''),
        totalMinted: BigInt((native.total_minted as string | number | bigint) || 0n),
        status: (native.status as 'ACTIVE' | 'PAUSED' | 'RETIRED') || 'ACTIVE',
        complianceRules: {
          whitelistRequired: Boolean(native.whitelist_required ?? true),
          kycRequired: Boolean(native.kyc_required ?? true),
          jurisdictionRestrictions: (native.jurisdictions as string[]) || ['US', 'EU'],
          maxHolders: Number(native.max_holders || 500),
          minimumHoldDurationSeconds: Number(native.min_hold_seconds || 0),
        },
        createdAt: Number(native.created_at || Date.now()),
      };
    } catch {
      return null;
    }
  }

  /**
   * Lists all institutional RWA assets deployed by or registered with the factory
   */
  async list_assets(): Promise<RWADeployedAsset[]> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'list_assets',
    });

    if (!sim.success || !sim.rawReturnValue) {
      return [];
    }

    try {
      const native = decodeScVal<unknown[]>(sim.rawReturnValue);
      if (!Array.isArray(native)) return [];

      return native.map((item, idx) => {
        const row = item as Record<string, unknown>;
        return {
          contractAddress: String(row.address || row.contract_address || `C_RWA_${idx}`),
          assetCode: String(row.code || row.symbol || 'RWA'),
          assetName: String(row.name || 'Real-World Asset'),
          decimals: Number(row.decimals || 7),
          issuer: String(row.issuer || row.admin || ''),
          tier: (row.tier as AssetTier) || 'TIER_1_TREASURY',
          underlyingDocHash: String(row.doc_hash || ''),
          totalMinted: BigInt((row.total_minted as string | number | bigint) || 0n),
          status: (row.status as 'ACTIVE' | 'PAUSED' | 'RETIRED') || 'ACTIVE',
          complianceRules: {
            whitelistRequired: Boolean(row.whitelist_required ?? true),
            kycRequired: Boolean(row.kyc_required ?? true),
            jurisdictionRestrictions: (row.jurisdictions as string[]) || ['US', 'EU'],
            maxHolders: Number(row.max_holders || 500),
            minimumHoldDurationSeconds: Number(row.min_hold_seconds || 0),
          },
          createdAt: Number(row.created_at || Date.now()),
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Returns count of deployed assets
   */
  async get_asset_count(): Promise<number> {
    const sim = await this.client.simulateCall({
      contractId: this.contractAddress,
      method: 'get_asset_count',
    });
    if (!sim.success || !sim.rawReturnValue) {
      return 0;
    }
    return decodeU32(sim.rawReturnValue);
  }

  // ==========================================
  // State-changing Invocations
  // ==========================================

  /**
   * Deploys a new RWA token instance on Soroban via the Factory
   */
  async deploy_asset(
    params: CreateAssetParams,
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'deploy_asset',
      args: [
        encodeString(params.name),
        encodeString(params.symbol),
        encodeU32(params.decimals ?? 7),
        encodeSymbol(params.tier),
        encodeString(params.underlyingDocHash),
        encodeI128(params.initialSupply ?? 0n),
        encodeAddress(params.admin),
        encodeAddress(params.complianceOfficer),
      ],
      caller: params.admin,
      signer,
    });
  }

  /**
   * Registers an externally deployed SEP-41 token with compliance tier
   */
  async register_asset(
    params: {
      admin: string;
      assetAddress: string;
      tier: AssetTier;
      underlyingDocHash: string;
    },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'register_asset',
      args: [
        encodeAddress(params.admin),
        encodeAddress(params.assetAddress),
        encodeSymbol(params.tier),
        encodeString(params.underlyingDocHash),
      ],
      caller: params.admin,
      signer,
    });
  }

  /**
   * Compliance officer attests and verifies asset collateral backing
   */
  async verify_asset(
    params: {
      complianceOfficer: string;
      assetAddress: string;
      verified: boolean;
    },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'verify_asset',
      args: [
        encodeAddress(params.complianceOfficer),
        encodeAddress(params.assetAddress),
        encodeBool(params.verified),
      ],
      caller: params.complianceOfficer,
      signer,
    });
  }

  /**
   * Updates compliance parameters for an asset
   */
  async update_compliance(
    params: {
      admin: string;
      assetAddress: string;
      rules: AssetComplianceRules;
    },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    const jurisdictionsVec = encodeVec(
      params.rules.jurisdictionRestrictions.map((j) => encodeString(j))
    );

    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'update_compliance',
      args: [
        encodeAddress(params.admin),
        encodeAddress(params.assetAddress),
        encodeBool(params.rules.whitelistRequired),
        encodeBool(params.rules.kycRequired),
        jurisdictionsVec,
        encodeU32(params.rules.maxHolders),
        encodeU32(params.rules.minimumHoldDurationSeconds),
      ],
      caller: params.admin,
      signer,
    });
  }

  /**
   * Pauses an asset in case of emergency or regulatory notification
   */
  async pause_asset(
    params: { admin: string; assetAddress: string },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'pause_asset',
      args: [encodeAddress(params.admin), encodeAddress(params.assetAddress)],
      caller: params.admin,
      signer,
    });
  }

  /**
   * Unpauses an asset
   */
  async unpause_asset(
    params: { admin: string; assetAddress: string },
    signer: WalletSigner
  ): Promise<ContractExecutionResult> {
    return this.client.invoke({
      contractId: this.contractAddress,
      method: 'unpause_asset',
      args: [encodeAddress(params.admin), encodeAddress(params.assetAddress)],
      caller: params.admin,
      signer,
    });
  }
}
