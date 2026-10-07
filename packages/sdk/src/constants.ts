import type { SorobanNetworkConfig } from './types.js';

export const TESTNET_CONFIG: SorobanNetworkConfig = {
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  friendbotUrl: 'https://friendbot.stellar.org',
};

export const MAINNET_CONFIG: SorobanNetworkConfig = {
  networkPassphrase: 'Public Global Stellar Network ; September 2015',
  rpcUrl: 'https://soroban-rpc.stellar.org',
  horizonUrl: 'https://horizon.stellar.org',
};

export const STANDALONE_CONFIG: SorobanNetworkConfig = {
  networkPassphrase: 'Standalone Network ; February 2017',
  rpcUrl: 'http://localhost:8000/soroban/rpc',
  horizonUrl: 'http://localhost:8000',
};

/**
 * Standard Stellar / Soroban precision: 7 decimal places (1 unit = 10,000,000 stroops)
 */
export const STROOP_PRECISION = 7;
export const STROOP_FACTOR = 10_000_000n;

/**
 * Standard AegisMint Testnet deployed contracts for dev & demo
 */
export const DEFAULT_TESTNET_CONTRACTS = {
  // Aegis Treasury Token (Tokenized US T-Bills)
  USTB_TOKEN: 'CDMXSOPMD6Q4FI6ZQTPT3DRR363ZQXKT5Z5GZYIPI7D3LPTP5AQMD3UJ',
  // Aegis Institutional USD Stablecoin
  AUSD_TOKEN: 'CCGITDPYWMXF7APRVJI2ABTL6UJOCJWMWHSZU6WMN4ONGZJJJHOQHJX3',
  // Aegis Commercial Real Estate Token (Manhattan Prime Fund)
  CRE_TOKEN: 'CANWJ5TDZBSH7QSHNJ7WSRINBKZEU3Z7DRUFAKN6KOQVQRHXJG3THQU7',
  // Aegis Asset Factory Contract
  ASSET_FACTORY: 'CB7VZCJWUBZZFAFYZYSPATZEOFUZKP2PJ2DNRA6KVC5HYN3FFY5AJ5NP',
  // Aegis Marketplace Escrow Contract
  MARKETPLACE_ESCROW: 'CAEZQ7WGOHF2EPJILURGYTL22JS6AXWCTN7UW6ZPBOQRJ4J24CRUFIIG',
} as const;
