import {
  Account,
  Contract,
  Keypair,
  Transaction,
  TransactionBuilder,
  rpc,
  xdr,
} from '@stellar/stellar-sdk';
import { TESTNET_CONFIG } from './constants.js';
import type {
  ContractExecutionResult,
  ContractSimulationResult,
  SorobanNetworkConfig,
  WalletSigner,
} from './types.js';

export interface SimulateCallOptions {
  contractId: string;
  method: string;
  args?: xdr.ScVal[];
  caller?: string;
}

export interface InvokeOptions {
  contractId: string;
  method: string;
  args?: xdr.ScVal[];
  caller: string;
  signer: WalletSigner;
  fee?: string;
  timeoutSeconds?: number;
}

/**
 * Soroban RPC Client
 * Provides robust transaction construction, resource simulation,
 * wallet signature integration, and status polling for AegisMint smart contracts.
 */
export class SorobanClient {
  public readonly server: rpc.Server;
  public readonly networkConfig: SorobanNetworkConfig;

  constructor(networkConfig: SorobanNetworkConfig = TESTNET_CONFIG) {
    this.networkConfig = networkConfig;
    this.server = new rpc.Server(networkConfig.rpcUrl, {
      allowHttp: networkConfig.rpcUrl.startsWith('http://'),
    });
  }

  /**
   * Simulates a Soroban contract method call (Read-only query or pre-flight check)
   */
  async simulateCall<T = unknown>(
    options: SimulateCallOptions
  ): Promise<ContractSimulationResult<T>> {
    const { contractId, method, args = [], caller } = options;

    // Use caller public key or generate a throwaway address for read-only invocation simulation
    const sourceAddress = caller || Keypair.random().publicKey();

    let account: Account;
    try {
      account = await this.server.getAccount(sourceAddress);
    } catch {
      // Fallback for simulation when account has not been funded on-chain
      account = new Account(sourceAddress, '0');
    }

    const contract = new Contract(contractId);
    const contractCallOp = contract.call(method, ...args);

    const tx = new TransactionBuilder(account, {
      fee: '1000',
      networkPassphrase: this.networkConfig.networkPassphrase,
    })
      .addOperation(contractCallOp)
      .setTimeout(30)
      .build();

    const simRes = await this.server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simRes)) {
      return {
        success: false,
        cost: {
          cpuInstructions: 0,
          memoryBytes: 0,
        },
        error: simRes.error || 'Contract simulation failed',
      };
    }

    if (rpc.Api.isSimulationSuccess(simRes)) {
      const retval = simRes.result?.retval;
      return {
        success: true,
        rawReturnValue: retval,
        cost: {
          cpuInstructions: Number(simRes.cost?.cpuInsns || 0),
          memoryBytes: Number(simRes.cost?.memBytes || 0),
        },
        minResourceFee: simRes.minResourceFee,
      };
    }

    return {
      success: false,
      cost: {
        cpuInstructions: 0,
        memoryBytes: 0,
      },
      error: 'Unknown simulation response state',
    };
  }

  /**
   * Invokes a Soroban contract method on-chain:
   * 1. Constructs transaction
   * 2. Simulates & prepares transaction (sets footprint & resource fee)
   * 3. Requests signature from wallet signer
   * 4. Submits to Soroban RPC
   * 5. Polls until transaction reaches terminal state
   */
  async invoke<T = unknown>(options: InvokeOptions): Promise<ContractExecutionResult<T>> {
    const {
      contractId,
      method,
      args = [],
      caller,
      signer,
      fee = '10000',
      timeoutSeconds = 60,
    } = options;

    if (!caller) {
      throw new Error('[SorobanClient.invoke] Caller address is required');
    }

    // 1. Fetch current sequence number for caller
    const sourceAccount = await this.server.getAccount(caller);

    // 2. Build preliminary contract call transaction
    const contract = new Contract(contractId);
    const contractCallOp = contract.call(method, ...args);

    const initialTx = new TransactionBuilder(sourceAccount, {
      fee,
      networkPassphrase: this.networkConfig.networkPassphrase,
    })
      .addOperation(contractCallOp)
      .setTimeout(timeoutSeconds)
      .build();

    // 3. Prepare transaction via Soroban RPC (simulates, resolves auth, attaches storage footprint & resource fees)
    const preparedTx = await this.server.prepareTransaction(initialTx);

    // 4. Request signature from the wallet
    const preparedXdr = preparedTx.toXDR();
    const signedXdr = await signer.signTransaction(preparedXdr, {
      network: 'TESTNET',
      networkPassphrase: this.networkConfig.networkPassphrase,
      accountToSign: caller,
    });

    const finalTx = TransactionBuilder.fromXDR(
      signedXdr,
      this.networkConfig.networkPassphrase
    ) as Transaction;

    // 5. Submit transaction to Soroban RPC
    const submitResponse = await this.server.sendTransaction(finalTx);

    if (submitResponse.status === 'ERROR') {
      const errorMsg =
        submitResponse.errorResult?.toXDR('hex') || 'Transaction submission rejected by RPC';
      return {
        status: 'FAILED',
        transactionHash: submitResponse.hash,
        error: errorMsg,
      };
    }

    // 6. Poll for completion
    const txHash = submitResponse.hash;
    const result = await this.pollTransaction(txHash, 30, 2000);

    return result as ContractExecutionResult<T>;
  }

  /**
   * Polls Soroban RPC for transaction status until SUCCESS or FAILED
   */
  public async pollTransaction(
    hash: string,
    maxAttempts = 30,
    delayMs = 2000
  ): Promise<ContractExecutionResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await this.server.getTransaction(hash);

      if (response.status === 'SUCCESS') {
        return {
          status: 'SUCCESS',
          transactionHash: hash,
          ledger: response.latestLedger,
          rawReturnValue: response.returnValue,
        };
      }

      if (response.status === 'FAILED') {
        return {
          status: 'FAILED',
          transactionHash: hash,
          ledger: response.latestLedger,
          error: response.resultXdr?.toXDR('hex') || 'Transaction execution failed on-chain',
        };
      }

      // If status is NOT_FOUND, transaction is still pending in ledger consensus
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return {
      status: 'PENDING',
      transactionHash: hash,
      error: `Transaction confirmation timed out after ${maxAttempts * (delayMs / 1000)} seconds`,
    };
  }

  /**
   * Requests testnet XLM via Friendbot
   */
  async fundTestnetAccount(address: string): Promise<boolean> {
    const friendbotUrl = this.networkConfig.friendbotUrl || 'https://friendbot.stellar.org';
    try {
      const response = await fetch(`${friendbotUrl}?addr=${encodeURIComponent(address)}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Helper to fetch account balances and sequence
   */
  async getAccount(address: string): Promise<Account> {
    return this.server.getAccount(address);
  }

  /**
   * Fetch current ledger number
   */
  async getLatestLedger(): Promise<number> {
    const res = await this.server.getLatestLedger();
    return res.sequence;
  }
}
