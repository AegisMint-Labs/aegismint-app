'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  AssetFactoryClient,
  DEFAULT_TESTNET_CONTRACTS,
  type AssetTier,
  type RWADeployedAsset,
} from '@aegismint/sdk';
import {
  Coins,
  ShieldCheck,
  Building,
  Plus,
  RefreshCw,
  AlertCircle,
  FileText,
  Lock,
  Unlock,
  CheckCircle,
} from 'lucide-react';

export function AssetFactoryManager() {
  const { publicKey, isConnected, signer } = useWallet();

  const [activeTab, setActiveTab] = useState<'DEPLOY' | 'REGISTRY'>('DEPLOY');

  // Form state for deploying new RWA
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [tier, setTier] = useState<AssetTier>('TIER_1_TREASURY');
  const [docHash, setDocHash] = useState('');
  const [initialSupply, setInitialSupply] = useState('1000000');
  const [whitelistRequired, setWhitelistRequired] = useState(true);
  const [kycRequired, setKycRequired] = useState(true);
  const [jurisdictions, setJurisdictions] = useState('US, EU, SG');
  const [maxHolders, setMaxHolders] = useState('500');

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deployed assets list
  const [deployedAssets, setDeployedAssets] = useState<RWADeployedAsset[]>([
    {
      contractAddress: DEFAULT_TESTNET_CONTRACTS.USTB_TOKEN,
      assetCode: 'USTB',
      assetName: 'Aegis US Treasury 4-Week T-Bill Token',
      decimals: 7,
      issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      tier: 'TIER_1_TREASURY',
      underlyingDocHash: 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      totalMinted: 100_000_000_0000000n,
      status: 'ACTIVE',
      complianceRules: {
        whitelistRequired: true,
        kycRequired: true,
        jurisdictionRestrictions: ['US', 'EU', 'UK', 'SG'],
        maxHolders: 500,
        minimumHoldDurationSeconds: 86400,
      },
      createdAt: Date.now() - 86400 * 15 * 1000,
    },
    {
      contractAddress: DEFAULT_TESTNET_CONTRACTS.CRE_TOKEN,
      assetCode: 'CRE',
      assetName: 'Manhattan Commercial Prime Fund II',
      decimals: 7,
      issuer: 'GCXMWCP6ZLLGZJMR54H4EIK7Q3DLYC2XAQJLLU2LMDQ44N7PZZR3B4GZ',
      tier: 'TIER_2_REAL_ESTATE',
      underlyingDocHash: 'ipfs://bafybeihkoviema7g3gx43z247oov6c56uf33vwt22kux553u7ffm6j4wpe',
      totalMinted: 5_000_000_0000000n,
      status: 'ACTIVE',
      complianceRules: {
        whitelistRequired: true,
        kycRequired: true,
        jurisdictionRestrictions: ['US', 'UK'],
        maxHolders: 250,
        minimumHoldDurationSeconds: 86400 * 30,
      },
      createdAt: Date.now() - 86400 * 7 * 1000,
    },
  ]);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signer) return;

    setIsSubmitting(true);
    setStatusMsg('Simulating Soroban Asset Factory deployment transaction...');
    setErrorMsg(null);

    try {
      const factoryClient = new AssetFactoryClient(DEFAULT_TESTNET_CONTRACTS.ASSET_FACTORY);

      const parsedSupply = BigInt(Math.floor(parseFloat(initialSupply) * 10_000_000));
      const jurisdictionList = jurisdictions.split(',').map((s) => s.trim());

      setStatusMsg('Signing factory transaction with Freighter...');
      const result = await factoryClient.deploy_asset(
        {
          name: name.trim(),
          symbol: symbol.trim(),
          decimals: 7,
          tier,
          underlyingDocHash: docHash.trim(),
          initialSupply: parsedSupply,
          admin: publicKey,
          complianceOfficer: publicKey,
          complianceRules: {
            whitelistRequired,
            kycRequired,
            jurisdictionRestrictions: jurisdictionList,
            maxHolders: parseInt(maxHolders, 10) || 500,
            minimumHoldDurationSeconds: 86400,
          },
        },
        signer
      );

      if (result.status === 'SUCCESS') {
        setStatusMsg('Success! RWA Asset deployed on Stellar Soroban.');
        const newAsset: RWADeployedAsset = {
          contractAddress: `CDEMO${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          assetCode: symbol.trim().toUpperCase(),
          assetName: name.trim(),
          decimals: 7,
          issuer: publicKey,
          tier,
          underlyingDocHash: docHash.trim(),
          totalMinted: parsedSupply,
          status: 'ACTIVE',
          complianceRules: {
            whitelistRequired,
            kycRequired,
            jurisdictionRestrictions: jurisdictionList,
            maxHolders: parseInt(maxHolders, 10) || 500,
            minimumHoldDurationSeconds: 86400,
          },
          createdAt: Date.now(),
        };

        setDeployedAssets([newAsset, ...deployedAssets]);
        setTimeout(() => {
          setIsSubmitting(false);
          setStatusMsg(null);
          setActiveTab('REGISTRY');
          setName('');
          setSymbol('');
          setDocHash('');
        }, 2000);
      } else {
        setErrorMsg(result.error || 'Failed to deploy asset via factory');
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  const handleTogglePause = async (asset: RWADeployedAsset) => {
    if (!publicKey || !signer) return;

    setStatusMsg(`Updating contract pause status on-chain...`);
    try {
      const factoryClient = new AssetFactoryClient(DEFAULT_TESTNET_CONTRACTS.ASSET_FACTORY);
      const isCurrentlyActive = asset.status === 'ACTIVE';

      if (isCurrentlyActive) {
        await factoryClient.pause_asset({ admin: publicKey, assetAddress: asset.contractAddress }, signer);
      } else {
        await factoryClient.unpause_asset({ admin: publicKey, assetAddress: asset.contractAddress }, signer);
      }

      setDeployedAssets(
        deployedAssets.map((a) =>
          a.contractAddress === asset.contractAddress
            ? { ...a, status: isCurrentlyActive ? 'PAUSED' : 'ACTIVE' }
            : a
        )
      );
      setStatusMsg('Status updated on Soroban.');
      setTimeout(() => setStatusMsg(null), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation sub-tabs */}
      <div className="flex items-center gap-2 border-b border-aegis-800 pb-3">
        <button
          onClick={() => setActiveTab('DEPLOY')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'DEPLOY'
              ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30'
              : 'text-aegis-400 hover:text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Deploy New RWA Token</span>
        </button>

        <button
          onClick={() => setActiveTab('REGISTRY')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'REGISTRY'
              ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30'
              : 'text-aegis-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Factory Registry ({deployedAssets.length})</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs flex items-center gap-2 animate-in fade-in">
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === 'DEPLOY' ? (
        <div className="p-6 rounded-2xl glass-panel max-w-3xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-aegis-800">
            <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Institutional Asset Tokenizer
              </h2>
              <p className="text-xs text-aegis-400">
                Deploys SEP-41 compliant smart contract with regulatory whitelisting & clawback
              </p>
            </div>
          </div>

          <form onSubmit={handleDeploy} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-aegis-300 mb-1">
                  Asset Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. London Grade A Office Fund"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-aegis-700 bg-aegis-850 text-white placeholder-aegis-500 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-aegis-300 mb-1">
                  Asset Ticker Symbol (up to 12 chars)
                </label>
                <input
                  type="text"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. LGAO"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-aegis-700 bg-aegis-850 text-white placeholder-aegis-500 focus:outline-none focus:border-gold-500 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-aegis-300 mb-1">
                  Asset Classification Tier
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as AssetTier)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-aegis-700 bg-aegis-850 text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="TIER_1_TREASURY">Tier 1: US Treasuries / Sovereigns</option>
                  <option value="TIER_2_REAL_ESTATE">Tier 2: Commercial Real Estate</option>
                  <option value="TIER_3_PRIVATE_CREDIT">Tier 3: Secured Private Credit</option>
                  <option value="TIER_4_COMMODITY">Tier 4: Gold & Physical Reserves</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-aegis-300 mb-1">
                  Initial Issuance Supply
                </label>
                <input
                  type="number"
                  required
                  value={initialSupply}
                  onChange={(e) => setInitialSupply(e.target.value)}
                  placeholder="1000000"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-aegis-700 bg-aegis-850 text-white placeholder-aegis-500 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-aegis-300 mb-1">
                Custody Proof Document (IPFS URI or SHA256 Hash)
              </label>
              <input
                type="text"
                required
                value={docHash}
                onChange={(e) => setDocHash(e.target.value)}
                placeholder="ipfs://bafybeig... or sha256:7f83b165..."
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-aegis-700 bg-aegis-850 text-white placeholder-aegis-500 focus:outline-none focus:border-gold-500"
              />
            </div>

            {/* Compliance Rules Box */}
            <div className="p-4 rounded-xl bg-aegis-850/80 border border-aegis-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gold-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Regulatory Whitelisting Parameters</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-xs text-aegis-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whitelistRequired}
                    onChange={(e) => setWhitelistRequired(e.target.checked)}
                    className="rounded border-aegis-700 text-gold-500 focus:ring-gold-500"
                  />
                  <span>Require On-Chain Whitelist</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-aegis-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kycRequired}
                    onChange={(e) => setKycRequired(e.target.checked)}
                    className="rounded border-aegis-700 text-gold-500 focus:ring-gold-500"
                  />
                  <span>Enforce Institutional KYC</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-aegis-400 mb-1">
                    Allowed Jurisdictions (comma separated)
                  </label>
                  <input
                    type="text"
                    value={jurisdictions}
                    onChange={(e) => setJurisdictions(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-aegis-700 bg-aegis-900 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-aegis-400 mb-1">
                    Max Qualified Holders Limit
                  </label>
                  <input
                    type="number"
                    value={maxHolders}
                    onChange={(e) => setMaxHolders(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-aegis-700 bg-aegis-900 text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isConnected || !name || !symbol || !docHash}
              className="w-full py-3 text-xs font-bold rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-black transition-all shadow-md disabled:opacity-50"
            >
              Sign & Deploy RWA Contract via Factory
            </button>
          </form>
        </div>
      ) : (
        <div className="p-6 rounded-2xl glass-panel">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Registered Institutional RWAs
              </h2>
              <p className="text-xs text-aegis-400">
                Contracts registered in Factory ({DEFAULT_TESTNET_CONTRACTS.ASSET_FACTORY.slice(0, 8)}...)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {deployedAssets.map((asset) => (
              <div
                key={asset.contractAddress}
                className="p-4 rounded-xl bg-aegis-850/80 border border-aegis-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{asset.assetName}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold-500/20">
                      {asset.assetCode}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {asset.tier.replace('TIER_', '')}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-aegis-400 flex flex-wrap items-center gap-3 mt-1">
                    <span>Address: {asset.contractAddress.slice(0, 10)}...{asset.contractAddress.slice(-6)}</span>
                    <span>•</span>
                    <span>Holders: max {asset.complianceRules.maxHolders}</span>
                    <span>•</span>
                    <span>Jurisdictions: {asset.complianceRules.jurisdictionRestrictions.join(', ')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 ${
                      asset.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {asset.status === 'ACTIVE' ? <CheckCircle className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{asset.status}</span>
                  </span>

                  <button
                    onClick={() => handleTogglePause(asset)}
                    disabled={!isConnected}
                    className="p-2 text-xs font-medium rounded-lg border border-aegis-700 bg-aegis-800 text-aegis-300 hover:text-white transition-colors disabled:opacity-40"
                    title={asset.status === 'ACTIVE' ? 'Pause Contract' : 'Unpause Contract'}
                  >
                    {asset.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
