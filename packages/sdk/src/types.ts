import type { xdr } from '@stellar/stellar-sdk';

/**
 * Network passphrase constants
 */
export type NetworkPassphrase =
  | 'Test SDF Network ; September 2015'
  | 'Public Global Stellar Network ; September 2015'
  | 'Test SDF Future Network ; October 2022'
  | 'Standalone Network ; February 2017'
  | (string & {});

/**
 * Soroban RPC network configuration
 */
export interface SorobanNetworkConfig {
  networkPassphrase: NetworkPassphrase;
  rpcUrl: string;
  horizonUrl?: string;
  friendbotUrl?: string;
}

/**
 * Real-World Asset (RWA) Token Configuration
 */
export interface RWATokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  admin: string;
  complianceOfficer: string;
  isTransferRestricted: boolean;
}

/**
 * Real-World Asset Token Metadata
 */
export interface RWATokenMetadata {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  admin: string;
  complianceOfficer: string;
  paused: boolean;
  clawbackEnabled: boolean;
}

/**
 * Token Balance and authorization status for an account
 */
export interface RWABalance {
  account: string;
  balance: bigint;
  formattedBalance: string;
  spendableBalance: bigint;
  isAuthorized: boolean;
  isClawbackEnabled: boolean;
}

/**
 * Token Allowance state
 */
export interface TokenAllowance {
  owner: string;
  spender: string;
  amount: bigint;
  expirationLedger: number;
}

/**
 * Asset classification tiers for institutional Real-World Assets
 */
export type AssetTier =
  | 'TIER_1_TREASURY'      // Tokenized US T-Bills, Gov Bonds
  | 'TIER_2_REAL_ESTATE'   // Commercial/Residential Real Estate
  | 'TIER_3_PRIVATE_CREDIT' // Secured Debt, Invoice Financing
  | 'TIER_4_COMMODITY';    // Gold, Silver, Physical Reserves

/**
 * Compliance enforcement rules
 */
export interface AssetComplianceRules {
  whitelistRequired: boolean;
  kycRequired: boolean;
  jurisdictionRestrictions: string[];
  maxHolders: number;
  minimumHoldDurationSeconds: number;
}

/**
 * Deployed RWA Asset record managed by the Asset Factory
 */
export interface RWADeployedAsset {
  contractAddress: string;
  assetCode: string;
  assetName: string;
  decimals: number;
  issuer: string;
  tier: AssetTier;
  underlyingDocHash: string; // IPFS hash / SHA256 of prospectus or vault custody proof
  totalMinted: bigint;
  status: 'ACTIVE' | 'PAUSED' | 'RETIRED';
  complianceRules: AssetComplianceRules;
  createdAt: number;
}

/**
 * Parameters to deploy a new RWA asset via Asset Factory
 */
export interface CreateAssetParams {
  name: string;
  symbol: string;
  decimals?: number;
  tier: AssetTier;
  underlyingDocHash: string;
  initialSupply?: bigint;
  admin: string;
  complianceOfficer: string;
  complianceRules: AssetComplianceRules;
}

/**
 * Order directions in the P2P Marketplace
 */
export type OrderType = 'BUY' | 'SELL';

/**
 * Escrow lifecycle statuses
 */
export type OrderStatus =
  | 'OPEN'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'ESCROW_LOCKED';

/**
 * Escrow Order structure
 */
export interface EscrowOrder {
  id: string;
  creator: string;
  orderType: OrderType;
  assetAddress: string;
  assetSymbol: string;
  quoteAssetAddress: string;
  quoteAssetSymbol: string;
  amount: bigint;
  remainingAmount: bigint;
  pricePerUnit: bigint; // Scaled to quote asset decimals (usually 7 for Stellar Stroops)
  totalPrice: bigint;
  escrowAddress: string;
  escrowLockedAmount: bigint;
  expirationTimestamp: number;
  status: OrderStatus;
  counterparty?: string;
  disputeReason?: string;
  createdAt: number;
}

/**
 * Order creation parameters
 */
export interface CreateOrderParams {
  creator: string;
  orderType: OrderType;
  assetAddress: string;
  assetSymbol: string;
  quoteAssetAddress: string;
  quoteAssetSymbol: string;
  amount: bigint;
  pricePerUnit: bigint;
  expirationSeconds?: number;
}

/**
 * Order fulfillment parameters
 */
export interface FulfillOrderParams {
  orderId: string;
  buyerOrSeller: string;
  fillAmount: bigint;
}

/**
 * Generic wallet signer interface (compatible with Freighter and custom signers)
 */
export interface WalletSigner {
  signTransaction(
    xdr: string,
    opts?: {
      network?: string;
      networkPassphrase?: string;
      accountToSign?: string;
    }
  ): Promise<string>;
  getPublicKey?: () => Promise<string>;
}

/**
 * Contract simulation result
 */
export interface ContractSimulationResult<T = unknown> {
  success: boolean;
  returnValue?: T;
  rawReturnValue?: xdr.ScVal;
  cost: {
    cpuInstructions: number;
    memoryBytes: number;
  };
  minResourceFee?: string;
  error?: string;
}

/**
 * Contract execution transaction result
 */
export interface ContractExecutionResult<T = unknown> {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionHash: string;
  ledger?: number;
  returnValue?: T;
  rawReturnValue?: xdr.ScVal;
  error?: string;
}
