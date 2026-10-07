import {
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';

/**
 * XDR Argument Encoders and Decoders for Stellar Soroban Smart Contracts
 * Specifically supporting AegisMint RWA Token, Asset Factory, and Marketplace Escrow contracts.
 */

/**
 * Explicitly encodes a Stellar account public key (G...) or contract address (C...) into an ScVal.
 *
 * @param address - Valid Stellar public key or contract ID StrKey
 * @returns xdr.ScVal of type scvAddress
 */
export function encodeAddress(address: string): xdr.ScVal {
  if (!address || typeof address !== 'string') {
    throw new Error(`[encodeAddress] Invalid address parameter: ${address}`);
  }
  try {
    const stellarAddress = Address.fromString(address.trim());
    return stellarAddress.toScVal();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[encodeAddress] Failed to encode address "${address}": ${message}`);
  }
}

/**
 * Explicitly decodes an ScVal containing an address back to its StrKey string representation.
 *
 * @param scVal - xdr.ScVal of type scvAddress
 * @returns StrKey address string (G... or C...)
 */
export function decodeAddress(scVal: xdr.ScVal): string {
  if (!scVal) {
    throw new Error('[decodeAddress] Provided ScVal is undefined or null');
  }
  try {
    return Address.fromScVal(scVal).toString();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[decodeAddress] Failed to decode ScVal to Address: ${message}`);
  }
}

/**
 * Explicitly encodes a signed 128-bit integer into an ScVal.
 * Widely used in Soroban tokens for balances, allowances, and amounts.
 *
 * @param value - bigint, number, or string representation of an i128
 * @returns xdr.ScVal of type scvI128
 */
