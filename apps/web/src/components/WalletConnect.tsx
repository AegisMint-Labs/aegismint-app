'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  Wallet,
  Check,
  Copy,
  ExternalLink,
  LogOut,
  ChevronDown,
  AlertCircle,
  Sparkles,
  KeyRound,
} from 'lucide-react';

export function WalletConnect() {
  const {
    publicKey,
    shortAddress,
    isConnected,
    isConnecting,
    hasFreighter,
    network,
    error,
    connect,
    disconnect,
    connectWithKey,
  } = useWallet();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualKey, setManualKey] = useState('');

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualKey.trim()) {
      connectWithKey(manualKey.trim());
      setShowManualModal(false);
      setManualKey('');
    }
  };

  const generateDevAccount = () => {
    // Generate valid testnet key for quick testing if user lacks Freighter
    const sampleKeys = [
      'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      'GCXMWCP6ZLLGZJMR54H4EIK7Q3DLYC2XAQJLLU2LMDQ44N7PZZR3B4GZ',
      'GDC57HYOAP4YGL6M732Y2LZZQJ4X3G2Y7K9L2M5N8Q1R4T7V9X2Z4B6D',
    ];
    const picked = sampleKeys[Math.floor(Math.random() * sampleKeys.length)];
    connectWithKey(picked);
    setShowManualModal(false);
  };

  return (
    <div className="relative">
      {!isConnected ? (
        <div className="flex items-center gap-2">
          <button
            onClick={connect}
            disabled={isConnecting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 disabled:opacity-50 hover:shadow-glow"
          >
            <Wallet className="w-4 h-4 text-aegis-950" />
            <span>{isConnecting ? 'Connecting...' : 'Connect Freighter'}</span>
          </button>

          {!hasFreighter && (
            <button
              onClick={() => setShowManualModal(true)}
              title="Manual or Test Account"
              className="p-2 text-sm font-medium transition-colors border rounded-lg text-aegis-300 border-aegis-700 hover:border-gold-500/50 hover:text-white bg-aegis-850"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all border rounded-lg glass-panel hover:border-gold-500/40 text-aegis-100"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">{shortAddress}</span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider rounded bg-gold-500/20 text-gold-400 border border-gold-500/30">
              {network}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-aegis-400 ml-0.5" />
          </button>

          {/* Account Dropdown */}
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute right-0 z-50 w-72 mt-2 p-3 rounded-xl border border-aegis-700 bg-aegis-900 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                <div className="p-2.5 rounded-lg bg-aegis-850 border border-aegis-800">
                  <div className="flex items-center justify-between text-xs text-aegis-400 mb-1">
                    <span>Connected Stellar Account</span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-gold-400 hover:text-gold-300 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-aegis-100 break-all select-all">
                    {publicKey}
                  </p>
                </div>

                <div className="mt-3 space-y-1">
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg text-aegis-300 hover:text-white hover:bg-aegis-800 transition-colors"
                  >
                    <span>View on Stellar Expert</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => {
                      disconnect();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    <span>Disconnect Wallet</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Manual Key Modal for development */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl border border-aegis-700 bg-aegis-900 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-gold-400" />
              <h3 className="text-lg font-bold text-white">Stellar Account Access</h3>
            </div>

            <p className="text-xs text-aegis-300 mb-4 leading-relaxed">
              Freighter extension was not detected in this browser session. You can install it
              from{' '}
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noreferrer"
                className="text-gold-400 underline"
              >
                freighter.app
              </a>{' '}
              or enter a Testnet Stellar public key below to explore the institutional dashboard.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-aegis-300 mb-1">
                  Stellar Public Key (G...)
                </label>
                <input
                  type="text"
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  placeholder="e.g. GBBD47IF6LWK7P7MDEVSCWR7..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-aegis-700 bg-aegis-850 text-white placeholder-aegis-500 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={generateDevAccount}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-aegis-700 text-aegis-200 hover:bg-aegis-800 transition-colors"
                >
                  Use Demo Account
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-gold-500 hover:bg-gold-400 text-black transition-colors"
                >
                  Connect Key
                </button>
              </div>
            </form>

            <button
              onClick={() => setShowManualModal(false)}
              className="mt-4 w-full text-center text-xs text-aegis-400 hover:text-aegis-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && !isConnected && (
        <div className="absolute top-full mt-2 right-0 p-2 text-xs text-rose-400 bg-rose-950/60 border border-rose-800 rounded-lg flex items-center gap-1.5 whitespace-nowrap z-30">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
