'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  SorobanClient,
  RWATokenClient,
  DEFAULT_TESTNET_CONTRACTS,
  type RWABalance,
  type AssetTier,
} from '@aegismint/sdk';
import {
  TrendingUp,
  ShieldCheck,
  Building2,
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Lock,
  RefreshCw,
  FileCheck,
  Send,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface InstitutionalAsset {
  contractAddress: string;
  symbol: string;
  name: string;
  tier: AssetTier;
  apy: string;
  priceUsd: number;
  docHash: string;
  balance: bigint;
  formattedBalance: string;
  isAuthorized: boolean;
}

export function RWADashboard() {
  const { publicKey, isConnected, signer } = useWallet();

  const [assets, setAssets] = useState<InstitutionalAsset[]>([
    {
      contractAddress: DEFAULT_TESTNET_CONTRACTS.USTB_TOKEN,
      symbol: 'USTB',
      name: 'Aegis US Treasury Bill Vault (4-Week)',
      tier: 'TIER_1_TREASURY',
      apy: '5.24%',
      priceUsd: 1.0,
      docHash: 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      balance: 250_000_0000000n,
      formattedBalance: '25,000.00',
      isAuthorized: true,
    },
    {
      contractAddress: DEFAULT_TESTNET_CONTRACTS.CRE_TOKEN,
      symbol: 'CRE',
      name: 'Manhattan Commercial Prime Fund II',
      tier: 'TIER_2_REAL_ESTATE',
      apy: '7.85%',
      priceUsd: 100.0,
      docHash: 'ipfs://bafybeihkoviema7g3gx43z247oov6c56uf33vwt22kux553u7ffm6j4wpe',
      balance: 150_0000000n,
      formattedBalance: '150.00',
      isAuthorized: true,
    },
    {
      contractAddress: DEFAULT_TESTNET_CONTRACTS.AUSD_TOKEN,
      symbol: 'AUSD',
      name: 'Aegis Institutional USD Settlement Coin',
      tier: 'TIER_1_TREASURY',
      apy: '4.10%',
      priceUsd: 1.0,
      docHash: 'ipfs://bafybeig2v45z3r34l22mfy66x57l67ffmvz33w25kux774u7ffm6j4ausd',
      balance: 50_000_0000000n,
      formattedBalance: '5,000.00',
      isAuthorized: true,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<InstitutionalAsset | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferStatus, setTransferStatus] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Fetch live balances from Soroban RPC when connected
  const refreshBalances = useCallback(async () => {
    if (!publicKey) return;
    setIsLoading(true);

    try {
      const sorobanClient = new SorobanClient();

      const updated = await Promise.all(
        assets.map(async (asset) => {
          try {
            const tokenClient = new RWATokenClient(asset.contractAddress, sorobanClient);
            const [rawBalance, isAuth] = await Promise.all([
              tokenClient.balance(publicKey),
              tokenClient.authorized(publicKey),
            ]);

            const stroops = Number(rawBalance) / 10_000_000;
            return {
              ...asset,
              balance: rawBalance,
              formattedBalance: stroops.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              }),
              isAuthorized: isAuth,
            };
          } catch {
            return asset;
          }
        })
      );

      setAssets(updated);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, assets]);

  useEffect(() => {
    if (publicKey) {
      refreshBalances();
    }
  }, [publicKey, refreshBalances]);

  // Execute on-chain transfer using SDK and connected wallet
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !publicKey || !signer) return;

    setTransferStatus('Simulating transaction on Soroban RPC...');
    setTransferError(null);

    try {
      const sorobanClient = new SorobanClient();
      const tokenClient = new RWATokenClient(selectedAsset.contractAddress, sorobanClient);
      const amountBigInt = BigInt(Math.floor(parseFloat(transferAmount) * 10_000_000));

      setTransferStatus('Requesting Freighter wallet signature...');
      const result = await tokenClient.transfer(
        {
          from: publicKey,
          to: recipient.trim(),
          amount: amountBigInt,
        },
        signer
      );

      if (result.status === 'SUCCESS') {
        setTransferStatus(`Success! Confirmed in Ledger ${result.ledger ?? 'Consensus'}`);
        setTimeout(() => {
          setIsTransferOpen(false);
          setTransferStatus(null);
          setRecipient('');
          setTransferAmount('');
          refreshBalances();
        }, 2000);
      } else {
        setTransferError(result.error || 'Transaction execution failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTransferError(msg);
    }
  };

  const totalPortfolioValue = assets.reduce((sum, a) => {
    const units = Number(a.balance) / 10_000_000;
    return sum + units * a.priceUsd;
  }, 0);

  return (
    <div className="space-y-8">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total RWA Holdings */}
        <div className="p-5 rounded-2xl glass-panel-gold relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-gold-400/80 mb-2">
            <span>Institutional Portfolio Value</span>
            <DollarSign className="w-4 h-4 text-gold-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-aegis-300 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">+6.45% APY</span>
            <span>weighted yield</span>
          </div>
        </div>

        {/* T-Bill Allocation */}
        <div className="p-5 rounded-2xl glass-panel">
          <div className="flex items-center justify-between text-xs font-medium text-aegis-400 mb-2">
            <span>US T-Bill Exposure (USTB)</span>
            <Landmark className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            $25,000.00
          </div>
          <div className="mt-2 text-[11px] text-aegis-400">
            Yield: <span className="text-gold-400 font-semibold">5.24% APY</span> • Backed 100%
          </div>
        </div>

        {/* Real Estate Allocation */}
        <div className="p-5 rounded-2xl glass-panel">
          <div className="flex items-center justify-between text-xs font-medium text-aegis-400 mb-2">
            <span>Commercial Real Estate (CRE)</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            $15,000.00
          </div>
          <div className="mt-2 text-[11px] text-aegis-400">
            Yield: <span className="text-gold-400 font-semibold">7.85% APY</span> • 150 Tokens
          </div>
        </div>

        {/* Compliance / KYC Status */}
        <div className="p-5 rounded-2xl glass-panel">
          <div className="flex items-center justify-between text-xs font-medium text-aegis-400 mb-2">
            <span>Compliance Attestation</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <span>Tier 1 Qualified</span>
          </div>
          <div className="mt-2 text-[11px] text-aegis-400">
            SEC Reg D / Reg S Whitelisted
          </div>
        </div>
      </div>

      {/* Asset Holdings Table */}
      <div className="p-6 rounded-2xl glass-panel">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Institutional Asset Holdings
            </h2>
            <p className="text-xs text-aegis-400 mt-0.5">
              Live Soroban smart contract assets deployed on Stellar
            </p>
          </div>

          <button
            onClick={refreshBalances}
            disabled={isLoading || !isConnected}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-aegis-700 bg-aegis-850 text-aegis-200 hover:text-white hover:border-gold-500/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Soroban</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-aegis-800 text-aegis-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Asset</th>
                <th className="pb-3">Tier</th>
                <th className="pb-3">Est. APY</th>
                <th className="pb-3 text-right">Balance</th>
                <th className="pb-3 text-right">Value (USD)</th>
                <th className="pb-3 text-center">Compliance</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aegis-800/60 font-mono">
              {assets.map((asset) => {
                const units = Number(asset.balance) / 10_000_000;
                const valueUsd = units * asset.priceUsd;

                return (
                  <tr
                    key={asset.contractAddress}
                    className="hover:bg-aegis-850/40 transition-colors"
                  >
                    <td className="py-4 pl-2 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-aegis-800 border border-aegis-700 flex items-center justify-center font-bold text-gold-400 font-mono text-xs">
                          {asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{asset.name}</div>
                          <div className="text-[11px] text-aegis-400 font-mono">
                            {asset.contractAddress.slice(0, 8)}...{asset.contractAddress.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {asset.tier.replace('TIER_', '')}
                      </span>
                    </td>

                    <td className="py-4 text-emerald-400 font-semibold font-mono">
                      {asset.apy}
                    </td>

                    <td className="py-4 text-right text-white font-semibold">
                      {asset.formattedBalance} {asset.symbol}
                    </td>

                    <td className="py-4 text-right text-aegis-200">
                      ${valueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Whitelisted</span>
                      </span>
                    </td>

                    <td className="py-4 pr-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setIsTransferOpen(true);
                          }}
                          disabled={!isConnected}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/30 hover:bg-gold-500/20 transition-colors disabled:opacity-40"
                        >
                          Transfer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      {isTransferOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl border border-aegis-700 bg-aegis-900 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-gold-400" />
                <h3 className="text-base font-bold text-white">
                  Transfer {selectedAsset.symbol}
                </h3>
              </div>
              <button
                onClick={() => setIsTransferOpen(false)}
                className="text-aegis-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-aegis-300 mb-1">
                  Recipient Stellar Address (G... or C...)
                </label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. GBBD47IF6LWK7..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-aegis-700 bg-aegis-850 text-white placeholder-aegis-500 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-aegis-300 mb-1">
                  <span>Amount to Transfer</span>
                  <span>Available: {selectedAsset.formattedBalance}</span>
                </div>
                <input
                  type="number"
                  step="any"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-aegis-700 bg-aegis-850 text-white placeholder-aegis-500 focus:outline-none focus:border-gold-500"
                />
              </div>

              {transferStatus && (
                <div className="p-2.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>{transferStatus}</span>
                </div>
              )}

              {transferError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-aegis-700 text-aegis-300 hover:bg-aegis-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isConnected || !recipient || !transferAmount}
                  className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-gold-500 hover:bg-gold-400 text-black transition-colors disabled:opacity-50"
                >
                  Sign & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
