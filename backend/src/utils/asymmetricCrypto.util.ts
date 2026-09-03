import crypto from "crypto";

/**
 * Parses and formats the server RSA private key from environment variables.
 */
export function getPrivateKey(): string {
  const privateKey = process.env.SERVER_PRIVATE_KEY || "";
  if (!privateKey) {
    throw new Error("SERVER_PRIVATE_KEY environment variable is not defined.");
  }
  return privateKey.replace(/\\n/g, "\n");
}

/**
 * Decrypts an RSA-OAEP 256 encrypted base64 session key using the server private key.
 */
export function decryptSessionKey(encryptedKeyBase64: string): Buffer {
  const privateKeyPem = getPrivateKey();
  const bufferToDecrypt = Buffer.from(encryptedKeyBase64, "base64");

    return crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      bufferToDecrypt
    );
  }

/**
 * Gets default fallback AES-256 session key derived from API_ENCRYPTION_SECRET.
 */
export function getDefaultSessionKey(): Buffer {
  const secret =
    process.env.API_ENCRYPTION_SECRET ||
    process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY ||
    "default_api_encryption_secret";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts data object/payload using AES-256-GCM with the session key.
 */
export function encryptAESPayload(
  data: any,
  sessionKeyBuffer: Buffer
): { iv: string; data: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", sessionKeyBuffer, iv);

  const jsonString = typeof data === "string" ? data : JSON.stringify(data);
  let encrypted = cipher.update(jsonString, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    data: encrypted,
    tag: tag.toString("base64"),
  };
}

/**
 * Decrypts AES-256-GCM encrypted payload using the session key.
 */
export function decryptAESPayload(
  payload: { iv: string; data: string; tag: string },
  sessionKeyBuffer: Buffer
): any {
  const iv = Buffer.from(payload.iv, "base64");
  const ciphertext = Buffer.from(payload.data, "base64");
  const tag = Buffer.from(payload.tag, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", sessionKeyBuffer, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, undefined, "utf8");
  decrypted += decipher.final("utf8");

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}

/**
 * Decrypts an incoming API request payload using hybrid asymmetric (RSA) + symmetric (AES) decryption.
 */
export function decryptApiRequest(payload: any): {
  sessionKeyBuffer: Buffer;
  decryptedData: any;
} {
  let sessionKeyBuffer: Buffer | null = null;

  if (payload && payload.key) {
    try {
      sessionKeyBuffer = decryptSessionKey(payload.key);
    } catch (err) {
      console.warn("[decryptApiRequest] RSA session key decryption failed, trying fallback default key:", err);
      sessionKeyBuffer = null;
    }
  }

  if (sessionKeyBuffer) {
    try {
      const decryptedData = decryptAESPayload(
        {
          iv: payload.iv,
          data: payload.data,
          tag: payload.tag,
        },
        sessionKeyBuffer
      );
      return { sessionKeyBuffer, decryptedData };
    } catch (err) {
      console.warn("[decryptApiRequest] Primary AES decryption failed, attempting default key fallback:", err);
    }
  }

  // Fallback to default session key
  const fallbackKey = getDefaultSessionKey();
  const decryptedData = decryptAESPayload(
    {
      iv: payload.iv,
      data: payload.data,
      tag: payload.tag,
    },
    fallbackKey
  );

  return { sessionKeyBuffer: fallbackKey, decryptedData };
}
