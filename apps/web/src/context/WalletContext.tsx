'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  setAllowed as freighterSetAllowed,
  getPublicKey as freighterGetPublicKey,
  signTransaction as freighterSignTransaction,
  getNetwork as freighterGetNetwork,
} from '@stellar/freighter-api';
import type { WalletSigner } from '@aegismint/sdk';

export interface WalletContextState {
  publicKey: string | null;
  shortAddress: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  hasFreighter: boolean;
  network: string;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signer: WalletSigner | null;
  connectWithKey: (key: string) => void;
}

const WalletContext = createContext<WalletContextState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [hasFreighter, setHasFreighter] = useState<boolean>(false);
  const [network, setNetwork] = useState<string>('TESTNET');
  const [error, setError] = useState<string | null>(null);

  // Check Freighter availability on mount
  useEffect(() => {
    async function checkFreighter() {
      try {
        const connected = await freighterIsConnected();
        setHasFreighter(Boolean(connected));

        if (connected) {
          const allowed = await freighterIsAllowed();
          if (allowed) {
            const pk = await freighterGetPublicKey();
            if (pk) {
              setPublicKey(pk);
              setIsConnected(true);
              const net = await freighterGetNetwork();
              if (net) setNetwork(net);
            }
          }
        }
      } catch (err) {
        console.warn('Freighter detection warning:', err);
      }
    }

    checkFreighter();
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const hasExtension = await freighterIsConnected();
      if (!hasExtension) {
        setError('Freighter extension not detected. Please install Freighter from freighter.app or enter address manually.');
        setIsConnecting(false);
        return;
      }

      await freighterSetAllowed();
      const pk = await freighterGetPublicKey();
      if (!pk) {
        throw new Error('Failed to retrieve public key from Freighter');
      }

      setPublicKey(pk);
      setIsConnected(true);
      const net = await freighterGetNetwork();
      if (net) setNetwork(net);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setIsConnected(false);
    setError(null);
  }, []);

  // Manual address connection for developer testing or viewing
  const connectWithKey = useCallback((key: string) => {
    if (!key || !key.startsWith('G')) {
      setError('Invalid Stellar public key format (must start with G)');
      return;
    }
    setPublicKey(key.trim());
    setIsConnected(true);
    setError(null);
  }, []);

  // Adapt to AegisMint SDK WalletSigner
  const signer: WalletSigner | null = publicKey
    ? {
        signTransaction: async (
          xdr: string,
          opts?: { network?: string; networkPassphrase?: string; accountToSign?: string }
        ) => {
          if (hasFreighter) {
            return freighterSignTransaction(xdr, {
              network: opts?.network || 'TESTNET',
              networkPassphrase: opts?.networkPassphrase,
              accountToSign: opts?.accountToSign || publicKey,
            });
          }
          // In simulated dev environment without extension, return original XDR
          console.warn('[WalletSigner] Freighter extension not active. Returning simulated signed transaction.');
          return xdr;
        },
        getPublicKey: async () => publicKey,
      }
    : null;

  const shortAddress = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : null;

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        shortAddress,
        isConnected,
        isConnecting,
        hasFreighter,
        network,
        error,
        connect,
        disconnect,
        signer,
        connectWithKey,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextState {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
