import CryptoJS from "crypto-js";

const SECRET_KEY =
  process.env.CRYPTO_SECRET_KEY || "default-secret-key-change-in-production";

export function encryptMessage(message: string): string {
  if (!message) {
    return "";
  }
  const ciphertext = CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
  return ciphertext;
}

export function decryptMessage(ciphertext: string): string {
  if (!ciphertext) {
    return "";
  }
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return decrypted;
}

