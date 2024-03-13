const RaydiumSwapClass = require('./RaydiumSwap.ts')
const solweb3 = require('@solana/web3.js')
const rayray = require("@raydium-io/raydium-sdk");
const b58 = require("bs58");
const dotenv = require('dotenv');
dotenv.config()

const { ApiPoolInfoV4:_ApiPoolInfoV4, MARKET_STATE_LAYOUT_V3:_MARKET_STATE_LAYOUT_V3, Market:_Market, SPL_MINT_LAYOUT:_SPL_MINT_LAYOUT }= rayray;
const sol = 'So11111111111111111111111111111111111111112' // e.g. SOLANA mint address
const raydiumBuy = async (tokenAddress, amount, slippagePercentage) =>{
  return swap(sol,tokenAddress, amount, slippagePercentage);
}

const raydiumSell = async (tokenAddress, amount, slippagePercentage) =>{
  return swap(tokenAddress, sol, amount, slippagePercentage);
}
let RPC_URL, WALLET_PRIVATE_KEY;
const initialize = (rpc, wallet)=>{
  RPC_URL = rpc;
  WALLET_PRIVATE_KEY = wallet;
}
const swap = async (tokenAAddress, tokenBAddress, tokenAAmount, slippagePercentage) => {
  const executeSwap = true // Change to true to execute swap
  const useVersionedTransaction = true // Use versioned transaction
  //const tokenAAmount = 0.01 // e.g. 0.01 SOL -> B_TOKEN

  const raydiumSwap = new RaydiumSwapClass(RPC_URL, WALLET_PRIVATE_KEY)
  console.log(`Raydium swap initialized`)

  // Trying to find pool info in the json we loaded earlier and by comparing baseMint and tokenBAddress
  let poolInfo = raydiumSwap.findPoolInfoForTokens(tokenAAddress, tokenBAddress)
  if(!poolInfo){
      // Loading with pool keys from https://api.raydium.io/v2/sdk/liquidity/mainnet.json
      await raydiumSwap.loadPoolKeys()
      console.log(`Loaded pool keys`)
  }
  poolInfo = raydiumSwap.findPoolInfoForTokens(tokenAAddress, tokenBAddress)
  console.log('Found pool info')
  if(poolInfo==undefined) return;

  if(poolInfo){
    const tx = await raydiumSwap.getSwapTransaction(
      tokenBAddress,
      tokenAAmount,
      poolInfo,
      1000000, // Max amount of lamports
      useVersionedTransaction,
      'in',
      slippagePercentage
    )
    
  if (executeSwap) {
    const txid = useVersionedTransaction
      ? await raydiumSwap.sendVersionedTransaction(tx as typeof solweb3.VersionedTransaction)
      : await raydiumSwap.sendLegacyTransaction(tx as typeof solweb3.Transaction)
     return txid;
  } else {
    const simRes = useVersionedTransaction
      ? await raydiumSwap.simulateVersionedTransaction(tx as typeof solweb3.VersionedTransaction)
      : await raydiumSwap.simulateLegacyTransaction(tx as typeof solweb3.Transaction)

    console.log(simRes)
  }
  }else{
    console.log(poolInfo)
  }


}

const getConfirmation = async(signature) =>{
  const raydiumSwap = new RaydiumSwapClass(RPC_URL, WALLET_PRIVATE_KEY)
  return raydiumSwap.getConfirmation(signature);
}

const connectionSolanaHTTPS = new solweb3.Connection(process.env.RPC_URL, { commitment: 'confirmed' })
async function callback(data: any) {
  const programId = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
  //if (!data.filters.includes('transactionsSubKey')) return undefined

  const info = data;
  if (info.meta.err !== undefined) return undefined

  const formatData: {
    slot: number, txid: string, poolInfos: typeof _ApiPoolInfoV4[]
  } = {
    slot: info.slot,
    txid: b58.encode(info.transaction.signatures[0]),
    poolInfos: []
  }

  const accounts = info.transaction.message.staticAccountKeys.map((i: Buffer) => b58.encode(i))
  for (const item of [...info.transaction.message.compiledInstructions, ...info.meta.innerInstructions.map((i: any) => i.instructions).flat()]) {
    if (accounts[item.programIdIndex] !== programId) continue

    if ([...(item.data as Buffer).values()][0] != 1) continue

    const keyIndex = [...(item.accounts as Buffer).values()]

    const [baseMintAccount, quoteMintAccount, marketAccount] = await connectionSolanaHTTPS.getMultipleAccountsInfo([
      new solweb3.PublicKey(accounts[keyIndex[8]]),
      new solweb3.PublicKey(accounts[keyIndex[9]]),
      new solweb3.PublicKey(accounts[keyIndex[16]]),
    ])

    if (baseMintAccount === null || quoteMintAccount === null || marketAccount === null) throw Error('get account info error')

    const baseMintInfo = _SPL_MINT_LAYOUT.decode(baseMintAccount.data)
    const quoteMintInfo = _SPL_MINT_LAYOUT.decode(quoteMintAccount.data)
    const marketInfo = _MARKET_STATE_LAYOUT_V3.decode(marketAccount.data)

    formatData.poolInfos.push({
      id: accounts[keyIndex[4]],
      baseMint: accounts[keyIndex[8]],
      quoteMint: accounts[keyIndex[9]],
      lpMint: accounts[keyIndex[7]],
      baseDecimals: baseMintInfo.decimals,
      quoteDecimals: quoteMintInfo.decimals,
      lpDecimals: baseMintInfo.decimals,
      version: 4,
      programId: programId,
      authority: accounts[keyIndex[5]],
      openOrders: accounts[keyIndex[6]],
      targetOrders: accounts[keyIndex[12]],
      baseVault: accounts[keyIndex[10]],
      quoteVault: accounts[keyIndex[11]],
      withdrawQueue: solweb3.PublicKey.default.toString(),
      lpVault: solweb3.PublicKey.default.toString(),
      marketVersion: 3,
      marketProgramId: marketAccount.owner.toString(),
      marketId: accounts[keyIndex[16]],
      marketAuthority: _Market.getAssociatedAuthority({ programId: marketAccount.owner, marketId: new solweb3.PublicKey(accounts[keyIndex[16]]) }).publicKey.toString(),
      marketBaseVault: marketInfo.baseVault.toString(),
      marketQuoteVault: marketInfo.quoteVault.toString(),
      marketBids: marketInfo.bids.toString(),
      marketAsks: marketInfo.asks.toString(),
      marketEventQueue: marketInfo.eventQueue.toString(),
      lookupTableAccount: solweb3.PublicKey.default.toString()
    })
  }

  console.log(formatData)

  return formatData
}



module.exports = {
  initialize,
  raydiumBuy, 
  raydiumSell,
  getConfirmation,
  callback
}
