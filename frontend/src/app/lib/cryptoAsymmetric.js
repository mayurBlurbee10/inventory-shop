const isBrowser = () => typeof window !== "undefined" && typeof window.crypto !== "undefined";

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return isBrowser() ? btoa(binary) : Buffer.from(buffer).toString("base64");
}

function base64ToArrayBuffer(base64) {
  if (isBrowser()) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  const buf = Buffer.from(base64, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function pemToArrayBuffer(pem) {
  const b64Lines = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s+/g, "");
  return base64ToArrayBuffer(b64Lines);
}

async function importPublicKey(pem) {
  const keyBuffer = pemToArrayBuffer(pem);
  return await window.crypto.subtle.importKey(
    "spki",
    keyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

/**
 * Encrypts raw AES session key with RSA Public Key (RSA-OAEP 256)
 */
export async function encryptSessionKeyWithRSA(sessionKeyRaw, publicKeyPem) {
  if (!isBrowser() || !publicKeyPem) return null;
  try {
    const rsaPublicKey = await importPublicKey(publicKeyPem);
    const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      rsaPublicKey,
      sessionKeyRaw
    );
    return arrayBufferToBase64(encryptedKeyBuffer);
  } catch (err) {
    console.error("[cryptoAsymmetric] Failed to encrypt session key with RSA:", err);
    return null;
  }
}

/**
 * Encrypts API JSON data with random 32-byte AES-GCM key + RSA session key encryption
 */
export async function encryptApiPayload(data) {
  if (!isBrowser()) {
    return { payload: data, rawSessionKey: null };
  }

  const sessionKeyRaw = window.crypto.getRandomValues(new Uint8Array(32));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    sessionKeyRaw,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encoder = new TextEncoder();
  const jsonString = typeof data === "string" ? data : JSON.stringify(data);
  const dataBuffer = encoder.encode(jsonString);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128,
    },
    cryptoKey,
    dataBuffer
  );

  // WebCrypto GCM output concatenates ciphertext + 16-byte tag
  const tagLength = 16;
  const ciphertextBuffer = cipherBuffer.slice(0, cipherBuffer.byteLength - tagLength);
  const tagBuffer = cipherBuffer.slice(cipherBuffer.byteLength - tagLength);

  const publicKeyPem = process.env.NEXT_PUBLIC_SERVER_PUBLIC_KEY;
  let encryptedSessionKey = null;

  if (publicKeyPem) {
    encryptedSessionKey = await encryptSessionKeyWithRSA(sessionKeyRaw, publicKeyPem);
  }

  const payload = {
    ...(encryptedSessionKey ? { key: encryptedSessionKey } : {}),
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(ciphertextBuffer),
    tag: arrayBufferToBase64(tagBuffer),
  };

  return { payload, rawSessionKey: sessionKeyRaw };
}

/**
 * Decrypts AES-GCM response payload using the session key
 */
export async function decryptApiPayload(encryptedPayload, sessionKeyRaw) {
  if (!isBrowser() || !sessionKeyRaw || !encryptedPayload?.data || !encryptedPayload?.iv || !encryptedPayload?.tag) {
    return encryptedPayload;
  }

  try {
    const ivBuffer = base64ToArrayBuffer(encryptedPayload.iv);
    const ciphertextBuffer = base64ToArrayBuffer(encryptedPayload.data);
    const tagBuffer = base64ToArrayBuffer(encryptedPayload.tag);

    // Concatenate ciphertext + tag for WebCrypto decrypt
    const combinedBuffer = new Uint8Array(
      ciphertextBuffer.byteLength + tagBuffer.byteLength
    );
    combinedBuffer.set(new Uint8Array(ciphertextBuffer), 0);
    combinedBuffer.set(new Uint8Array(tagBuffer), ciphertextBuffer.byteLength);

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      sessionKeyRaw,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer,
        tagLength: 128,
      },
      cryptoKey,
      combinedBuffer
    );

    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedBuffer);

    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (err) {
    console.error("[cryptoAsymmetric] Decryption failed:", err);
    throw err;
  }
}
