const RaydiumSwapClass = require('./RaydiumSwap.ts')
const solweb3 = require('@solana/web3.js')

const sol = 'So11111111111111111111111111111111111111112' // e.g. SOLANA mint address
const raydiumBuy = async (tokenAddress, amount, slippagePercentage) =>{
  await swap(sol,tokenAddress, amount, slippagePercentage);
}

const raydiumSell = async (tokenAddress, amount, slippagePercentage) =>{
  await swap(tokenAddress, sol, amount, slippagePercentage);
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

  // Loading with pool keys from https://api.raydium.io/v2/sdk/liquidity/mainnet.json
  await raydiumSwap.loadPoolKeys()
  console.log(`Loaded pool keys`)

  // Trying to find pool info in the json we loaded earlier and by comparing baseMint and tokenBAddress
  const poolInfo = raydiumSwap.findPoolInfoForTokens(tokenAAddress, tokenBAddress)
  console.log('Found pool info')

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

    console.log (`https://solscan.io/tx/${txid}`)
  } else {
    const simRes = useVersionedTransaction
      ? await raydiumSwap.simulateVersionedTransaction(tx as typeof solweb3.VersionedTransaction)
      : await raydiumSwap.simulateLegacyTransaction(tx as typeof solweb3.Transaction)

    console.log(simRes)
  }
}

module.exports = {
  initialize,
  raydiumBuy, 
  raydiumSell
}