import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '../context/WalletContext';
import { Navigation } from '../components/Navigation';
import { DEFAULT_TESTNET_CONTRACTS } from '@aegismint/sdk';

export const metadata: Metadata = {
  title: 'AegisMint Labs | Institutional RWA & Soroban Marketplace',
  description:
    'Institutional Real-World Asset (RWA) issuance, compliance gating, and peer-to-peer escrow orderbook marketplace built on Stellar Soroban smart contracts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-aegis-950 text-aegis-100 flex flex-col font-sans selection:bg-gold-500/30 selection:text-gold-200">
        <WalletProvider>
          {/* Ambient Lighting Gradients */}
          <div className="ambient-glow-gold -top-24 -left-24" />
          <div className="ambient-glow-stellar -top-28 right-0" />

          {/* Navigation Bar */}
          <Navigation />

          {/* Main Content Area */}
          <main className="flex-1 relative z-10">{children}</main>

          {/* Institutional Protocol Footer */}
          <footer className="border-t border-aegis-800 bg-aegis-900/60 backdrop-blur-md py-8 text-xs text-aegis-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white tracking-tight">AegisMint Labs</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-aegis-800 text-aegis-300">
                      Soroban v21
                    </span>
                  </div>
                  <p className="text-aegis-500 text-[11px]">
                    Institutional Tokenization, Regulatory Whitelisting & Non-Custodial Escrow Settlement.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-aegis-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-aegis-500">Factory:</span>
                    <span className="text-aegis-200">{DEFAULT_TESTNET_CONTRACTS.ASSET_FACTORY.slice(0, 6)}...{DEFAULT_TESTNET_CONTRACTS.ASSET_FACTORY.slice(-4)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-aegis-500">Escrow:</span>
                    <span className="text-aegis-200">{DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW.slice(0, 6)}...{DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW.slice(-4)}</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
