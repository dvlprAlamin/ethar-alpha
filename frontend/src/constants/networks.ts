export const NETWORK_OPTIONS = [
  'Bitcoin (BTC)',
  'Ethereum (ETH)',
  'Tether (USDT TRC20)',
  'Binance Coin (BNB)',
  'Litecoin (LTC)',
  'Ripple (XRP)'
] as const;

export type NetworkType = typeof NETWORK_OPTIONS[number];