import { EscrowSettlement } from '../../components/EscrowSettlement';

export default function EscrowPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Escrow Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-gold-400 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
            <span>ATOMIC ESCROW CLEARINGHOUSE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Escrow Custody & <span className="gold-gradient-text">Settlement</span>
          </h1>
          <p className="text-sm text-aegis-300 mt-1 max-w-2xl">
            Soroban smart contract custody with multi-sig release and compliance arbitration. Guarantees Delivery vs. Payment (DvP) for secondary market transactions.
          </p>
        </div>
      </div>

      <EscrowSettlement />
    </div>
  );
}
