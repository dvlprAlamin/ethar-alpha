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

// Balance Management Types
export interface BalanceAdjustment {
  userId: string;
  currency: 'BTC' | 'ETH' | 'TRC20' | 'USD';
  type: 'add' | 'reduce';
  amount: number;
  reason: string;
  adminId: string;
  timestamp: Date;
}

export interface BalanceAdjustmentRequest {
  currency: 'BTC' | 'ETH' | 'TRC20' | 'USD';
  type: 'add' | 'reduce';
  amount: number;
  reason: string;
}

export interface UserBalanceInfo {
  userId: string;
  email: string;
  name: string;
  balances: UserBalances;
}

// Wallet Configuration Types
export interface DepositAddresses {
  BTC: string;
  ETH: string;
  TRC20: string;
}

export interface QRCodes {
  BTC?: string;
  ETH?: string;
  TRC20?: string;
}

export interface WalletConfig {
  depositAddresses: DepositAddresses;
  qrCodes: QRCodes;
}

export interface WalletAddressUpdate {
  BTC?: string;
  ETH?: string;
  TRC20?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}