import {
  rpc,
  Horizon,
  TransactionBuilder,
  Operation,
  Address,
  xdr,
  Account,
} from '@stellar/stellar-sdk';
import {
  encodeFulfillOrderArgs,
  encodeCancelOrderArgs,
  encodeCreateOrderArgs,
  encodeTransferArgs,
  encodeSetWhitelistArgs,
  STELLAR_NETWORKS,
  DEFAULT_TESTNET_CONTRACTS,
} from '@aegismint/sdk';

/**
 * Server-Side Soroban Transaction Service for AegisMint Backend
 * Constructs, simulates, and prepares unsigned transaction XDR so that clients
 * (e.g. Freighter wallet) can securely sign without exposing private keys.
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

  async getSourceAccount(accountAddress: string): Promise<Account> {
    try {
      const acc = await this.rpcServer.getAccount(accountAddress);
      return acc;
    } catch {
      try {
        const horizonAcc = await this.horizonServer.loadAccount(accountAddress);
        return new Account(accountAddress, horizonAcc.sequenceNumber());
      } catch {
        return new Account(accountAddress, '1');
      }
    }
  }

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

      const operation = Operation.invokeContractFunction({
        contract: contractId,
        function: method,
        args,
      });

      const tx = new TransactionBuilder(sourceAccount, {
        fee: baseFee,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(timeoutSeconds)
        .build();

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
