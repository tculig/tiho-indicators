const { Connection, PublicKey, Keypair, Transaction, VersionedTransaction, TransactionMessage } = require('@solana/web3.js')
const { Liquidity,
  LiquidityPoolKeys,
  jsonInfo2PoolKeys,
  LiquidityPoolJsonInfo,
  TokenAccount,
  Token,
  TokenAmount,
  TOKEN_PROGRAM_ID,
  Percent,
  SPL_ACCOUNT_LAYOUT, } = require('@raydium-io/raydium-sdk')
const { Wallet } = require('@project-serum/anchor')
const base58 = require('bs58')
const nodeFetch = require('node-fetch');
const mysql = require("mysql2/promise");
const ammkeys = require("./v1demo/formatAmmKeysById.ts");

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
class RaydiumSwap {
  allPoolKeysJson
  connection
  wallet
  START_TIME;
  connection_config = {
    host: "localhost",
    user: "root",
    password: "",
    database: `dexscreener01`,
    timezone: "+01:00",
    multipleStatements: true,
    dateStrings: ["DATE", "DATETIME"],
    keepAliveInitialDelay: 10000,
    enableKeepAlive: true
};
 connectionSQL;

  constructor(RPC_URL, WALLET_PRIVATE_KEY) {
    this.connection = new Connection(RPC_URL, { commitment: 'confirmed', confirmTransactionInitialTimeout: 60 })
    this.wallet = new Wallet(Keypair.fromSecretKey(base58.decode(WALLET_PRIVATE_KEY)))
    this.START_TIME = new Date();
    this.allPoolKeysJson = [];
  
  }

  async buyFromLocal(){

  }

  async findLocalPool(token){
    if (this.connectionSQL == undefined){
      this.connectionSQL = await mysql.createConnection(this.connection_config);
    }
    let query = `SELECT * FROM swapData WHERE token='${token}' LIMIT 1`; //10am
  
    const poolInfo = ((await this.connectionSQL.execute(query))[0]);
  
    const poolData = ammkeys.formatAmmKeysById(poolInfo[0].AmmId,this.connection )
    return poolData;
  /*  return {
      id: string
      baseMint: string
      quoteMint: string
      lpMint: string
      baseDecimals: number
      quoteDecimals: number
      lpDecimals: number
      version: 4
      programId: string
      authority: string
      openOrders: string
      targetOrders: string
      baseVault: string
      quoteVault: string
      withdrawQueue: string
      lpVault: string
      marketVersion: 3
      marketProgramId: string
      marketId: string
      marketAuthority: string
      marketBaseVault: string
      marketQuoteVault: string
      marketBids: string
      marketAsks: string
      marketEventQueue: string
      lookupTableAccount: string
    };*/
  }


  async loadPoolKeys() {
    const liquidityJsonResp = await nodeFetch('https://api.raydium.io/v2/sdk/liquidity/mainnet.json')
    if (!liquidityJsonResp.ok) return []
    const liquidityJson = (await liquidityJsonResp.json())
    const allPoolKeysJson = [...(liquidityJson?.official ?? []), ...(liquidityJson?.unOfficial ?? [])]

    this.allPoolKeysJson = allPoolKeysJson
  }

  findPoolInfoForTokens(mintA, mintB) {
    console.log(JSON.stringify(this.allPoolKeysJson).includes(mintB))

    const poolData = this.allPoolKeysJson.find(
      (i) => (i.baseMint === mintA && i.quoteMint === mintB) || (i.baseMint === mintB && i.quoteMint === mintA)
    )

    if (!poolData) return null

    return jsonInfo2PoolKeys(poolData) 
  }

  async getOwnerTokenAccounts() {
    const walletTokenAccount = await this.connection.getTokenAccountsByOwner(this.wallet.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    })

