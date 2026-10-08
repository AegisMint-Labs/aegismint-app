'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  MarketplaceEscrowClient,
  DEFAULT_TESTNET_CONTRACTS,
  type EscrowOrder,
} from '@aegismint/sdk';
import {
  Scale,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  AlertCircle,
  Lock,
} from 'lucide-react';

export function EscrowSettlement() {
  const { publicKey, isConnected, signer } = useWallet();

  const [escrows, setEscrows] = useState<EscrowOrder[]>([
    {
      id: 'ESC-401',
      creator: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      orderType: 'SELL',
      assetAddress: DEFAULT_TESTNET_CONTRACTS.USTB_TOKEN,
      assetSymbol: 'USTB',
      quoteAssetAddress: DEFAULT_TESTNET_CONTRACTS.AUSD_TOKEN,
      quoteAssetSymbol: 'AUSD',
      amount: 50_000_0000000n,
      remainingAmount: 0n,
      pricePerUnit: 10_0000000n,
      totalPrice: 50_000_0000000n,
      escrowAddress: DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW,
      escrowLockedAmount: 50_000_0000000n,
      expirationTimestamp: Date.now() + 86400 * 2 * 1000,
      status: 'ESCROW_LOCKED',
      counterparty: 'GDC57HYOAP4YGL6M732Y2LZZQJ4X3G2Y7K9L2M5N8Q1R4T7V9X2Z4B6D',
      createdAt: Date.now() - 3600 * 6 * 1000,
    },
    {
      id: 'ESC-402',
      creator: 'GCXMWCP6ZLLGZJMR54H4EIK7Q3DLYC2XAQJLLU2LMDQ44N7PZZR3B4GZ',
      orderType: 'BUY',
      assetAddress: DEFAULT_TESTNET_CONTRACTS.CRE_TOKEN,
      assetSymbol: 'CRE',
      quoteAssetAddress: DEFAULT_TESTNET_CONTRACTS.AUSD_TOKEN,
      quoteAssetSymbol: 'AUSD',
      amount: 10_0000000n,
      remainingAmount: 10_0000000n,
      pricePerUnit: 100_0000000n,
      totalPrice: 1000_0000000n,
      escrowAddress: DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW,
      escrowLockedAmount: 1000_0000000n,
      expirationTimestamp: Date.now() - 3600 * 1000,
      status: 'DISPUTED',
      counterparty: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      disputeReason: 'Off-chain regulatory jurisdiction clearance pending under Sanctions Act',
      createdAt: Date.now() - 86400 * 3 * 1000,
    },
  ]);

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClaim = async (escrow: EscrowOrder) => {
    if (!publicKey || !signer) return;

    setStatusMsg(`Simulating claim for ${escrow.id}...`);
    setErrorMsg(null);

    try {
      const client = new MarketplaceEscrowClient(DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW);
      setStatusMsg('Requesting Freighter signature for escrow release...');
      const result = await client.claim_escrow(
        { claimant: publicKey, orderId: escrow.id },
        signer
      );

      if (result.status === 'SUCCESS') {
        setStatusMsg('Escrow funds successfully claimed and released.');
        setEscrows(
          escrows.map((e) => (e.id === escrow.id ? { ...e, status: 'FILLED' } : e))
        );
        setTimeout(() => setStatusMsg(null), 2500);
      } else {
        setErrorMsg(result.error || 'Failed to claim escrow');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  const handleResolveDispute = async (escrow: EscrowOrder, awardToCreator: boolean) => {
    if (!publicKey || !signer) return;

    setStatusMsg(`Arbitrating dispute for ${escrow.id}...`);
    setErrorMsg(null);

    try {
      const client = new MarketplaceEscrowClient(DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW);
      const result = await client.resolve_dispute(
        {
          arbitrator: publicKey,
          orderId: escrow.id,
          awardToCreator,
        },
        signer
      );

      if (result.status === 'SUCCESS') {
        setStatusMsg('Dispute resolved and collateral awarded.');
        setEscrows(
          escrows.map((e) => (e.id === escrow.id ? { ...e, status: 'FILLED' } : e))
        );
        setTimeout(() => setStatusMsg(null), 2500);
      } else {
        setErrorMsg(result.error || 'Failed to resolve dispute');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel">
          <div className="flex items-center justify-between text-xs text-aegis-400 mb-1">
            <span>Locked in Soroban Escrow</span>
            <Lock className="w-4 h-4 text-gold-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">$51,000.00</div>
          <div className="text-[11px] text-aegis-400 mt-1">
            Smart Contract: {DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW.slice(0, 10)}...
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel">
          <div className="flex items-center justify-between text-xs text-aegis-400 mb-1">
            <span>Settled P2P Swaps (30D)</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">1,482 Trades</div>
          <div className="text-[11px] text-emerald-400 mt-1">100% Atomic Delivery vs Payment</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel">
          <div className="flex items-center justify-between text-xs text-aegis-400 mb-1">
            <span>Under Arbitration</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">1 Case</div>
          <div className="text-[11px] text-aegis-400 mt-1">Reg S Compliance Review</div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs flex items-center gap-2 animate-in fade-in">
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Escrow Active Table */}
      <div className="p-6 rounded-2xl glass-panel">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Active Escrow Custody Records
            </h2>
            <p className="text-xs text-aegis-400">
              Smart contract locks awaiting counterparty execution or institutional claim
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {escrows.map((item) => {
            const size = Number(item.amount) / 10_000_000;
            const price = Number(item.pricePerUnit) / 10_000_000;
            const total = (Number(item.totalPrice) / 10_000_000).toLocaleString();

            return (
              <div
                key={item.id}
                className="p-5 rounded-xl bg-aegis-850/80 border border-aegis-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-aegis-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-white text-xs">{item.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono bg-gold-500/10 text-gold-400 border border-gold-500/20">
                      {item.orderType} {item.assetSymbol}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono ${
                        item.status === 'DISPUTED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : item.status === 'FILLED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-aegis-400">
                    Settlement: <span className="text-white font-bold">${total} {item.quoteAssetSymbol}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-aegis-500 block text-[11px]">Creator / Depositor</span>
                    <span className="text-aegis-200 break-all">{item.creator}</span>
                  </div>
                  <div>
                    <span className="text-aegis-500 block text-[11px]">Counterparty</span>
                    <span className="text-aegis-200 break-all">{item.counterparty || 'Open Market'}</span>
                  </div>
                </div>

                {item.disputeReason && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Dispute Filed: </span>
                      <span>{item.disputeReason}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-aegis-800/80">
                  {item.status === 'ESCROW_LOCKED' && (
                    <button
                      onClick={() => handleClaim(item)}
                      disabled={!isConnected}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
                    >
                      Claim Escrow Release
                    </button>
                  )}

                  {item.status === 'DISPUTED' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolveDispute(item, true)}
                        disabled={!isConnected}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-aegis-700 bg-aegis-800 text-aegis-200 hover:text-white transition-colors disabled:opacity-40"
                      >
                        Award Depositor
                      </button>
                      <button
                        onClick={() => handleResolveDispute(item, false)}
                        disabled={!isConnected}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gold-500/20 text-gold-400 border border-gold-500/30 hover:bg-gold-500/30 transition-colors disabled:opacity-40"
                      >
                        Award Counterparty
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
