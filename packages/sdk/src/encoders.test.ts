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
