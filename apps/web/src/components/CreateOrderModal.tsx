'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  MarketplaceEscrowClient,
  DEFAULT_TESTNET_CONTRACTS,
  type OrderType,
} from '@aegismint/sdk';
import {
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Clock,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export function CreateOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
}: CreateOrderModalProps) {
  const { publicKey, signer } = useWallet();

  const [orderType, setOrderType] = useState<OrderType>('SELL');
  const [assetSymbol, setAssetSymbol] = useState('USTB');
  const [quoteSymbol, setQuoteSymbol] = useState('AUSD');
  const [amount, setAmount] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('1.00');
  const [durationDays, setDurationDays] = useState('7');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const assetAddresses: Record<string, string> = {
    USTB: DEFAULT_TESTNET_CONTRACTS.USTB_TOKEN,
    CRE: DEFAULT_TESTNET_CONTRACTS.CRE_TOKEN,
  };

  const quoteAddress = DEFAULT_TESTNET_CONTRACTS.AUSD_TOKEN;

  const totalQuoteAmount =
    amount && pricePerUnit
      ? (parseFloat(amount) * parseFloat(pricePerUnit)).toFixed(2)
      : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signer) return;

    setIsSubmitting(true);
    setStatusMsg('Simulating Soroban escrow contract call...');
    setErrorMsg(null);

    try {
      const escrowClient = new MarketplaceEscrowClient(
        DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW
      );

      const parsedAmount = BigInt(Math.floor(parseFloat(amount) * 10_000_000));
      const parsedPrice = BigInt(Math.floor(parseFloat(pricePerUnit) * 10_000_000));
      const expirationSeconds = parseInt(durationDays, 10) * 86400;

      setStatusMsg('Signing escrow order with Freighter wallet...');
      const result = await escrowClient.create_order(
        {
          creator: publicKey,
          orderType,
          assetAddress: assetAddresses[assetSymbol] || DEFAULT_TESTNET_CONTRACTS.USTB_TOKEN,
          assetSymbol,
          quoteAssetAddress: quoteAddress,
          quoteAssetSymbol: quoteSymbol,
          amount: parsedAmount,
          pricePerUnit: parsedPrice,
          expirationSeconds,
        },
        signer
      );

      if (result.status === 'SUCCESS') {
        setStatusMsg('Success! Escrow order created on Soroban.');
        setTimeout(() => {
          setIsSubmitting(false);
          setStatusMsg(null);
          onOrderCreated();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(result.error || 'Failed to submit escrow order');
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg p-6 rounded-2xl border border-aegis-700 bg-aegis-900 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create P2P Escrow Order</h3>
              <p className="text-[11px] text-aegis-400">
                Non-custodial Soroban atomic trade settlement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-aegis-400 hover:text-white text-xs font-mono"
          >
            ✕
          </button>
        </div>

        {/* Buy / Sell Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-aegis-850 border border-aegis-800 mb-5">
          <button
            type="button"
            onClick={() => setOrderType('SELL')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              orderType === 'SELL'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                : 'text-aegis-400 hover:text-white'
            }`}
          >
            Sell RWA (Offer)
          </button>
          <button
            type="button"
            onClick={() => setOrderType('BUY')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              orderType === 'BUY'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-aegis-400 hover:text-white'
            }`}
          >
            Buy RWA (Bid)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-aegis-300 mb-1">
                RWA Token
              </label>
              <select
                value={assetSymbol}
                onChange={(e) => setAssetSymbol(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-aegis-700 bg-aegis-850 text-white focus:outline-none focus:border-gold-500"
              >
                <option value="USTB">USTB (US T-Bills)</option>
                <option value="CRE">CRE (Manhattan RE)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-aegis-300 mb-1">
                Settlement Currency
              </label>
              <select
                value={quoteSymbol}
                onChange={(e) => setQuoteSymbol(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-aegis-700 bg-aegis-850 text-white focus:outline-none focus:border-gold-500"
              >
                <option value="AUSD">AUSD (Institutional USD)</option>
              </select>
            </div>
          </div>

          {/* Amount and Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-aegis-300 mb-1">
                Order Amount ({assetSymbol})
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-aegis-700 bg-aegis-850 text-white placeholder-aegis-500 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-aegis-300 mb-1">
                Price per Unit ({quoteSymbol})
              </label>
              <input
                type="number"
                step="any"
                required
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder="1.00"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-aegis-700 bg-aegis-850 text-white placeholder-aegis-500 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-aegis-300 mb-1">
              Escrow Expiration Window
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['1', '7', '30'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationDays(d)}
                  className={`py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                    durationDays === d
                      ? 'border-gold-500 bg-gold-500/10 text-gold-400 font-semibold'
                      : 'border-aegis-700 bg-aegis-850 text-aegis-400 hover:text-white'
                  }`}
                >
                  {d} {d === '1' ? 'Day' : 'Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3 rounded-xl bg-aegis-850/80 border border-aegis-800 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-aegis-400">
              <span>Total Settlement:</span>
              <span className="text-white font-bold">{totalQuoteAmount} {quoteSymbol}</span>
            </div>
            <div className="flex justify-between text-aegis-400 text-[11px]">
              <span>Escrow Lock:</span>
              <span className="text-gold-400">
                {orderType === 'SELL' ? `${amount || '0'} ${assetSymbol}` : `${totalQuoteAmount} ${quoteSymbol}`}
              </span>
            </div>
          </div>

          {statusMsg && (
            <div className="p-2.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-aegis-700 text-aegis-300 hover:bg-aegis-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || !pricePerUnit}
              className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-gold-500 hover:bg-gold-400 text-black transition-colors disabled:opacity-50"
            >
              Sign & Deposit Escrow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
