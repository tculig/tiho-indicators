const RaydiumSwapClass = require('./RaydiumSwap.ts')
const formatAMM = require('./v1demo/formatAmmKeysById.ts')
const solweb3 = require('@solana/web3.js')
const rayray = require("@raydium-io/raydium-sdk");
const b58 = require("bs58");
const dotenv = require('dotenv');
dotenv.config()

const { ApiPoolInfoV4:_ApiPoolInfoV4, MARKET_STATE_LAYOUT_V3:_MARKET_STATE_LAYOUT_V3, Market:_Market, SPL_MINT_LAYOUT:_SPL_MINT_LAYOUT }= rayray;
const sol = 'So11111111111111111111111111111111111111112' // e.g. SOLANA mint address
const raydiumBuyLocal = async (tokenAddress, amount, slippagePercentage) =>{
  return swapLocal(sol,tokenAddress, amount, slippagePercentage);
}

const raydiumSellLocal = async (tokenAddress, amount, slippagePercentage) =>{
  return swapLocal(tokenAddress, sol, amount, slippagePercentage);
}
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


const swapLocal = async (tokenAAddress, tokenBAddress, tokenAAmount, slippagePercentage) => {
  const executeSwap = true // Change to true to execute swap
  const useVersionedTransaction = true // Use versioned transaction
  //const tokenAAmount = 0.01 // e.g. 0.01 SOL -> B_TOKEN

  const raydiumSwap = new RaydiumSwapClass(RPC_URL, WALLET_PRIVATE_KEY)
  console.log(`Raydium swap initialized local`)

  // Trying to find pool info in the json we loaded earlier and by comparing baseMint and tokenBAddress
  let poolInfo = tokenAAddress==sol?await raydiumSwap.findLocalPool(tokenBAddress):await raydiumSwap.findLocalPool(tokenAAddress);
  //console.dir(poolInfo,{depth:null})
  /*let poolInfo2 = raydiumSwap.findPoolInfoForTokens(sol, "BNTHS5YDbJ5WHRJS3p9eeL8JQtt63M35RZZcDHAUPtKk")
  if(!poolInfo2){
      // Loading with pool keys from https://api.raydium.io/v2/sdk/liquidity/mainnet.json
      await raydiumSwap.loadPoolKeys()
      console.log(`Loaded pool keys`)
  }
  poolInfo2 = raydiumSwap.findPoolInfoForTokens(sol, "BNTHS5YDbJ5WHRJS3p9eeL8JQtt63M35RZZcDHAUPtKk")
  if(poolInfo2==undefined) {
    console.log("POOL NOT FOUND!")
    return;
  }
  console.dir(poolInfo2,{depth:null})
  */
  if(poolInfo){
    const tx = await raydiumSwap.getSwapTransaction(
      tokenBAddress,
      tokenAAmount,
      poolInfo,
      110000000, // Max amount of lamports
      useVersionedTransaction,
      'in',
      slippagePercentage
    )
    
  if (executeSwap) {
    const txid = useVersionedTransaction
      ? await raydiumSwap.sendVersionedTransaction(tx)
      : await raydiumSwap.sendLegacyTransaction(tx)
     return txid;
  } else {
    const simRes = useVersionedTransaction
      ? await raydiumSwap.simulateVersionedTransaction(tx)
      : await raydiumSwap.simulateLegacyTransaction(tx)

    console.log(simRes)
  }
  }else{
    console.log(poolInfo)
  }


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
      11000000, // Max amount of lamports
      useVersionedTransaction,
      'in',
      slippagePercentage
    )
    
  if (executeSwap) {
    const txid = useVersionedTransaction
      ? await raydiumSwap.sendVersionedTransaction(tx)
      : await raydiumSwap.sendLegacyTransaction(tx)
     return txid;
  } else {
    const simRes = useVersionedTransaction
      ? await raydiumSwap.simulateVersionedTransaction(tx)
      : await raydiumSwap.simulateLegacyTransaction(tx)

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
// 5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1
// https://solscan.io/tx/pCMX7we6ENNha8EjX1mysJ78P3xxkTzjXTYr8dMSsViCwnCxrkoNG84SEdmX8wyZDEvh1hbBhZECfGgc3Liao5Q
function swapFlow1(data){
  const { loadedAddresses, postTokenBalances, preTokenBalances } = data.meta;
  //for(let i=0;i<loadedAddresses.readonly.length;i++){
    const loadedAddress = "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1";
   // console.dir(loadedAddress,{depth:null})
    const solBefore = preTokenBalances.find(el=>el.owner==loadedAddress && el.mint==sol);
   // console.dir(solBefore,{depth:null})
    const solAfter = postTokenBalances.find(el=>el.owner==loadedAddress && el.mint==sol);
    //console.dir(solAfter,{depth:null})
    const tokenBefore = preTokenBalances.find(el=>el.owner==loadedAddress && el.mint!=sol);
   // console.dir(tokenBefore,{depth:null})
    const tokenAfter = postTokenBalances.find(el=>el.owner==loadedAddress && el.mint!=sol);
    //console.dir(tokenAfter,{depth:null})
    if(solBefore==undefined || solAfter==undefined || tokenBefore==undefined || tokenAfter==undefined) {
    /*  console.log("--")
      console.dir(data,{depth:null})
      console.log("------------")
      process.exit(1);*/
      console.log("Non SOL transaction")
      return undefined;
    }
    const solDiff = solAfter.uiTokenAmount.uiAmount - solBefore.uiTokenAmount.uiAmount;
    const tokenDiff = tokenAfter.uiTokenAmount.uiAmount - tokenBefore.uiTokenAmount.uiAmount;
    const token = tokenAfter.mint;
    const price = Math.abs(solDiff/tokenDiff);
    //console.dir(data,{depth:null})
    const buyorsell = solDiff<0?'buy':'sell';
    console.log(buyorsell+" "+token+" "+price);
    if(price==0 || price==Infinity || isNaN(price)) return undefined;
    return [buyorsell, token, price, solDiff, tokenDiff]
   // process.exit(1);
  //}
  return 
}

//const connectionSolanaHTTPS = new solweb3.Connection(process.env.RPC_URL, { commitment: 'confirmed' })

async function callback(data) {
  /*if(data.slot==undefined){
    console.dir(data,{depth:null})
    console.log("slot is null")
    process.exit(1)
  }*/
  const formatData = {
    slot: data.slot,
    signature: data.transaction.signatures[0],
    poolInfo: [],
    price: undefined,
    token: undefined,
    buyorsell: undefined,
    amountSol: undefined,
    amountToken: undefined,
  }
  let accountKeyIndexes;
  let raydiumKeyArray;
  if(data.version=="legacy"){
    if(data.transaction.message.indexToProgramIds==undefined){
      console.log("indexToProgramIds seems to be undefined")
      process.exit(1);
    }

    const accounts = data.transaction.message.accountKeys;
    if(data.meta.loadedAddresses.writable){
      accounts.push(...data.meta.loadedAddresses.writable)
    }
    if(data.meta.loadedAddresses.readonly){
      accounts.push(...data.meta.loadedAddresses.readonly)
    }
    try{
   /* for(let i=0;i<data.transaction.message.instructions.length;i++)  {
      const element = data.transaction.message.instructions[i];
      console.log(element)
      console.log(element.programIdIndex)
      console.log(data.transaction.message.indexToProgramIds.get(element.programIdIndex))
      console.log(data.transaction.message.indexToProgramIds.get(element.programIdIndex).toString())
    }*/
    let raydiumProgramArray = data.transaction.message.instructions.map(el=>({
      ...el,
      programPublicKey : data.transaction.message.indexToProgramIds.get(el.programIdIndex).toString()
    })).find(el=>el.programPublicKey=="675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");  //raydium swap
    if(raydiumProgramArray==undefined){
      //console.dir(data.meta.innerInstructions.map(el=>el.instructions).flat(),{depth:null})
      raydiumProgramArray = data.meta.innerInstructions.map(el=>el.instructions).flat().map(el=>({
        ...el,
        programPublicKey : accounts[el.programIdIndex].toString()
      })).find(el=>el.programPublicKey=="675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"); 
    }
    if(raydiumProgramArray==undefined){
      console.dir(data,{depth:null})
      process.exit(1)
    }
    accountKeyIndexes = raydiumProgramArray.accounts;
    
    if(accountKeyIndexes==undefined){
      console.log("accountKeyIndexes")
      console.dir(data,{depth:null})
      process.exit(1)
    }

    raydiumKeyArray = accountKeyIndexes.map(el=>accounts[el]);
  }catch(ex){
    console.log(ex);
    console.dir(data,{depth:null})
    process.exit(1)
  }
   
  }
  else if(data.version==0){
    const accounts = data.transaction.message.staticAccountKeys;
    if(data.meta.loadedAddresses.writable){
      accounts.push(...data.meta.loadedAddresses.writable)
    }
    if(data.meta.loadedAddresses.readonly){
      accounts.push(...data.meta.loadedAddresses.readonly)
    }
   // console.dir(accounts,{depth:null})
    let raydiumProgramArray = data.transaction.message.compiledInstructions.map(el=>({
      ...el,
      programPublicKey : accounts[el.programIdIndex].toString()
    })).find(el=>el.programPublicKey=="675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");  //raydium swap
    if(raydiumProgramArray) accountKeyIndexes = raydiumProgramArray.accountKeyIndexes;
    if(raydiumProgramArray==undefined){
     // console.dir(data.meta.innerInstructions.map(el=>el.instructions).flat(),{depth:null})
      raydiumProgramArray = data.meta.innerInstructions.map(el=>el.instructions).flat().map(el=>({
        ...el,
        programPublicKey : accounts[el.programIdIndex].toString()
      })).find(el=>el.programPublicKey=="675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"); 
      accountKeyIndexes = raydiumProgramArray.accounts;
    }
    if(raydiumProgramArray==undefined){
      console.dir(data,{depth:null})
      process.exit(1)
    }
    if(accountKeyIndexes==undefined){
      console.log("accountKeyIndexes")
      console.dir(data,{depth:null})
      process.exit(1)
    }
    
   
    raydiumKeyArray = accountKeyIndexes.map(el=>accounts[el]);
  }

  try{
    const poolInfo = swapFlow1(data);
    if(poolInfo==undefined) return null;
    formatData.buyorsell = poolInfo[0];
    formatData.token = poolInfo[1];
    formatData.price = poolInfo[2];
    formatData.amountSol = poolInfo[3];
    formatData.amountToken = poolInfo[4];
    if(raydiumKeyArray.length==18){
      formatData.poolInfo = {
        TokenProgram : raydiumKeyArray[0],
        AmmId : raydiumKeyArray[1],
        AmmAuthority : raydiumKeyArray[2],
        AmmOpenOrders : raydiumKeyArray[3],
        AmmTargetOrders : raydiumKeyArray[4],
        PoolCoinTokenAccount : raydiumKeyArray[5],
        PoolPcTokenAccount : raydiumKeyArray[6],
        SerumProgramId : raydiumKeyArray[7],
        SerumMarket : raydiumKeyArray[8],
        SerumBids : raydiumKeyArray[9],
        SerumAsks : raydiumKeyArray[10],
        SerumEventQueue : raydiumKeyArray[11],
        SerumCoinVaultAccount : raydiumKeyArray[12],
        SerumPcVaultAccount : raydiumKeyArray[13],
        SerumVaultSigner : raydiumKeyArray[14],
        UserSourceTokenAccount : raydiumKeyArray[15],
        UserDestTokenAccount : raydiumKeyArray[16],
        UserOwner : raydiumKeyArray[17],
      }
    }else  if(raydiumKeyArray.length==17){
      formatData.poolInfo = {
        TokenProgram : raydiumKeyArray[0],
        AmmId : raydiumKeyArray[1],
        AmmAuthority : raydiumKeyArray[2],
        AmmOpenOrders : raydiumKeyArray[3],
        PoolCoinTokenAccount : raydiumKeyArray[4],
        PoolPcTokenAccount : raydiumKeyArray[5],
        SerumProgramId : raydiumKeyArray[6],
        SerumMarket : raydiumKeyArray[7],
        SerumBids : raydiumKeyArray[8],
        SerumAsks : raydiumKeyArray[9],
        SerumEventQueue : raydiumKeyArray[10],
        SerumCoinVaultAccount : raydiumKeyArray[11],
        SerumPcVaultAccount : raydiumKeyArray[12],
        SerumVaultSigner : raydiumKeyArray[13],
        UserSourceTokenAccount : raydiumKeyArray[14],
        UserDestTokenAccount : raydiumKeyArray[15],
        UserOwner : raydiumKeyArray[16],
      }
    }else{
      return null;
      // add liquidity: https://solscan.io/tx/4VeUShCR2LAJzdgDLjT9W4ZzvfE2UH449dARf3veKkgKwEYGMjF8mmaXyoeJrKDa5WCFuDW3hex13GCqjfDkyKh5
      // remove liquidity: https://solscan.io/tx/5roiJJgGy2NPxmVfQFGkr8jhyG8Efq5srEgmmhiwmARjxX9VL1oF8qTXfojbatZhKvfu8hbbY2p2FAQGB8cULfBd
      console.log("raydiumKeyArray length unexpected size")
      console.log(raydiumKeyArray)
      console.dir(data,{depth:null})
      process.exit(1)
    }
   
    return formatData;
  }catch(ex){
    console.log(ex);
    return undefined;
  }


  /*
  const programId = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
  //if (!data.filters.includes('transactionsSubKey')) return undefined

  const info = data;
  if (info?.meta?.err !== null) return undefined
 

  stopFlag=true;
  const formatAmm = await formatAMM.formatAmmKeysById("5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",connectionSolanaHTTPS );
  console.log(formatAmm)
   var enc = new TextEncoder(); // always utf-8
  // console.dir(data,{depth:null})
  const accounts = info.transaction.message.staticAccountKeys.map((i: Buffer) => (i.toString()))
  const innerInstructions = info.meta.innerInstructions.map(inel=>({
    ...inel,
    instructions: inel.instructions.map(el=>({
      ...el,
      data: enc.encode(el.data)
    }))
  }))
 
  const [baseMintAccount, quoteMintAccount, marketAccount] = await connectionSolanaHTTPS.getMultipleAccountsInfo([
    new solweb3.PublicKey("86rsBvtXwxiPUgtavUX2j7XhVDFuirPRzCfDfioUGwLT"),
    
  ])
  console.log(baseMintAccount)
  const baseMintInfo = _SPL_MINT_LAYOUT.decode(baseMintAccount.data)
  console.dir(baseMintInfo, {depth:null})
  if(1)process.exit(1)
  const compiledInstructions = info.transaction.message.compiledInstructions;
  
  //for (const item of [...info.transaction.message.compiledInstructions, ...innerInstructions.map((i: any) => i.instructions).flat()]) {
  for(const item of compiledInstructions){
    if (accounts[item.programIdIndex] !== programId) continue;
   // console.log([...(item.data as Buffer).values()])
 
   //console.log([...(item.data as Buffer)])
   // if ([...(item.data as Buffer).values()][0] != 1) continue

    const keyIndex = item.accountKeyIndexes;
    // console.log(keyIndex)
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

    
    console.log(formatData)
  }


  return formatData*/
}



module.exports = {
  initialize,
  raydiumBuy, 
  raydiumSell,
  getConfirmation,
  callback,
  raydiumBuyLocal,
  raydiumSellLocal,
}
