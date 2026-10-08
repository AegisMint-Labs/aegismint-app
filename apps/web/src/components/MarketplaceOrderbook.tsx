'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  MarketplaceEscrowClient,
  DEFAULT_TESTNET_CONTRACTS,
  type EscrowOrder,
} from '@aegismint/sdk';
import { CreateOrderModal } from './CreateOrderModal';
import {
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  RefreshCw,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Zap,
} from 'lucide-react';

export function MarketplaceOrderbook() {
  const { publicKey, isConnected, signer } = useWallet();

  const [pair, setPair] = useState<'USTB/AUSD' | 'CRE/AUSD'>('USTB/AUSD');
  const [filterType, setFilterType] = useState<'ALL' | 'SELL' | 'BUY' | 'MINE'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Active orders state
  const [orders, setOrders] = useState<EscrowOrder[]>([
    {
      id: 'ORD-101',
      creator: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      orderType: 'SELL',
      assetAddress: DEFAULT_TESTNET_CONTRACTS.USTB_TOKEN,
      assetSymbol: 'USTB',
      quoteAssetAddress: DEFAULT_TESTNET_CONTRACTS.AUSD_TOKEN,
      quoteAssetSymbol: 'AUSD',
      amount: 100_000_0000000n,
      remainingAmount: 75_000_0000000n,
      pricePerUnit: 10_0000000n, // 1.00 AUSD
      totalPrice: 100_000_0000000n,
      escrowAddress: DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW,
      escrowLockedAmount: 75_000_0000000n,
      expirationTimestamp: Date.now() + 86400 * 5 * 1000,
      status: 'OPEN',
      createdAt: Date.now() - 3600 * 4 * 1000,
    },
    {
      id: 'ORD-102',
      creator: 'GCXMWCP6ZLLGZJMR54H4EIK7Q3DLYC2XAQJLLU2LMDQ44N7PZZR3B4GZ',
      orderType: 'SELL',
      assetAddress: DEFAULT_TESTNET_CONTRACTS.USTB_TOKEN,
      assetSymbol: 'USTB',
      quoteAssetAddress: DEFAULT_TESTNET_CONTRACTS.AUSD_TOKEN,
      quoteAssetSymbol: 'AUSD',
      amount: 50_000_0000000n,
      remainingAmount: 50_000_0000000n,
      pricePerUnit: 10_0500000n, // 1.005 AUSD
      totalPrice: 50_250_0000000n,
      escrowAddress: DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW,
      escrowLockedAmount: 50_000_0000000n,
      expirationTimestamp: Date.now() + 86400 * 3 * 1000,
      status: 'OPEN',
      createdAt: Date.now() - 3600 * 2 * 1000,
    },
    {
      id: 'ORD-103',
      creator: 'GDC57HYOAP4YGL6M732Y2LZZQJ4X3G2Y7K9L2M5N8Q1R4T7V9X2Z4B6D',
      orderType: 'BUY',
      assetAddress: DEFAULT_TESTNET_CONTRACTS.USTB_TOKEN,
      assetSymbol: 'USTB',
      quoteAssetAddress: DEFAULT_TESTNET_CONTRACTS.AUSD_TOKEN,
      quoteAssetSymbol: 'AUSD',
      amount: 40_000_0000000n,
      remainingAmount: 40_000_0000000n,
      pricePerUnit: 9_9800000n, // 0.998 AUSD
      totalPrice: 39_920_0000000n,
      escrowAddress: DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW,
      escrowLockedAmount: 39_920_0000000n,
      expirationTimestamp: Date.now() + 86400 * 6 * 1000,
      status: 'OPEN',
      createdAt: Date.now() - 3600 * 1 * 1000,
    },
    {
      id: 'ORD-104',
      creator: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      orderType: 'SELL',
      assetAddress: DEFAULT_TESTNET_CONTRACTS.CRE_TOKEN,
      assetSymbol: 'CRE',
      quoteAssetAddress: DEFAULT_TESTNET_CONTRACTS.AUSD_TOKEN,
      quoteAssetSymbol: 'AUSD',
      amount: 25_0000000n,
      remainingAmount: 25_0000000n,
      pricePerUnit: 100_0000000n, // 100.00 AUSD
      totalPrice: 2500_0000000n,
      escrowAddress: DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW,
      escrowLockedAmount: 25_0000000n,
      expirationTimestamp: Date.now() + 86400 * 10 * 1000,
      status: 'OPEN',
      createdAt: Date.now() - 3600 * 8 * 1000,
    },
  ]);

  const loadOnChainOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const escrowClient = new MarketplaceEscrowClient(
        DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW
      );
      const onChainOrders = await escrowClient.list_active_orders();
      if (onChainOrders && onChainOrders.length > 0) {
        setOrders(onChainOrders);
      }
    } catch {
      // Fallback to active state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOnChainOrders();
  }, [loadOnChainOrders]);

  // Fulfill an order atomically using server-side unsigned XDR builder & Freighter signing
  const handleFulfillOrder = async (order: EscrowOrder) => {
    if (!publicKey || !signer) return;

    setActionStatus(`Constructing unsigned transaction XDR for ${order.id}...`);
    setActionError(null);

    try {
      // 1. Request unsigned transaction XDR from server API route
      let unsignedXdr: string | null = null;
      try {
        const buildRes = await fetch('/api/tx/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: publicKey,
            contractId: DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW,
            method: 'fulfill_order',
            params: {
              orderId: order.id,
              buyerOrSeller: publicKey,
              fillAmount: order.remainingAmount.toString(),
            },
          }),
        });

        if (buildRes.ok) {
          const buildData = await buildRes.json();
          if (buildData.success && buildData.unsignedXdr) {
            unsignedXdr = buildData.unsignedXdr;
          }
        }
      } catch {
        // Fallback to client-side direct simulation if API is unreachable
      }

      // 2. Client-side signing via Freighter wallet
      if (unsignedXdr) {
        setActionStatus('Requesting Freighter signature to execute atomic swap...');
        const signedTxXdr = await signer.signTransaction(unsignedXdr);
        if (!signedTxXdr) {
          throw new Error('Transaction signing was cancelled or rejected');
        }

        // 3. Submit signed transaction XDR via server submission gateway
        setActionStatus('Broadcasting signed transaction to Soroban Testnet...');
        const submitRes = await fetch('/api/tx/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signedXdr: signedTxXdr }),
        });

        const submitData = await submitRes.json();
        if (submitData.success) {
          setActionStatus(`Trade settled in Ledger ${submitData.ledger ?? 'Consensus'}! Tx: ${submitData.hash?.slice(0, 10)}...`);
          setTimeout(() => {
            setActionStatus(null);
            loadOnChainOrders();
          }, 2500);
          return;
        } else {
          throw new Error(submitData.error || 'Failed to confirm transaction on-chain');
        }
      }

      // Direct fallback via SDK client
      setActionStatus('Awaiting Freighter wallet signature...');
      const escrowClient = new MarketplaceEscrowClient(
        DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW
      );
      const result = await escrowClient.fulfill_order(
        {
          orderId: order.id,
          buyerOrSeller: publicKey,
          fillAmount: order.remainingAmount,
        },
        signer
      );

      if (result.status === 'SUCCESS') {
        setActionStatus(`Trade settled in Ledger ${result.ledger ?? 'Consensus'}!`);
        setTimeout(() => {
          setActionStatus(null);
          loadOnChainOrders();
        }, 2000);
      } else {
        setActionError(result.error || 'Failed to fulfill order');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  // Cancel order using server-side unsigned XDR builder & Freighter signing
  const handleCancelOrder = async (order: EscrowOrder) => {
    if (!publicKey || !signer) return;

    setActionStatus(`Constructing cancellation transaction for ${order.id}...`);
    setActionError(null);

    try {
      // 1. Build unsigned XDR via server API
      let unsignedXdr: string | null = null;
      try {
        const buildRes = await fetch('/api/tx/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: publicKey,
            contractId: DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW,
            method: 'cancel_order',
            params: {
              creator: publicKey,
              orderId: order.id,
            },
          }),
        });

        if (buildRes.ok) {
          const buildData = await buildRes.json();
          if (buildData.success && buildData.unsignedXdr) {
            unsignedXdr = buildData.unsignedXdr;
          }
        }
      } catch {
        // Fallback
      }

      if (unsignedXdr) {
        setActionStatus('Requesting Freighter signature to cancel escrow order...');
        const signedTxXdr = await signer.signTransaction(unsignedXdr);
        if (!signedTxXdr) {
          throw new Error('Transaction signing was cancelled or rejected');
        }

        setActionStatus('Broadcasting cancellation to Soroban Testnet...');
        const submitRes = await fetch('/api/tx/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signedXdr: signedTxXdr }),
        });

        const submitData = await submitRes.json();
        if (submitData.success) {
          setActionStatus('Order cancelled. Escrow refund confirmed on-chain.');
          setTimeout(() => {
            setActionStatus(null);
            loadOnChainOrders();
          }, 2500);
          return;
        } else {
          throw new Error(submitData.error || 'Failed to cancel order on-chain');
        }
      }

      // Direct SDK fallback
      const escrowClient = new MarketplaceEscrowClient(
        DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW
      );
      const result = await escrowClient.cancel_order(
        {
          creator: publicKey,
          orderId: order.id,
        },
        signer
      );

      if (result.status === 'SUCCESS') {
        setActionStatus('Order cancelled. Escrow refund confirmed.');
        setTimeout(() => {
          setActionStatus(null);
          loadOnChainOrders();
        }, 2000);
      } else {
        setActionError(result.error || 'Failed to cancel order');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  const currentAsset = pair.split('/')[0];

  // Filter orders by active pair & tab
  const filteredOrders = orders.filter((o) => {
    if (o.assetSymbol !== currentAsset) return false;
    if (filterType === 'SELL') return o.orderType === 'SELL';
    if (filterType === 'BUY') return o.orderType === 'BUY';
    if (filterType === 'MINE') return o.creator === publicKey;
    return true;
  });

  const sellOrders = filteredOrders
    .filter((o) => o.orderType === 'SELL')
    .sort((a, b) => Number(b.pricePerUnit - a.pricePerUnit));

  const buyOrders = filteredOrders
    .filter((o) => o.orderType === 'BUY')
    .sort((a, b) => Number(b.pricePerUnit - a.pricePerUnit));

  const maxTotalVolume = Math.max(
    ...filteredOrders.map((o) => Number(o.amount) / 10_000_000),
    1
  );

  return (
    <div className="space-y-6">
      {/* Top Controls: Pair Selector & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl bg-aegis-850 p-1 border border-aegis-800">
            {(['USTB/AUSD', 'CRE/AUSD'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPair(p)}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                  pair === p
                    ? 'bg-gold-500 text-black shadow-sm'
                    : 'text-aegis-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="h-5 w-[1px] bg-aegis-800" />

          {/* Filter Tabs */}
          <div className="flex items-center gap-1">
            {(['ALL', 'SELL', 'BUY', 'MINE'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  filterType === f
                    ? 'bg-aegis-700 text-white'
                    : 'text-aegis-400 hover:text-aegis-200'
                }`}
              >
                {f === 'MINE' ? 'My Orders' : f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadOnChainOrders}
            disabled={isLoading}
            className="p-2 text-xs font-medium rounded-lg border border-aegis-700 bg-aegis-850 text-aegis-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!isConnected}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-black transition-all shadow-md disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Escrow Order</span>
          </button>
        </div>
      </div>

      {actionStatus && (
        <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs flex items-center gap-2 animate-in fade-in">
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{actionStatus}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Dual Orderbook Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SELL ORDERS (ASKS) */}
        <div className="p-5 rounded-2xl glass-panel">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Sell Asks (Institutional Offers)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-rose-400 font-semibold">
              {sellOrders.length} Open Offers
            </span>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-5 text-[11px] font-semibold text-aegis-400 uppercase tracking-wider pb-2 border-b border-aegis-800">
              <span>Price (AUSD)</span>
              <span className="text-right">Size</span>
              <span className="text-right">Total ($)</span>
              <span className="text-center">Status</span>
              <span className="text-right">Action</span>
            </div>

            {sellOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-aegis-500 font-mono">
                No active sell offers for {pair}
              </div>
            ) : (
              sellOrders.map((order) => {
                const price = Number(order.pricePerUnit) / 10_000_000;
                const size = Number(order.remainingAmount) / 10_000_000;
                const total = price * size;
                const depthPct = Math.min((size / maxTotalVolume) * 100, 100);
                const isOwner = order.creator === publicKey;

                return (
                  <div
                    key={order.id}
                    className="relative grid grid-cols-5 items-center py-2 px-1 text-xs font-mono rounded hover:bg-aegis-800/40 transition-colors overflow-hidden"
                  >
                    {/* Visual depth fill bar */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none"
                      style={{ width: `${depthPct}%` }}
                    />

                    <span className="text-rose-400 font-semibold relative z-10">
                      ${price.toFixed(3)}
                    </span>
                    <span className="text-right text-white relative z-10">
                      {size.toLocaleString()}
                    </span>
                    <span className="text-right text-aegis-300 relative z-10">
                      ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-center relative z-10">
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {order.status}
                      </span>
                    </span>
                    <div className="text-right relative z-10">
                      {isOwner ? (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="px-2 py-0.5 text-[10px] font-bold rounded text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFulfillOrder(order)}
                          disabled={!isConnected}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-colors disabled:opacity-40"
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* BUY ORDERS (BIDS) */}
        <div className="p-5 rounded-2xl glass-panel">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Buy Bids (Institutional Demand)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              {buyOrders.length} Open Bids
            </span>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-5 text-[11px] font-semibold text-aegis-400 uppercase tracking-wider pb-2 border-b border-aegis-800">
              <span>Price (AUSD)</span>
              <span className="text-right">Size</span>
              <span className="text-right">Total ($)</span>
              <span className="text-center">Status</span>
              <span className="text-right">Action</span>
            </div>

            {buyOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-aegis-500 font-mono">
                No active buy bids for {pair}
              </div>
            ) : (
              buyOrders.map((order) => {
                const price = Number(order.pricePerUnit) / 10_000_000;
                const size = Number(order.remainingAmount) / 10_000_000;
                const total = price * size;
                const depthPct = Math.min((size / maxTotalVolume) * 100, 100);
                const isOwner = order.creator === publicKey;

                return (
                  <div
                    key={order.id}
                    className="relative grid grid-cols-5 items-center py-2 px-1 text-xs font-mono rounded hover:bg-aegis-800/40 transition-colors overflow-hidden"
                  >
                    {/* Visual depth fill bar */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none"
                      style={{ width: `${depthPct}%` }}
                    />

                    <span className="text-emerald-400 font-semibold relative z-10">
                      ${price.toFixed(3)}
                    </span>
                    <span className="text-right text-white relative z-10">
                      {size.toLocaleString()}
                    </span>
                    <span className="text-right text-aegis-300 relative z-10">
                      ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-center relative z-10">
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {order.status}
                      </span>
                    </span>
                    <div className="text-right relative z-10">
                      {isOwner ? (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="px-2 py-0.5 text-[10px] font-bold rounded text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFulfillOrder(order)}
                          disabled={!isConnected}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors disabled:opacity-40"
                        >
                          Sell
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOrderCreated={loadOnChainOrders}
      />
    </div>
  );
}
