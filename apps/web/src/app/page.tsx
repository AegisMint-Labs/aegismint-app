import { RWADashboard } from '../components/RWADashboard';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome & Institutional Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-gold-400 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
            <span>INSTITUTIONAL ASSET CONSOLE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Real-World Asset <span className="gold-gradient-text">Portfolio</span>
          </h1>
          <p className="text-sm text-aegis-300 mt-1 max-w-2xl">
            Tokenized US Treasuries, institutional private credit, and commercial real estate backed by SEC Reg D compliance gating and atomic Soroban settlement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg border border-aegis-700 bg-aegis-850/60 text-xs text-aegis-300 font-mono">
            Protocol Latency: <span className="text-emerald-400 font-semibold">1.8s</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Component */}
      <RWADashboard />
    </div>
  );
}
