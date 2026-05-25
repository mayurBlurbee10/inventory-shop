import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY; // Ideally store securely

export function encryptMessage(message) {
  if (!message) {
    return "";
  }
  const ciphertext = CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
  return ciphertext;
}

export function decryptMessage(ciphertext) {
  if (!ciphertext) {
    return "";
  }
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return decrypted;
}