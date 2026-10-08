import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import {
  encodeAddress,
  decodeAddress,
  encodeI128,
  decodeI128,
  encodeU128,
  decodeU128,
  encodeBool,
  decodeBool,
  encodeU32,
  decodeU32,
  encodeU64,
  decodeU64,
  encodeString,
  decodeString,
  encodeSymbol,
  decodeSymbol,
  encodeVec,
  decodeVec,
  encodeMap,
  decodeMap,
  decodeScVal,
  encodeTransferArgs,
  encodeSetWhitelistArgs,
  encodeFulfillOrderArgs,
  encode_fulfill_order,
  encodeCancelOrderArgs,
  encodeCreateOrderArgs,
} from './encoders.js';

test('XDR Encoders: Address encoding and decoding', () => {
  const accountKp = Keypair.random();
  const accountAddress = accountKp.publicKey();
  const scValAccount = encodeAddress(accountAddress);
  assert.equal(scValAccount.switch().name, 'scvAddress');
  assert.equal(decodeAddress(scValAccount), accountAddress);

  // Contract Address (C...)
  const dummyHash = Buffer.alloc(32, 7);
  const contractAddress = StrKey.encodeContract(dummyHash);
  const scValContract = encodeAddress(contractAddress);
  assert.equal(scValContract.switch().name, 'scvAddress');
  assert.equal(decodeAddress(scValContract), contractAddress);
});

test('XDR Encoders: i128 and u128 encoding and decoding', () => {
  const i128Value = 50_000_000_000_000_000_000n;
  const scValI128 = encodeI128(i128Value);
  assert.equal(scValI128.switch().name, 'scvI128');
  assert.equal(decodeI128(scValI128), i128Value);

  // From number/string
  const fromNum = encodeI128(10000000);
  assert.equal(decodeI128(fromNum), 10000000n);

  const u128Value = 18446744073709551615n;
  const scValU128 = encodeU128(u128Value);
  assert.equal(scValU128.switch().name, 'scvU128');
  assert.equal(decodeU128(scValU128), u128Value);
});

test('XDR Encoders: Boolean encoding and decoding', () => {
  const scValTrue = encodeBool(true);
  const scValFalse = encodeBool(false);
  assert.equal(scValTrue.switch().name, 'scvBool');
  assert.equal(decodeBool(scValTrue), true);
  assert.equal(decodeBool(scValFalse), false);
});

test('XDR Encoders: u32 and u64 primitives', () => {
  const scValU32 = encodeU32(42);
  assert.equal(decodeU32(scValU32), 42);

  const scValU64 = encodeU64(9876543210n);
  assert.equal(decodeU64(scValU64), 9876543210n);
});

test('XDR Encoders: String and Symbol encoding', () => {
  const scValStr = encodeString('AegisMint RWA Vault');
  assert.equal(decodeString(scValStr), 'AegisMint RWA Vault');

  const scValSym = encodeSymbol('transfer');
  assert.equal(decodeSymbol(scValSym), 'transfer');
});

test('XDR Encoders: Vectors and Maps', () => {
  const items = [encodeU32(1), encodeU32(2), encodeU32(3)];
  const vec = encodeVec(items);
  const decodedVec = decodeVec(vec, (item) => decodeU32(item));
  assert.deepEqual(decodedVec, [1, 2, 3]);

  const map = encodeMap([
    [encodeSymbol('tier'), encodeString('TIER_1_TREASURY')],
    [encodeSymbol('amount'), encodeI128(1000000n)],
  ]);
  const decodedMap = decodeMap(map);
  assert.equal(decodedMap.get('tier'), 'TIER_1_TREASURY');
  assert.equal(decodedMap.get('amount'), 1000000n);
});

test('XDR Encoders: Contract Call Argument Encoders', () => {
  const alice = Keypair.random().publicKey();
  const bob = Keypair.random().publicKey();

  // 1. Transfer args
  const transferArgs = encodeTransferArgs(alice, bob, 500000000n);
  assert.equal(transferArgs.length, 3);
  assert.equal(decodeAddress(transferArgs[0]), alice);
  assert.equal(decodeAddress(transferArgs[1]), bob);
  assert.equal(decodeI128(transferArgs[2]), 500000000n);

  // 2. Set whitelist args
  const wlArgs = encodeSetWhitelistArgs(bob, true);
  assert.equal(wlArgs.length, 2);
  assert.equal(decodeAddress(wlArgs[0]), bob);
  assert.equal(decodeBool(wlArgs[1]), true);

  // 3. Fulfill order args (Acceptance Criteria for Issue #1)
  const fulfillParams = {
    orderId: 'ORD-999',
    buyerOrSeller: bob,
    fillAmount: 25000000n,
  };
  const fulfillArgs = encodeFulfillOrderArgs(fulfillParams);
  assert.equal(fulfillArgs.length, 3);
  assert.equal(decodeString(fulfillArgs[0]), 'ORD-999');
  assert.equal(decodeAddress(fulfillArgs[1]), bob);
  assert.equal(decodeI128(fulfillArgs[2]), 25000000n);

  // Test alias encode_fulfill_order
  const aliasArgs = encode_fulfill_order(fulfillParams);
  assert.equal(aliasArgs.length, 3);
  assert.equal(decodeString(aliasArgs[0]), 'ORD-999');

  // 4. Cancel order args
  const cancelArgs = encodeCancelOrderArgs({ creator: alice, orderId: 'ORD-999' });
  assert.equal(cancelArgs.length, 2);
  assert.equal(decodeAddress(cancelArgs[0]), alice);
  assert.equal(decodeString(cancelArgs[1]), 'ORD-999');

  // 5. Create order args
  const dummyHash = Buffer.alloc(32, 1);
  const assetContract = StrKey.encodeContract(dummyHash);
  const quoteContract = StrKey.encodeContract(Buffer.alloc(32, 2));
  const createArgs = encodeCreateOrderArgs({
    orderId: 'ORD-100',
    creator: alice,
    asset: assetContract,
    quoteAsset: quoteContract,
    amount: 100000000n,
    pricePerUnit: 10000000n,
    expirationTimestamp: 1735689600,
  });
  assert.equal(createArgs.length, 7);
  assert.equal(decodeString(createArgs[0]), 'ORD-100');
  assert.equal(decodeAddress(createArgs[1]), alice);
  assert.equal(decodeAddress(createArgs[2]), assetContract);
  assert.equal(decodeAddress(createArgs[3]), quoteContract);
  assert.equal(decodeI128(createArgs[4]), 100000000n);
  assert.equal(decodeI128(createArgs[5]), 10000000n);
  assert.equal(decodeU64(createArgs[6]), 1735689600n);
});

