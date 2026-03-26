// src/utils/encryption.js
import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_CRYPTO_SECRET_KEY;

export const encryptData = (data) => {
  const cipherText = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    SECRET_KEY
  ).toString();
  return cipherText;
};

export const decryptData = (cipherText) => {
  if (!cipherText || typeof cipherText !== "string") {
    return null;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const plainText = bytes.toString(CryptoJS.enc.Utf8);
    if (!plainText) {
      return null;
    }

    const decryptedData = JSON.parse(plainText);
    return decryptedData;
  } catch {
    return null;
  }
};
