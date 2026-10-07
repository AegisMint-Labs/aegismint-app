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
  USTB_TOKEN: 'CA3D5KRYMCMCZMQN763HUFYVGARWT55ITFQXCXUM7O5AIFYV3UCIOVTV',
  // Aegis Institutional USD Stablecoin
  AUSD_TOKEN: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  // Aegis Commercial Real Estate Token (Manhattan Prime Fund)
  CRE_TOKEN: 'CCU37D7V7FZZ3HBN3PBNK6M6R52VRLZZPQI3W3D3FZXDCP5O5WVRGOW4',
  // Aegis Asset Factory Contract
  ASSET_FACTORY: 'CB6P4T5XAY4H3G2J7K9L2M5N8Q1R4T7V9X2Z4B6D8F0H2J4L6N8P0R2T',
  // Aegis Marketplace Escrow Contract
  MARKETPLACE_ESCROW: 'CC4A6B8D0E2F4H6J8L0N2P4R6T8V0X2Z4B6D8F0H2J4L6N8P0R2T4V6X',
} as const;
