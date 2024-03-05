const { buildSimpleTransaction, SPL_ACCOUNT_LAYOUT: SPL_ACCOUNT_LAYOUT2, VersionedTransaction:VersionedTransaction2, findProgramAddress, InnerSimpleV0Transaction, TOKEN_PROGRAM_ID :TOKEN_PROGRAM_ID2} = require("@raydium-io/raydium-sdk");
const Types = require("@raydium-io/raydium-sdk");
//const {makeTxVersion, addLookupTableInfo} = require ("./config");

const { 
  SendOptions, 
  Signer, 
} = require('@solana/web3.js');

async function sendTx(connection:any, payer:any, txs:any, options:any) {
  const txids:any[] = [];
  for (const iTx of txs) {
    if (iTx instanceof VersionedTransaction2) {
      iTx.sign([payer]);
      txids.push(await connection.sendTransaction(iTx, [payer], options));
    } else {
      txids.push(await connection.sendTransaction(iTx, [payer], options));
    }
  }
  return txids;
}

async function getWalletTokenAccount(connection:any, wallet:any) {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID2,
  });
  return walletTokenAccount.value.map((i:any) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT2.decode(i.account.data),
  }));
}

async function buildAndSendTx(innerSimpleV0Transaction: typeof InnerSimpleV0Transaction[], options?: typeof SendOptions) {
  const willSendTx = await buildSimpleTransaction({
    connection,
    makeTxVersion: 1,
    payer: wallet.publicKey,
    innerTransactions: innerSimpleV0Transaction,
    addLookupTableInfo: addLookupTableInfo,
  })

  return await sendTx(connection, wallet, willSendTx, options)
}

function getATAAddress(programId:any, owner:any, mint:any) {
  const { publicKey, nonce } = findProgramAddress(
    [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
    TOKEN_PROGRAM_ID2
  );
  return { publicKey, nonce };
}

async function sleepTime(ms:any) {
  console.log((new Date()).toLocaleString(), 'sleepTime', ms)
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { sendTx, getWalletTokenAccount, buildAndSendTx, getATAAddress, sleepTime };
