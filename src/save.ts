import fs from 'fs';
import { PublicKey } from '@solana/web3.js';

export function save(mint: PublicKey, balance: BigInt) {
    const tokenData = fs.readFileSync("tokens.json", "utf-8");
    let dataAarray: any[] = [];
    const newData = {
        mint: mint,
        balance: balance.toString()
    };
    if ( tokenData.length > 0 ) {
         dataAarray = JSON.parse(tokenData);        
    } else dataAarray = [];
    dataAarray.push(newData);
    fs.writeFileSync("tokens.json", JSON.stringify(dataAarray, null, 2));
}