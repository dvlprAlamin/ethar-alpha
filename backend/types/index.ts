export interface MarketDataItem {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

export interface MarketData {
  [key: string]: MarketDataItem;
  'BTC/USD': MarketDataItem;
  'ETH/USD': MarketDataItem;
  'BTC/ETH': MarketDataItem;
  'TRC20/USD': MarketDataItem;
}

export interface UserBalances {
  BTC: number;
  ETH: number;
  TRC20: number;
  USD: number;
}

export interface PortfolioItem {
  balance: number;
  usdValue: number;
  price: number;
  percentage: number;
}

export interface Portfolio {
  BTC: PortfolioItem;
  ETH: PortfolioItem;
  TRC20: PortfolioItem;
  USD: PortfolioItem;
  total: number;
}

export interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
}