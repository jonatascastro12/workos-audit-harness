import { createHash } from 'node:crypto';

export function trimToUndefined(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function maskSecret(value) {
  if (!value) return undefined;
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function stableSerialize(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(String(value));
}

export function sha256(value) {
  return createHash('sha256').update(stableSerialize(value)).digest('hex');
}

export function byteLength(value) {
  return Buffer.byteLength(stableSerialize(value), 'utf8');
}

export function truncateMetadataString(value, maxLength = 500) {
  if (typeof value !== 'string') return undefined;
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return value.slice(0, maxLength);
  return `${value.slice(0, maxLength - 3)}...`;
}
