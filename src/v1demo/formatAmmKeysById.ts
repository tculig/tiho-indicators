const { Liquidity: LLQDT } = require("@raydium-io/raydium-sdk");

const { ApiPoolInfoV4, LIQUIDITY_STATE_LAYOUT_V4, MARKET_STATE_LAYOUT_V3, Market, SPL_MINT_LAYOUT } = require('@raydium-io/raydium-sdk');
//const {PublicKey} = require ('@solana/web3.js');
const solweb32 = require('@solana/web3.js')

exports.formatAmmKeysById = async function(id:any, _connection: any) {
  const account = await _connection.getAccountInfo(new solweb32.PublicKey(id));
  if (account === null) throw new Error(' get id info error ');
  const info = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data);

  const marketId = info.marketId;
  const marketAccount = await _connection.getAccountInfo(marketId);
  if (marketAccount === null) throw new Error(' get market info error');
  const marketInfo = MARKET_STATE_LAYOUT_V3.decode(marketAccount.data);

  const lpMint = info.lpMint;
  const lpMintAccount = await _connection.getAccountInfo(lpMint);
  if (lpMintAccount === null) throw new Error(' get lp mint info error');
  const lpMintInfo = SPL_MINT_LAYOUT.decode(lpMintAccount.data);

  return {
    id,
    baseMint: info.baseMint.toString(),
    quoteMint: info.quoteMint.toString(),
    lpMint: info.lpMint.toString(),
    baseDecimals: info.baseDecimal.toNumber(),
    quoteDecimals: info.quoteDecimal.toNumber(),
    lpDecimals: lpMintInfo.decimals,
    version: 4,
    programId: account.owner.toString(),
    authority: LLQDT.getAssociatedAuthority({ programId: account.owner }).publicKey.toString(),
    openOrders: info.openOrders.toString(),
    targetOrders: info.targetOrders.toString(),
    baseVault: info.baseVault.toString(),
    quoteVault: info.quoteVault.toString(),
    withdrawQueue: info.withdrawQueue.toString(),
    lpVault: info.lpVault.toString(),
    marketVersion: 3,
    marketProgramId: info.marketProgramId.toString(),
    marketId: info.marketId.toString(),
    marketAuthority: Market.getAssociatedAuthority({ programId: info.marketProgramId, marketId: info.marketId }).publicKey.toString(),
    marketBaseVault: marketInfo.baseVault.toString(),
    marketQuoteVault: marketInfo.quoteVault.toString(),
    marketBids: marketInfo.bids.toString(),
    marketAsks: marketInfo.asks.toString(),
    marketEventQueue: marketInfo.eventQueue.toString(),
    lookupTableAccount: solweb32.PublicKey.default.toString()
  };
};
