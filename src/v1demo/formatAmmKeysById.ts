const { Liquidity: LLQDT } = require("@raydium-io/raydium-sdk");

const { ApiPoolInfoV4, LIQUIDITY_STATE_LAYOUT_V4, MARKET_STATE_LAYOUT_V3, Market, SPL_MINT_LAYOUT } = require('@raydium-io/raydium-sdk');
//const {PublicKey} = require ('@solana/web3.js');
const solweb32 = require('@solana/web3.js')

exports.formatAmmKeysById = async function(id, _connection) {
  const account = await _connection.getAccountInfo(new solweb32.PublicKey(id));
  //console.dir(account,{depth:null})
  if (account === null) throw new Error(' get id info error ');
  const info = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data);
 // console.dir(info,{depth:null})

  const marketId = info.marketId;
  const marketAccount = await _connection.getAccountInfo(marketId);

  if (marketAccount === null) throw new Error(' get market info error');
  const marketInfo = MARKET_STATE_LAYOUT_V3.decode(marketAccount.data);
  //console.dir(marketInfo,{depth:null})

  const lpMint = info.lpMint;
  const lpMintAccount = await _connection.getAccountInfo(lpMint);

  //console.dir(lpMint,{depth:null})
  if (lpMintAccount === null) throw new Error(' get lp mint info error');
  const lpMintInfo = SPL_MINT_LAYOUT.decode(lpMintAccount.data);
  //console.dir(lpMintInfo,{depth:null})
 // console.dir(Market.getAssociatedAuthority({ programId: info.marketProgramId, marketId: info.marketId }),{depth:null})

  return {
    id:new solweb32.PublicKey(id),
    baseMint: info.baseMint,
    quoteMint: info.quoteMint,
    lpMint: info.lpMint,
    baseDecimals: info.baseDecimal.toNumber(),
    quoteDecimals: info.quoteDecimal.toNumber(),
    lpDecimals: lpMintInfo.decimals,
    version: 4,
    programId: account.owner,
    authority: LLQDT.getAssociatedAuthority({ programId: account.owner }).publicKey,
    openOrders: info.openOrders,
    targetOrders: info.targetOrders,
    baseVault: info.baseVault,
    quoteVault: info.quoteVault,
    withdrawQueue: info.withdrawQueue,
    lpVault: info.lpVault,
    marketVersion: 4,
    marketProgramId: info.marketProgramId,
    marketId: info.marketId,
    marketAuthority: Market.getAssociatedAuthority({ programId: info.marketProgramId, marketId: info.marketId }).publicKey,
    marketBaseVault: marketInfo.baseVault,
    marketQuoteVault: marketInfo.quoteVault,
    marketBids: marketInfo.bids,
    marketAsks: marketInfo.asks,
    marketEventQueue: marketInfo.eventQueue,
    lookupTableAccount: solweb32.PublicKey.default
  };
};
