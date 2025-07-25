import { PublicKey, Transaction, Connection, sendAndConfirmTransaction, Keypair } from "@solana/web3.js";
import { PumpFunSDK } from '../pump.fun/pumpfun';
import dotenv from 'dotenv';
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { AnchorProvider } from "@coral-xyz/anchor";
import { save } from "./save";

dotenv.config();
const rpcEndpoint = process.env.RPC_ENDPOINT;
const commitment = "processed";
console.log(rpcEndpoint);
if (!rpcEndpoint) {
  throw new Error("Missing RPC_ENDPOINT in .env");
}
const connection = new Connection(rpcEndpoint, commitment);

let sdk = new PumpFunSDK(new AnchorProvider(connection, new NodeWallet(new Keypair()), { commitment }));
export async function buy(payer: Keypair, mint: PublicKey, creator: PublicKey, bigint: bigint, index: number) : Promise<boolean> {
  const transaction = new Transaction();
  const buyInstruction = await sdk.getBuyInstructionsBySolAmount(payer.publicKey, mint, creator, bigint, index);
  transaction.add(...buyInstruction);
  const buySignature = await sendAndConfirmTransaction(connection, transaction, [payer], { commitment: 'processed', skipPreflight: true });
  console.log("buySignature: ", buySignature);  
  save(mint, BigInt(300));
  return true;
}

export async function sell(payer: Keypair, mint: PublicKey, creator: PublicKey, amount: bigint) {
  const sellIx = await sdk.getSellInstructionsByTokenAmount(payer.publicKey, mint, creator, amount);  
  const sellTransaction = new Transaction();
  sellTransaction.add(sellIx);
  const sellSingature = await sendAndConfirmTransaction(connection, sellTransaction, [payer], { commitment: 'confirmed', skipPreflight: true });
  console.log("sellSignature: ", sellSingature);
}