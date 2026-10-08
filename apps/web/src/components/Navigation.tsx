'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletConnect } from './WalletConnect';
import {
  ShieldCheck,
  TrendingUp,
  Coins,
  Scale,
  Activity,
  Layers,
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Portfolio & RWA', icon: Layers },
    { href: '/marketplace', label: 'P2P Orderbook', icon: TrendingUp },
    { href: '/factory', label: 'Asset Factory', icon: Coins },
    { href: '/escrow', label: 'Escrow & Settlement', icon: Scale },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-aegis-800 bg-aegis-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-amber-600 p-0.5 shadow-glow">
                <div className="flex items-center justify-center w-full h-full rounded-[10px] bg-aegis-950">
                  <ShieldCheck className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  Aegis<span className="gold-gradient-text">Mint</span>
                  <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.2 rounded bg-aegis-800 text-aegis-300 border border-aegis-700">
                    Labs
                  </span>
                </span>
                <span className="block text-[10px] text-aegis-400 font-medium tracking-wide">
                  Institutional Soroban RWA
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                      isActive
                        ? 'text-gold-400 bg-gold-500/10 border border-gold-500/30 shadow-sm'
                        : 'text-aegis-300 hover:text-white hover:bg-aegis-850 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gold-400' : 'text-aegis-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Section: Network Status & Wallet */}
          <div className="flex items-center gap-3">
            {/* Soroban Live RPC Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Soroban Testnet</span>
            </div>

            <WalletConnect />
          </div>
        </div>
      </div>
    </header>
  );
}
