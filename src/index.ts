import WebSocket from 'ws';
import { Keypair,  PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { buy, sell } from './buy&sell';

async function main() {
 
  dotenv.config();  

  const webSocketRpcEndpoint = process.env.RPC_WEBSOCKET_ENDPOINT;
  console.log(webSocketRpcEndpoint);
  if (!webSocketRpcEndpoint) {
    throw new Error("Missing RPC_WEBSOCKET_ENDPOINT in .env");
  }

  const rpcEndpoint = process.env.RPC_ENDPOINT;
  console.log(rpcEndpoint);
  if (!rpcEndpoint) {
    throw new Error("Missing RPC_ENDPOINT in .env");
  }

  const base58PrivateKey = process.env.MY_WALLET_PRIVATE_KEY;
  if (!base58PrivateKey) {
    throw new Error("Missing PRIVATE_KEY_BASE58 in .env");
  }  
  const secretKey = bs58.decode(base58PrivateKey);
  const payer = Keypair.fromSecretKey(secretKey);
  let buyNumber = 0;
  let sellNumber = 0;
  let success: boolean = false;
  let minT: any = ""; 
  let creatoR: any = "";
  const ws = new WebSocket(webSocketRpcEndpoint);

  interface TransactionSubscribeRequest {
    jsonrpc: string;
    id: number;
    method: string;
    params: [
      {
        failed: boolean;
        accountInclude: string[];
      },
      {
        commitment: string;
        encoding: string;
        transactionDetails: string;
        maxSupportedTransactionVersion: number;
      }
    ];
  }

  // Function to send a request to the WebSocket server
  function sendRequest(ws: WebSocket): void {
    const request: TransactionSubscribeRequest = {
      jsonrpc: "2.0",
      id: 420,
      method: "transactionSubscribe",
      params: [
        {
          failed: false,
          accountInclude: ["6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"]
        },
        {
          commitment: "processed",
          encoding: "jsonParsed",
          transactionDetails: "full",
          maxSupportedTransactionVersion: 0
        }
      ]
    };

    ws.send(JSON.stringify(request));
  }

  // When the WebSocket is open, send the subscription request
  ws.on('open', () => {
    console.log("WebSocket connection opened.");
    sendRequest(ws);
  });

  // Listen for messages
  ws.on('message', async function incoming(data) {
    const messageStr = data.toString('utf8');
    try {
      const messageObj = JSON.parse(messageStr);

      const result = messageObj.params?.result;
      const logs = result?.transaction.meta.logMessages;
      
      const signature = result?.signature; // Extract the signature
      const accountKeys = result?.transaction.transaction.message.accountKeys.map((ak: any) => ak.pubkey);
      const meta = result?.transaction.meta;
      const index = meta?.postTokenBalances[0]?.accountIndex;      
      
      if (logs && logs.some((log: any) => log.includes('Program log: Instruction: InitializeMint2')) && buyNumber == 0) {
        console.log('New pump.fun token!');
        console.log('tx:', signature);
        console.log('Creator:', accountKeys[0]);
        console.log('Token:', accountKeys[1]);
        console.log('Token Balance: ', meta?.postTokenBalances[0]?.uiTokenAmount.amount);
        console.log('Sol Balance: ', meta?.postBalances[index - 1]);
        buyNumber ++ ;
        const mint = result?.transaction.transaction.message.accountKeys[1].pubkey;
        const creator = result?.transaction.transaction.message.accountKeys[0].pubkey;  
        success =await buy(payer, new PublicKey(mint), new PublicKey(creator), BigInt(10000), 1);
        minT = new PublicKey(mint);      
        creatoR = new PublicKey(creator);
                
      }
      if (minT != "" && sellNumber == 0 && success) {    
        sellNumber ++ ;    
        console.log("waiting 3 seconds....." );      
        await new Promise(resolve => setTimeout(resolve, 3000));      
        sell(payer, minT, creatoR, BigInt(357416899));                 
      }
    } catch (e) {
      console.log(e);
    }
  });

  // Handle errors
  ws.on('error', (err) => {
    console.error("WebSocket error:", err);
  });

  // Handle close
  ws.on('close', () => {
    console.log("WebSocket connection closed.");
  });

}

main()