    return walletTokenAccount.value.map((i) => ({
      pubkey: i.pubkey,
      programId: i.account.owner,
      accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
    }))
  }

  async getSwapTransaction(
    toToken,
    // fromToken: string,
    amount,
    poolKeys,
    maxLamports = 110000,
    useVersionedTransaction = true,
    fixedSide = 'in',
    slippagePercentage = 5
  ) {
    const directionIn = poolKeys.quoteMint.toString() == toToken
    const { minAmountOut, amountIn } = await this.calcAmountOut(poolKeys, amount, directionIn, slippagePercentage)
    const userTokenAccounts = await this.getOwnerTokenAccounts()
    const swapTransaction = await Liquidity.makeSwapInstructionSimple({
      connection: this.connection,
      makeTxVersion: useVersionedTransaction ? 0 : 1,
      poolKeys: {
        ...poolKeys,
      },
      userKeys: {
        tokenAccounts: userTokenAccounts,
        owner: this.wallet.publicKey,
      },
      amountIn: amountIn,
      amountOut: minAmountOut,
      fixedSide: fixedSide,
      config: {
        bypassAssociatedCheck: false,
      },
      computeBudgetConfig: {
        microLamports: maxLamports,
      },
    })

    const recentBlockhashForSwap = await this.connection.getLatestBlockhash()
    const instructions = swapTransaction.innerTransactions[0].instructions.filter(Boolean)

    if (useVersionedTransaction) {
      const versionedTransaction = new VersionedTransaction(
        new TransactionMessage({
          payerKey: this.wallet.publicKey,
          recentBlockhash: recentBlockhashForSwap.blockhash,
          instructions: instructions,
        }).compileToV0Message()
      )

      versionedTransaction.sign([this.wallet.payer])

      return versionedTransaction
    }

    const legacyTransaction = new Transaction({
      blockhash: recentBlockhashForSwap.blockhash,
      lastValidBlockHeight: recentBlockhashForSwap.lastValidBlockHeight,
      feePayer: this.wallet.publicKey,
    })

    legacyTransaction.add(...instructions)

    return legacyTransaction
  }

  async sendLegacyTransaction(tx) {
    const txid = await this.connection.sendTransaction(tx, [this.wallet.payer], {
      skipPreflight: true,
      maxRetries: 2,
    })

    return txid
  }

  async isBlockhashExpired(lastValidBlockHeight) {
    let currentBlockHeight = (await this.connection.getBlockHeight('finalized'));
    console.log('                           ');
    console.log('Current Block height:             ', currentBlockHeight);
    console.log('Last Valid Block height - 150:     ', lastValidBlockHeight - 150);
    console.log('--------------------------------------------');
    console.log('Difference:                      ', currentBlockHeight - (lastValidBlockHeight - 150)); // If Difference is positive, blockhash has expired.
    console.log('                           ');

    return (currentBlockHeight > lastValidBlockHeight - 150);
  }

  async keepTrying(txId, lastValidHeight) {
    // Step 4 - Check transaction status and blockhash status until the transaction succeeds or blockhash expires
    let hashExpired = false;
    let txSuccess = false;
    while (!hashExpired && !txSuccess) {
      const { value: status } = await this.connection.getSignatureStatus(txId);

      // Break loop if transaction has succeeded
      if (status && ((status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized'))) {
        txSuccess = true;
        const endTime = new Date();
        const elapsed = (endTime.getTime() - this.START_TIME.getTime()) / 1000;
        console.log(`Transaction Success. Elapsed time: ${elapsed} seconds.`);
        console.log(`https://explorer.solana.com/tx/${txId}?cluster=devnet`);
        break;
      }

      hashExpired = await this.isBlockhashExpired(lastValidHeight);

      // Break loop if blockhash has expired
      if (hashExpired) {
        const endTime = new Date();
        const elapsed = (endTime.getTime() - this.START_TIME.getTime()) / 1000;
        console.log(`Blockhash has expired. Elapsed time: ${elapsed} seconds.`);
        // (add your own logic to Fetch a new blockhash and resend the transaction or throw an error)
        break;
      }

      // Check again after 2.5 sec
      await sleep(2500);
    }
  }

  async sendVersionedTransaction(tx) {
    console.log("SEDNING TX")
    const txid = await this.connection.sendTransaction(tx, {
      skipPreflight: true,
      maxRetries: 5,
    })
    console.log(`https://solscan.io/tx/${txid}`)
    const recentBlockhashForSwap = await this.connection.getLatestBlockhash()
    await this.isBlockhashExpired(recentBlockhashForSwap.lastValidBlockHeight)
    const confirmStrategy = {
      blockhash: recentBlockhashForSwap.blockhash,
      lastValidBlockHeight: recentBlockhashForSwap.lastValidBlockHeight,
      signature: txid
    }
    await this.keepTrying(txid, recentBlockhashForSwap.lastValidBlockHeight)
    try{
    const confirmed = await this.connection.confirmTransaction(confirmStrategy, 'confirmed')
     console.log(confirmed)
     return txid
    }catch(ex){
      console.log(ex);
      return false;
    }
   
  }

  async sendAndConfirm(tx) {
    const txid = await this.connection.sendAndConfirmRawTransaction(this.connection, tx, {

    })
  }

  async simulateLegacyTransaction(tx) {
    const txid = await this.connection.simulateTransaction(tx, [this.wallet.payer])

    return txid
  }

  async simulateVersionedTransaction(tx) {
    const txid = await this.connection.simulateTransaction(tx)

    return txid
  }

  getTokenAccountByOwnerAndMint(mint) {
    return {
      programId: TOKEN_PROGRAM_ID,
      pubkey: PublicKey.default,
      accountInfo: {
        mint: mint,
        amount: 0,
      },
    } 
  }

  async calcAmountOut(poolKeys, rawAmountIn, swapInDirection, slippagePercentage) {
    const poolInfo = await Liquidity.fetchInfo({ connection: this.connection, poolKeys })

    let currencyInMint = poolKeys.baseMint
    let currencyInDecimals = poolInfo.baseDecimals
    let currencyOutMint = poolKeys.quoteMint
    let currencyOutDecimals = poolInfo.quoteDecimals

    if (!swapInDirection) {
      currencyInMint = poolKeys.quoteMint
      currencyInDecimals = poolInfo.quoteDecimals
      currencyOutMint = poolKeys.baseMint
      currencyOutDecimals = poolInfo.baseDecimals
    }

    const currencyIn = new Token(TOKEN_PROGRAM_ID, currencyInMint, currencyInDecimals)
    const amountIn = new TokenAmount(currencyIn, rawAmountIn, false)
    const currencyOut = new Token(TOKEN_PROGRAM_ID, currencyOutMint, currencyOutDecimals)
    const slippage = new Percent(slippagePercentage, 100) // 5% slippage

    const { amountOut, minAmountOut, currentPrice, executionPrice, priceImpact, fee } = Liquidity.computeAmountOut({
      poolKeys,
      poolInfo,
      amountIn,
      currencyOut,
      slippage,
    })

    return {
      amountIn,
      amountOut,
      minAmountOut,
      currentPrice,
      executionPrice,
      priceImpact,
      fee,
    }
  }

  async getConfirmation(tx) {
    const result = await this.connection.getSignatureStatus(tx, {
      searchTransactionHistory: true,
    });
    return result.value?.confirmationStatus;
  };
}


module.exports = RaydiumSwap
