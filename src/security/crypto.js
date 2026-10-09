const encoder = new TextEncoder();

export const toBase64 = bytes => {
  const value = new Uint8Array(bytes); let text = '';
  for (let offset = 0; offset < value.length; offset += 8192) text += String.fromCharCode(...value.subarray(offset, offset + 8192));
  return btoa(text);
};

export const fromBase64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
const aad = (vaultId, recordId) => encoder.encode(JSON.stringify(['AgriPulse:v1', vaultId, recordId]));
export async function encrypt(key, vaultId, recordId, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(vaultId, recordId) }, key, encoder.encode(JSON.stringify(data)));
  return { algorithm: 'AES-256-GCM', keyId: vaultId, iv: toBase64(iv), ciphertext: toBase64(ciphertext) };
}

export async function decrypt(key, vaultId, recordId, envelope) {
  if (envelope.keyId !== vaultId || envelope.algorithm !== 'AES-256-GCM') throw new Error('Incorrect vault.');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(envelope.iv), additionalData: aad(vaultId, recordId) }, key, fromBase64(envelope.ciphertext));
  return JSON.parse(new TextDecoder().decode(plain));
}

async function wrappingKey(passphrase, vault) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: fromBase64(vault.salt), iterations: vault.iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey']);
}

export async function createVault(passphrase) {
  if (passphrase.length < 12) throw new Error('Use a passphrase of at least 12 characters. Keep it safe: we cannot recover it.');
  const vault = { id: crypto.randomUUID(), kdf: 'PBKDF2-SHA256', iterations: 600000, salt: toBase64(crypto.getRandomValues(new Uint8Array(16))) };
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrapped = await crypto.subtle.wrapKey('raw', key, await wrappingKey(passphrase, vault), { name: 'AES-GCM', iv, additionalData: aad(vault.id, 'vault-key') });
  vault.wrappedKey = { algorithm: 'AES-256-GCM', keyId: vault.id, iv: toBase64(iv), ciphertext: toBase64(wrapped) };
  return { vault, key: await unlockVault(passphrase, vault) };
}

export async function unlockVault(passphrase, vault) {
  if (vault.kdf !== 'PBKDF2-SHA256' || vault.iterations !== 600000) throw new Error('Unsupported vault format.');
  try {
    return await crypto.subtle.unwrapKey('raw', fromBase64(vault.wrappedKey.ciphertext), await wrappingKey(passphrase, vault), { name: 'AES-GCM', iv: fromBase64(vault.wrappedKey.iv), additionalData: aad(vault.id, 'vault-key') }, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  } catch { throw new Error('Passphrase incorrect or vault damaged.'); }
}
