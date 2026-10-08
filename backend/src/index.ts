import http from 'node:http';
import { ServerSorobanTxService } from './tx-builder.js';
import {
  encodeFulfillOrderArgs,
  encodeCreateOrderArgs,
  encodeCancelOrderArgs,
  encodeTransferArgs,
  encodeSetWhitelistArgs,
  encodeMintArgs,
  encodeBurnArgs,
  DEFAULT_TESTNET_CONTRACTS,
} from '@aegismint/sdk';
import { xdr } from '@stellar/stellar-sdk';

export * from './tx-builder.js';

const PORT = Number(process.env.PORT || 3001);

/**
 * Parses JSON request body asynchronously.
 */
function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Sends a JSON response with CORS headers.
 */
function sendJson(
  res: http.ServerResponse,
  statusCode: number,
  data: Record<string, unknown>
) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

export function createBackendServer() {
  const txService = new ServerSorobanTxService('TESTNET');

  return http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      return res.end();
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    // Health check
    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, {
        status: 'ok',
        service: 'aegismint-backend',
        network: 'TESTNET',
        timestamp: new Date().toISOString(),
      });
    }

    // POST /api/tx/build
    if (req.method === 'POST' && url.pathname === '/api/tx/build') {
      try {
        const body = await parseJsonBody(req);
        const {
          userAddress,
          contractId,
          method,
          params = {},
          network = 'TESTNET',
          baseFee = '100',
        } = body;

        if (!userAddress || !contractId || !method) {
          return sendJson(res, 400, {
            success: false,
            error: 'Missing required parameters: userAddress, contractId, method',
          });
        }

        let encodedArgs: xdr.ScVal[] = [];
        switch (method) {
          case 'fulfill_order':
            encodedArgs = encodeFulfillOrderArgs({
              orderId: params.orderId,
              buyerOrSeller: params.buyerOrSeller || userAddress,
              fillAmount: BigInt(params.fillAmount),
            });
            break;
          case 'create_order':
            encodedArgs = encodeCreateOrderArgs({
              orderId: params.orderId,
              creator: params.creator || userAddress,
              asset: params.asset || DEFAULT_TESTNET_CONTRACTS.USTB_TOKEN,
              quoteAsset: params.quoteAsset || DEFAULT_TESTNET_CONTRACTS.AUSD_TOKEN,
              amount: BigInt(params.amount),
              pricePerUnit: BigInt(params.pricePerUnit),
              expirationTimestamp: Number(params.expirationTimestamp || Date.now() + 86400 * 7 * 1000),
            });
            break;
          case 'cancel_order':
            encodedArgs = encodeCancelOrderArgs({
              creator: params.creator || userAddress,
              orderId: params.orderId,
            });
            break;
          case 'transfer':
            encodedArgs = encodeTransferArgs(userAddress, params.to, BigInt(params.amount));
            break;
          case 'set_whitelist':
            encodedArgs = encodeSetWhitelistArgs(params.account, Boolean(params.status));
            break;
          case 'mint':
            encodedArgs = encodeMintArgs(params.to, BigInt(params.amount));
            break;
          case 'burn':
            encodedArgs = encodeBurnArgs(userAddress, BigInt(params.amount));
            break;
          default:
            encodedArgs = [];
        }

        const service = new ServerSorobanTxService(network);
        const result = await service.buildUnsignedContractTx({
          userAddress,
          contractId,
          method,
          args: encodedArgs,
          baseFee,
        });

        return sendJson(res, result.success ? 200 : 422, result as unknown as Record<string, unknown>);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return sendJson(res, 500, { success: false, error: msg });
      }
    }

    // POST /api/escrow/fulfill
    if (req.method === 'POST' && url.pathname === '/api/escrow/fulfill') {
      try {
        const body = await parseJsonBody(req);
        const { buyerOrSeller, orderId, fillAmount, network = 'TESTNET' } = body;

        if (!buyerOrSeller || !orderId || !fillAmount) {
          return sendJson(res, 400, {
            success: false,
            error: 'Required fields: buyerOrSeller, orderId, fillAmount',
          });
        }

        const service = new ServerSorobanTxService(network);
        const result = await service.buildFulfillEscrowOrderTx({
          buyerOrSeller,
          orderId,
          fillAmount: BigInt(fillAmount),
        });

        return sendJson(res, result.success ? 200 : 422, result as unknown as Record<string, unknown>);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return sendJson(res, 500, { success: false, error: msg });
      }
    }

    // POST /api/tx/submit
    if (req.method === 'POST' && url.pathname === '/api/tx/submit') {
      try {
        const body = await parseJsonBody(req);
        const { signedXdr, network = 'TESTNET', maxWaitSeconds = 30 } = body;

        if (!signedXdr) {
          return sendJson(res, 400, {
            success: false,
            error: 'Missing required field: signedXdr',
          });
        }

        const service = new ServerSorobanTxService(network);
        const result = await service.submitSignedTransaction(signedXdr, maxWaitSeconds);

        return sendJson(res, result.success ? 200 : 400, result as unknown as Record<string, unknown>);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return sendJson(res, 500, { success: false, error: msg });
      }
    }

    // Default 404
    sendJson(res, 404, { error: 'Route not found' });
  });
}

// Start server if executed directly
if (process.argv[1]?.endsWith('dist/index.js') || process.argv[1]?.endsWith('src/index.ts')) {
  const server = createBackendServer();
  server.listen(PORT, () => {
    console.log(`[AegisMint Backend] Server listening on http://localhost:${PORT}`);
  });
}
