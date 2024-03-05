const ray = require("@raydium-io/raydium-sdk");
const { Liquidity : _Liquidity} = require("@raydium-io/raydium-sdk");
const assert = require('assert');
const { formatAmmKeysById } = require('./formatAmmKeysById');

async function swapOnlyAmm(input:any, _connection:any) {
  // -------- pre-action: get pool info --------
//  const targetPoolInfo = await formatAmmKeysById(input.targetPool, _connection);
 // assert(targetPoolInfo, 'cannot find the target pool');
  const poolKeys = input.poolInfo;
  console.log("1");
  // -------- step 1: compute amount out --------
  const { amountOut, minAmountOut } = await _Liquidity.computeAmountOut({
    poolKeys: poolKeys,
    poolInfo: await _Liquidity.fetchInfo({ connection: _connection, poolKeys }),
    amountIn: input.inputTokenAmount,
    currencyOut: input.outputToken,
    slippage: input.slippage,
  });
  console.log("11");
  // -------- step 2: create instructions by SDK function --------
  const { innerTransactions } = await _Liquidity.makeSwapInstructionSimple({
    connection: _connection,
    poolKeys,
    userKeys: {
      tokenAccounts: input.walletTokenAccounts,
      owner: input.wallet.publicKey,
    },
    amountIn: input.inputTokenAmount,
    amountOut: minAmountOut,
    fixedSide: 'in',
    makeTxVersion: 1,
  });
  console.log("111");
  console.log('amountOut:', amountOut.toFixed(), '  minAmountOut: ', minAmountOut.toFixed());

  return { txids: await buildAndSendTx(innerTransactions) };
}
/*
async function howToUse() {
  const inputToken = DEFAULT_TOKEN.USDC; // USDC
  const outputToken = DEFAULT_TOKEN.RAY; // RAY
  const targetPool = 'EVzLJhqMtdC1nPmz8rNd6xGfVjDPxpLZgq7XJuNfMZ6'; // USDC-RAY pool
  const inputTokenAmount = new TokenAmount(inputToken, 10000);
  const slippage = new Percent(1, 100);
  const walletTokenAccounts = await getWalletTokenAccount(connection, wallet.publicKey);

  swapOnlyAmm({
    outputToken,
    targetPool,
    inputTokenAmount,
    slippage,
    walletTokenAccounts,
    wallet,
  }).then(({ txids }) => {
    console.log('txids', txids);
  });
}
*/
module.exports = { swapOnlyAmm };
