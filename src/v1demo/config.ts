const { 
  ENDPOINT: _ENDPOINT, 
  Currency, 
  LOOKUP_TABLE_CACHE, 
  MAINNET_PROGRAM_ID, 
  RAYDIUM_MAINNET, 
  Token: Tenko, 
  TOKEN_PROGRAM_ID: _TOKEN_PROGRAM_ID, 
  TxVersion 
} = require('@raydium-io/raydium-sdk');
const sol1= require('@solana/web3.js');

const rpcToken = undefined;

const PROGRAMIDS = MAINNET_PROGRAM_ID;

const ENDPOINT = _ENDPOINT;

const RAYDIUM_MAINNET_API = RAYDIUM_MAINNET;

const makeTxVersion = TxVersion.V0; // LEGACY

const addLookupTableInfo = LOOKUP_TABLE_CACHE; // only mainnet. other = undefined

const DEFAULT_TOKEN = {
  'SOL': new Currency(9, 'USDC', 'USDC'),
  'WSOL': new Tenko(_TOKEN_PROGRAM_ID, new sol1.PublicKey('So11111111111111111111111111111111111111112'), 9, 'WSOL', 'WSOL'),
  'USDC': new Tenko(_TOKEN_PROGRAM_ID, new sol1.PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), 6, 'USDC', 'USDC'),
  'RAY': new Tenko(_TOKEN_PROGRAM_ID, new sol1.PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'), 6, 'RAY', 'RAY'),
  'RAY_USDC-LP': new Tenko(_TOKEN_PROGRAM_ID, new sol1.PublicKey('FGYXP4vBkMEtKhxrmEBcWN8VNmXX8qNgEJpENKDETZ4Y'), 6, 'RAY-USDC', 'RAY-USDC'),
};

module.exports = {
  rpcToken,
  PROGRAMIDS,
  ENDPOINT,
  RAYDIUM_MAINNET_API,
  makeTxVersion,
  addLookupTableInfo,
  DEFAULT_TOKEN
};
