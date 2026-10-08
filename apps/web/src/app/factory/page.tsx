import { AssetFactoryManager } from '../../components/AssetFactoryManager';

export default function FactoryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Factory Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-gold-400 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
            <span>INSTITUTIONAL ISSUANCE SUITE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Soroban Asset <span className="gold-gradient-text">Factory</span>
          </h1>
          <p className="text-sm text-aegis-300 mt-1 max-w-2xl">
            Deploy standardized Real-World Asset tokens with embedded regulatory transfer restrictions, issuer clawback capabilities, and proof-of-custody document anchors.
          </p>
        </div>
      </div>

      <AssetFactoryManager />
    </div>
  );
}
