// Admin Panel Types
export interface UserBalance {
  userId: string;
  email: string;
  name: string;
  balances: {
    BTC: number;
    ETH: number;
    TRC20: number;
    USD: number;
  };
}

export interface BalanceAdjustment {
  currency: 'BTC' | 'ETH' | 'TRC20' | 'USD';
  type: 'add' | 'reduce';
  amount: number;
  reason: string;
}

export interface WalletConfig {
  depositAddresses: {
    BTC: string;
    ETH: string;
    TRC20: string;
  };
  qrCodes: {
    BTC?: string;
    ETH?: string;
    TRC20?: string;
  };
}

export interface WalletAddresses {
  BTC: string;
  ETH: string;
  TRC20: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  totalPools: number;
  activePools: number;
  pendingWithdrawals: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
  lastLogin?: Date;
  totalBalance: number;
  kycStatus: 'pending' | 'approved' | 'rejected';
}

export interface AdminTransaction {
  id: string;
  userId: string;
  userEmail: string;
  type: 'deposit' | 'withdraw' | 'trade' | 'pool_investment';
  asset: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  timestamp: Date;
  txHash?: string;
  fee: number;
}

export interface SystemConfig {
  maintenanceMode: boolean;
  tradingEnabled: boolean;
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
  registrationEnabled: boolean;
  kycRequired: boolean;
  tradingFee: number;
  withdrawalFee: number;
  maxDailyWithdrawal: number;
  minDepositAmount: number;
}

export interface Pool {
  id: string;
  name: string;
  description: string;
  totalValue: number;
  participants: number;
  apy: number;
  status: 'active' | 'closed' | 'pending';
  minInvestment: number;
  maxInvestment: number;
  duration: number;
  createdAt: Date;
}