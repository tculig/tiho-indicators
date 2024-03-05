const config = require("./v1demo/config");
const utils = require ("./v1demo/util");
const { TokenAmount: TokenAmount2, Percent:Percent2, jsonInfo2PoolKeys:jsonInfo2PoolKeys2, Token: _Token,  TOKEN_PROGRAM_ID: __TOKEN_PROGRAM_ID } = require("@raydium-io/raydium-sdk");
const swap2 = require("./v1demo/swapOnlyAmm");
const solweb31 = require('@solana/web3.js')
const nodeFetch2 = require("node-fetch");
const { 
  Connection:Connection2, 
  Keypair:Keypair2, 
} = require('@solana/web3.js');
const bs58 = require("bs58");

const sol2 = 'So11111111111111111111111111111111111111112' // e.g. SOLANA mint address
const raydiumBuyV2 = async (tokenAddress:any, amount:any, slippagePercentage:any)=>{
    if(allPoolKeysJson==undefined){
        await loadPoolKeys();
    }
    console.log(`Raydium swap initialized`)
    var poolInfo = findPoolInfoForTokens(sol2, tokenAddress)
    if(poolInfo==undefined) {
      await loadPoolKeys();
    }
    poolInfo = findPoolInfoForTokens(sol2, tokenAddress)
    if(poolInfo==undefined) {
      return "CANNOT FIND POOL"
    }
    const inputToken = config.DEFAULT_TOKEN.WSOL 
  
    const outputToken = new _Token(__TOKEN_PROGRAM_ID, new solweb31.PublicKey(tokenAddress), poolInfo.quoteDecimals); 
   
    const targetPool = poolInfo.id;
    const inputTokenAmount = new TokenAmount2(inputToken, Math.round(amount*poolInfo.baseDecimals))
    const slippage = new Percent2(slippagePercentage, 100)
    const walletTokenAccounts = await utils.getWalletTokenAccount(connection, wallet.publicKey)
  
    const txids = await swap2.swapOnlyAmm({
      poolInfo,
      outputToken,
      targetPool,
      inputTokenAmount,
      slippage,
      walletTokenAccounts,
      wallet: wallet,
    }, connection);
    return txids;
  }
  
  const raydiumSellV2 = async (tokenAddress:any, amount:any, slippagePercentage:any)=>{
    return "2";
    if(allPoolKeysJson==undefined){
        await loadPoolKeys();
    }
    const inputToken = config.DEFAULT_TOKEN.USDC // USDC
    const outputToken = config.DEFAULT_TOKEN.RAY // RAY
    const targetPool = 'EVzLJhqMtdC1nPmz8rNd6xGfVjDPxpLZgq7XJuNfMZ6' // USDC-RAY pool
    const inputTokenAmount = new TokenAmount2(inputToken, amount)
    const slippage = new Percent2(slippagePercentage, 100)
    const walletTokenAccounts = await utils.getWalletTokenAccount(connection, wallet.publicKey)
  
    const txids = await swap2.swapOnlyAmm({
      outputToken,
      targetPool,
      inputTokenAmount,
      slippage,
      walletTokenAccounts,
      wallet: wallet,
    });
    return txids;
  }
  var allPoolKeysJson : any[];
  const loadPoolKeys = async ()=>{
        const liquidityJsonResp = await nodeFetch2('https://api.raydium.io/v2/sdk/liquidity/mainnet.json')
        if (!liquidityJsonResp.ok) return []
        const liquidityJson = (await liquidityJsonResp.json()) as { official: any; unOfficial: any }
        allPoolKeysJson = [...(liquidityJson?.official ?? []), ...(liquidityJson?.unOfficial ?? [])]  
  }
  
  const findPoolInfoForTokens = (mintA: string, mintB: string) => {
    const poolData = allPoolKeysJson.find(
      (i) => (i.baseMint === mintA && i.quoteMint === mintB) || (i.baseMint === mintB && i.quoteMint === mintA)
    )

    if (!poolData) return null

    return jsonInfo2PoolKeys2(poolData);
  }
  const getConfirmation2 = async ( tx: string) => {
    const result = await connection.getSignatureStatus(tx, {
      searchTransactionHistory: true,
    });
    return result.value?.confirmationStatus;
  };
  let RPC_URL2, WALLET_PRIVATE_KEY2;
  var connection:any;
  var wallet:any;
  const initialize2 = (rpc:any, walletPrivateKey:any)=>{
    RPC_URL2 = rpc;
    WALLET_PRIVATE_KEY2 = walletPrivateKey;
    connection = new Connection2(rpc);
    wallet = Keypair2.fromSecretKey(Buffer.from(bs58.decode(walletPrivateKey)));
   }

module.exports = {
  initialize2,
  raydiumBuyV2, 
  raydiumSellV2,
  getConfirmation2
}