import algosdk from "algosdk";

function getCryptoProvider(): Crypto {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    return crypto;
  }

  throw new Error("Web Crypto API is unavailable. ARC76 account derivation cannot continue.");
}

/**
 * Minimal local ARC76-compatible account derivation wrapper.
 * Produces a deterministic Algorand account from email, password, and index.
 */
export async function generateAlgorandAccount(password: string, email: string, index: number): Promise<algosdk.Account> {
  const encoder = new TextEncoder();
  const material = encoder.encode(`arc76:${email}:${password}:${index}`);
  const digest = await getCryptoProvider().subtle.digest("SHA-256", material);
  const seed = new Uint8Array(digest);
  const mnemonic = algosdk.mnemonicFromSeed(seed);

  return algosdk.mnemonicToSecretKey(mnemonic);
}