export function encodeI128(value: bigint | number | string): xdr.ScVal {
  try {
    const bigVal = BigInt(value);
    return nativeToScVal(bigVal, { type: 'i128' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[encodeI128] Failed to encode i128 value "${value}": ${message}`);
  }
}

/**
 * Explicitly decodes an ScVal of type scvI128 into a native BigInt.
 *
 * @param scVal - xdr.ScVal
 * @returns bigint value
 */
export function decodeI128(scVal: xdr.ScVal): bigint {
  if (!scVal) {
    throw new Error('[decodeI128] Provided ScVal is undefined or null');
  }
  try {
    const native = scValToNative(scVal);
    if (typeof native === 'bigint') {
      return native;
    }
    if (typeof native === 'number') {
      return BigInt(native);
    }
    return BigInt(String(native));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[decodeI128] Failed to decode i128: ${message}`);
  }
}

/**
 * Explicitly encodes an unsigned 128-bit integer into an ScVal.
 *
 * @param value - bigint, number, or string representation of a u128
 * @returns xdr.ScVal of type scvU128
 */
export function encodeU128(value: bigint | number | string): xdr.ScVal {
  try {
    const bigVal = BigInt(value);
    if (bigVal < 0n) {
      throw new RangeError('u128 value cannot be negative');
    }
    return nativeToScVal(bigVal, { type: 'u128' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[encodeU128] Failed to encode u128 value "${value}": ${message}`);
  }
}

/**
 * Explicitly decodes an ScVal of type scvU128 into a native BigInt.
 *
 * @param scVal - xdr.ScVal
 * @returns bigint value
 */
export function decodeU128(scVal: xdr.ScVal): bigint {
  if (!scVal) {
    throw new Error('[decodeU128] Provided ScVal is undefined or null');
  }
  try {
    return BigInt(scValToNative(scVal));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[decodeU128] Failed to decode u128: ${message}`);
  }
}

/**
 * Explicitly encodes a boolean into an ScVal.
 *
 * @param value - boolean value
 * @returns xdr.ScVal of type scvBool
 */
export function encodeBool(value: boolean): xdr.ScVal {
  if (typeof value !== 'boolean') {
    throw new TypeError(`[encodeBool] Expected boolean, got ${typeof value}`);
  }
  return nativeToScVal(value, { type: 'bool' });
}

/**
 * Explicitly decodes an ScVal of type scvBool into a native boolean.
 *
 * @param scVal - xdr.ScVal
 * @returns boolean
 */
export function decodeBool(scVal: xdr.ScVal): boolean {
  if (!scVal) {
    throw new Error('[decodeBool] Provided ScVal is undefined or null');
  }
  try {
    const native = scValToNative(scVal);
    return Boolean(native);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[decodeBool] Failed to decode boolean: ${message}`);
  }
}

/**
 * Encodes an unsigned 32-bit integer into an ScVal.
 *
 * @param value - number
 * @returns xdr.ScVal of type scvU32
 */
export function encodeU32(value: number): xdr.ScVal {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError(`[encodeU32] Value out of range for u32: ${value}`);
  }
  return nativeToScVal(value, { type: 'u32' });
}

/**
 * Decodes an ScVal into a u32 number.
 *
 * @param scVal - xdr.ScVal
 * @returns number
 */
export function decodeU32(scVal: xdr.ScVal): number {
  if (!scVal) throw new Error('[decodeU32] ScVal is null');
  return Number(scValToNative(scVal));
}

/**
 * Encodes an unsigned 64-bit integer into an ScVal.
 *
 * @param value - bigint, number, or string
 * @returns xdr.ScVal of type scvU64
 */
export function encodeU64(value: bigint | number | string): xdr.ScVal {
  const bigVal = BigInt(value);
  if (bigVal < 0n) {
    throw new RangeError('[encodeU64] Value cannot be negative');
  }
  return nativeToScVal(bigVal, { type: 'u64' });
}

/**
 * Decodes an ScVal into a u64 bigint.
 *
 * @param scVal - xdr.ScVal
 * @returns bigint
 */
export function decodeU64(scVal: xdr.ScVal): bigint {
  if (!scVal) throw new Error('[decodeU64] ScVal is null');
  return BigInt(scValToNative(scVal));
}

/**
 * Encodes a string into an ScVal.
 *
 * @param value - string
 * @returns xdr.ScVal of type scvString
 */
export function encodeString(value: string): xdr.ScVal {
  if (typeof value !== 'string') {
    throw new TypeError(`[encodeString] Expected string, got ${typeof value}`);
  }
  return nativeToScVal(value, { type: 'string' });
}

/**
 * Decodes an ScVal into a string.
 *
 * @param scVal - xdr.ScVal
 * @returns string
 */
export function decodeString(scVal: xdr.ScVal): string {
  if (!scVal) throw new Error('[decodeString] ScVal is null');
  return String(scValToNative(scVal));
}

/**
 * Encodes a Soroban symbol (function name or identifier up to 32 characters).
 *
 * @param symbol - string identifier
 * @returns xdr.ScVal of type scvSymbol
 */
export function encodeSymbol(symbol: string): xdr.ScVal {
  if (typeof symbol !== 'string') {
    throw new TypeError(`[encodeSymbol] Expected string symbol, got ${typeof symbol}`);
  }
  return nativeToScVal(symbol, { type: 'symbol' });
}

/**
 * Decodes an ScVal symbol.
 *
 * @param scVal - xdr.ScVal
 * @returns string
 */
export function decodeSymbol(scVal: xdr.ScVal): string {
  if (!scVal) throw new Error('[decodeSymbol] ScVal is null');
  return String(scValToNative(scVal));
}

/**
 * Encodes binary data into an ScVal.
 *
 * @param bytes - Buffer or Uint8Array
 * @returns xdr.ScVal of type scvBytes
 */
export function encodeBytes(bytes: Buffer | Uint8Array): xdr.ScVal {
  return nativeToScVal(Buffer.from(bytes), { type: 'bytes' });
}

/**
 * Decodes an ScVal into a Buffer.
 *
 * @param scVal - xdr.ScVal
 * @returns Buffer
 */
export function decodeBytes(scVal: xdr.ScVal): Buffer {
  if (!scVal) throw new Error('[decodeBytes] ScVal is null');
  return Buffer.from(scValToNative(scVal));
}

/**
 * Encodes an array of ScVals into a vector ScVal.
 *
 * @param values - Array of xdr.ScVal
 * @returns xdr.ScVal of type scvVec
 */
export function encodeVec(values: xdr.ScVal[]): xdr.ScVal {
  return xdr.ScVal.scvVec(values);
}

/**
 * Decodes an ScVal vector into an array.
 *
 * @param scVal - xdr.ScVal
 * @param itemDecoder - Optional custom mapper for individual vector items
 * @returns Array of decoded elements
 */
export function decodeVec<T = unknown>(
  scVal: xdr.ScVal,
  itemDecoder?: (val: xdr.ScVal) => T
): T[] {
  if (!scVal) throw new Error('[decodeVec] ScVal is null');
  if (itemDecoder && scVal.switch().name === 'scvVec') {
    const vec = scVal.vec();
    if (!vec) return [];
    return vec.map(itemDecoder);
  }
  const native = scValToNative(scVal);
  if (!Array.isArray(native)) {
    throw new TypeError('[decodeVec] ScVal is not a vector');
  }
  return native as T[];
}

/**
 * Encodes key-value map entries into an ScVal map.
 *
 * @param entries - Array of key-value ScVal tuples
 * @returns xdr.ScVal of type scvMap
 */
export function encodeMap(entries: [xdr.ScVal, xdr.ScVal][]): xdr.ScVal {
  const mapEntries = entries.map(([k, v]) => new xdr.ScMapEntry({ key: k, val: v }));
  return xdr.ScVal.scvMap(mapEntries);
}

/**
 * Decodes an ScVal map to a JavaScript Map or Object.
 *
 * @param scVal - xdr.ScVal
 * @returns Map of decoded keys and values
 */
export function decodeMap<K = unknown, V = unknown>(scVal: xdr.ScVal): Map<K, V> {
  if (!scVal) throw new Error('[decodeMap] ScVal is null');
  const native = scValToNative(scVal);
  if (native instanceof Map) {
    return native as Map<K, V>;
  }
  if (typeof native === 'object' && native !== null) {
    const map = new Map<K, V>();
    for (const [k, v] of Object.entries(native)) {
      map.set(k as unknown as K, v as unknown as V);
    }
    return map;
  }
  throw new TypeError('[decodeMap] ScVal is not a valid map');
}

/**
 * Encodes a void / nil ScVal.
 */
export function encodeVoid(): xdr.ScVal {
  return nativeToScVal(null, { type: 'void' });
}

/**
 * High-level decoder that automatically translates any ScVal to its native JS/TS representation.
 *
 * @param scVal - xdr.ScVal
 * @returns Native JS representation
 */
export function decodeScVal<T = unknown>(scVal: xdr.ScVal): T {
  if (!scVal) return null as T;
  return scValToNative(scVal) as T;
}
