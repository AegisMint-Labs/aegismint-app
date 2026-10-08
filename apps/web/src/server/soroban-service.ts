import {
  rpc,
  Horizon,
  TransactionBuilder,
  Operation,
  Address,
  Networks,
  xdr,
  Account,
} from '@stellar/stellar-sdk';
import {
  encodeString,
  encodeAddress,
  encodeI128,
  encodeFulfillOrderArgs,
  encodeCancelOrderArgs,
  encodeCreateOrderArgs,
  encodeTransferArgs,
  encodeSetWhitelistArgs,
  STELLAR_NETWORKS,
  DEFAULT_TESTNET_CONTRACTS,
} from '@aegismint/sdk';

/**
 * Server-Side Soroban Transaction Service
 * Constructs and simulates unsigned transaction XDR for client-side signing via Freighter wallet.
 */

export interface BuildTxParams {
  userAddress: string;
  contractId: string;
  method: string;
  args?: xdr.ScVal[];
  network?: 'TESTNET' | 'MAINNET';
  baseFee?: string;
  timeoutSeconds?: number;
}

export interface BuildTxResult {
  success: boolean;
  unsignedXdr: string;
  fee: string;
  simulationStatus: string;
  minResourceFee?: string;
  error?: string;
}

export interface SubmitTxResult {
  success: boolean;
  hash: string;
  status: string;
  ledger?: number;
  resultXdr?: string;
  error?: string;
}

export class ServerSorobanTxService {
  private rpcServer: rpc.Server;
  private horizonServer: Horizon.Server;
  private networkPassphrase: string;

  constructor(network: 'TESTNET' | 'MAINNET' = 'TESTNET') {
    const config = STELLAR_NETWORKS[network] || STELLAR_NETWORKS.TESTNET;
    this.rpcServer = new rpc.Server(config.sorobanRpcUrl || 'https://soroban-testnet.stellar.org');
    this.horizonServer = new Horizon.Server(config.horizonUrl || 'https://horizon-testnet.stellar.org');
    this.networkPassphrase = config.networkPassphrase;
  }

  /**
   * Fetches the source account details, falling back to a sequence placeholder
   * if the account has not yet made a transaction.
   */
  async getSourceAccount(accountAddress: string): Promise<Account> {
    try {
      const acc = await this.rpcServer.getAccount(accountAddress);
      return acc;
    } catch {
      // Fallback to Horizon server query
      try {
        const horizonAcc = await this.horizonServer.loadAccount(accountAddress);
        return new Account(accountAddress, horizonAcc.sequenceNumber());
      } catch {
        // If brand-new account on testnet with no history yet, initialize base sequence
        return new Account(accountAddress, '1');
      }
    }
  }

