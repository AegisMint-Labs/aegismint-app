import { MarketplaceOrderbook } from '../../components/MarketplaceOrderbook';

export default function MarketplacePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Marketplace Stats */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-gold-400 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
            <span>NON-CUSTODIAL ESCROW ORDERBOOK</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            P2P Secondary <span className="gold-gradient-text">Marketplace</span>
          </h1>
          <p className="text-sm text-aegis-300 mt-1 max-w-2xl">
            Atomic settlement for Real-World Assets. Bids and asks are locked directly in the Soroban Escrow contract without intermediaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl border border-aegis-700 bg-aegis-850/60 text-xs font-mono">
            <span className="text-aegis-400">Escrow Contract: </span>
            <span className="text-gold-400 font-semibold">Verified</span>
          </div>
        </div>
      </div>

      <MarketplaceOrderbook />
    </div>
  );
}
