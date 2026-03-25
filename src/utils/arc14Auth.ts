import algosdk from "algosdk";
import { Buffer } from "buffer";

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (const value of bytes) {
    binary += String.fromCharCode(value);
  }

  return btoa(binary);
}

export async function makeArc14TxWithSuggestedParams(realm: string, address: string, params: algosdk.SuggestedParams) {
  const note = new TextEncoder().encode(`ARC14:${realm}:${address}`);

  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: address,
    receiver: address,
    amount: 0,
    note,
    suggestedParams: params,
  });
}

export function makeArc14AuthHeader(signedTransaction: Uint8Array): string {
  return `SigTx ${bytesToBase64(signedTransaction)}`;
}