  /**
   * Builds an unsigned transaction for any Soroban contract method invocation,
   * simulates it on Soroban RPC to generate footprint and fee estimates,
   * and returns the base64 unsigned transaction XDR for Freighter to sign.
   */
  async buildUnsignedContractTx(params: BuildTxParams): Promise<BuildTxResult> {
    const {
      userAddress,
      contractId,
      method,
      args = [],
      baseFee = '100',
      timeoutSeconds = 300,
    } = params;

    try {
      const sourceAccount = await this.getSourceAccount(userAddress);

      // Construct contract invocation operation
      const operation = Operation.invokeContractFunction({
        contract: contractId,
        function: method,
        args,
      });

      // Build base transaction
      const tx = new TransactionBuilder(sourceAccount, {
        fee: baseFee,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(timeoutSeconds)
        .build();

      // Simulate against Soroban RPC to inspect state changes and calculate required resources
      const simResponse = await this.rpcServer.simulateTransaction(tx);

      if (rpc.Api.isSimulationError(simResponse)) {
        return {
          success: false,
          unsignedXdr: tx.toXDR(),
          fee: baseFee,
          simulationStatus: 'ERROR',
          error: `Simulation failed: ${simResponse.error}`,
        };
      }

      // Assemble prepared transaction with footprint & resource fee
      const preparedTx = await this.rpcServer.prepareTransaction(tx);
      const minFee = simResponse.minResourceFee || '0';

      return {
        success: true,
        unsignedXdr: preparedTx.toXDR(),
        fee: preparedTx.fee,
        minResourceFee: minFee,
        simulationStatus: 'SUCCESS',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        unsignedXdr: '',
        fee: baseFee,
        simulationStatus: 'EXCEPTION',
        error: `Failed to construct transaction: ${msg}`,
      };
    }
  }

  /**
   * Builds unsigned XDR for atomic escrow order fulfillment
   */
  async buildFulfillEscrowOrderTx(params: {
    buyerOrSeller: string;
    orderId: string;
    fillAmount: bigint | number | string;
    escrowContractId?: string;
  }): Promise<BuildTxResult> {
    const contractId =
      params.escrowContractId || DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW;
    const args = encodeFulfillOrderArgs({
      orderId: params.orderId,
      buyerOrSeller: params.buyerOrSeller,
      fillAmount: params.fillAmount,
    });

    return this.buildUnsignedContractTx({
      userAddress: params.buyerOrSeller,
      contractId,
      method: 'fulfill_order',
      args,
    });
  }

  /**
   * Builds unsigned XDR for creating a new escrow order
   */
  async buildCreateEscrowOrderTx(params: {
    creator: string;
    orderId: string;
    asset: string;
    quoteAsset: string;
    amount: bigint | number | string;
    pricePerUnit: bigint | number | string;
    expirationTimestamp: number | bigint;
    escrowContractId?: string;
  }): Promise<BuildTxResult> {
    const contractId =
      params.escrowContractId || DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW;
    const args = encodeCreateOrderArgs(params);

    return this.buildUnsignedContractTx({
      userAddress: params.creator,
      contractId,
      method: 'create_order',
      args,
    });
  }

  /**
   * Builds unsigned XDR for cancelling an active escrow order
   */
  async buildCancelEscrowOrderTx(params: {
    creator: string;
    orderId: string;
    escrowContractId?: string;
  }): Promise<BuildTxResult> {
    const contractId =
      params.escrowContractId || DEFAULT_TESTNET_CONTRACTS.MARKETPLACE_ESCROW;
    const args = encodeCancelOrderArgs(params);

    return this.buildUnsignedContractTx({
      userAddress: params.creator,
      contractId,
      method: 'cancel_order',
      args,
    });
  }

  /**
   * Builds unsigned XDR for compliant RWA token transfer
   */
  async buildTokenTransferTx(params: {
    from: string;
    to: string;
    amount: bigint | number | string;
    tokenContractId: string;
  }): Promise<BuildTxResult> {
    const args = encodeTransferArgs(params.from, params.to, params.amount);

    return this.buildUnsignedContractTx({
      userAddress: params.from,
      contractId: params.tokenContractId,
      method: 'transfer',
      args,
    });
  }

  /**
   * Submits client-signed transaction XDR to Soroban RPC and polls for inclusion.
   */
  async submitSignedTransaction(
    signedXdr: string,
    maxWaitSeconds = 30
  ): Promise<SubmitTxResult> {
    try {
      const tx = TransactionBuilder.fromXDR(signedXdr, this.networkPassphrase);
      const sendResponse = await this.rpcServer.sendTransaction(tx);

      if (sendResponse.status === 'ERROR') {
        return {
          success: false,
          hash: sendResponse.hash,
          status: 'ERROR',
          error: sendResponse.errorResult?.toXDR('base64') || 'Transaction submission error',
        };
      }

      const txHash = sendResponse.hash;
      const startTime = Date.now();

      // Poll getTransaction
      while (Date.now() - startTime < maxWaitSeconds * 1000) {
        const getTx = await this.rpcServer.getTransaction(txHash);

        if (getTx.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          return {
            success: true,
            hash: txHash,
            status: 'SUCCESS',
            ledger: getTx.ledger,
            resultXdr: getTx.resultXdr?.toXDR('base64'),
          };
        } else if (getTx.status === rpc.Api.GetTransactionStatus.FAILED) {
          return {
            success: false,
            hash: txHash,
            status: 'FAILED',
            error: getTx.resultXdr?.toXDR('base64') || 'Transaction failed in ledger',
          };
        }

        // Wait 1.5 seconds between status polls
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      return {
        success: false,
        hash: txHash,
        status: 'TIMEOUT',
        error: `Transaction pending beyond ${maxWaitSeconds}s timeout`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        hash: '',
        status: 'EXCEPTION',
        error: `Failed to submit transaction: ${msg}`,
      };
    }
  }
}
