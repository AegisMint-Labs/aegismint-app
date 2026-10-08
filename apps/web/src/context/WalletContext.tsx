'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  setAllowed as freighterSetAllowed,
  getAddress as freighterGetAddress,
  requestAccess as freighterRequestAccess,
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
        const res = await freighterIsConnected();
        const connected = res?.isConnected ?? false;
        setHasFreighter(Boolean(connected));

        if (connected) {
          const allowedRes = await freighterIsAllowed();
          if (allowedRes?.isAllowed) {
            const addrRes = await freighterGetAddress();
            if (addrRes?.address) {
              setPublicKey(addrRes.address);
              setIsConnected(true);
              const netRes = await freighterGetNetwork();
              if (netRes?.network) setNetwork(netRes.network);
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
      const connRes = await freighterIsConnected();
      if (!connRes?.isConnected) {
        setError('Freighter extension not detected. Please install Freighter from freighter.app or enter address manually.');
        setIsConnecting(false);
        return;
      }

      await freighterSetAllowed();
      const accessRes = await freighterRequestAccess();
      if (accessRes?.error || !accessRes?.address) {
        throw new Error(accessRes?.error || 'Failed to retrieve public key from Freighter');
      }

      setPublicKey(accessRes.address);
      setIsConnected(true);
      const netRes = await freighterGetNetwork();
      if (netRes?.network) setNetwork(netRes.network);
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
            const signRes = await freighterSignTransaction(xdr, {
              networkPassphrase: opts?.networkPassphrase,
              address: opts?.accountToSign || publicKey,
            });
            if (signRes?.error) {
              throw new Error(signRes.error);
            }
            return signRes.signedTxXdr;
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
