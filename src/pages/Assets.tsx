import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWebSocketStore } from '../store/websocketStore';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Plus,
  Minus
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import { useDataFetching } from '../hooks/useAsyncOperation';
import ErrorDisplay from '../components/ErrorDisplay';
import LoadingSkeleton, { TableSkeleton } from '../components/LoadingSkeleton';

interface AssetBalance {
  symbol: string;
  name: string;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  usdValue: number;
  change24h: number;
  changePercent24h: number;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'trade_buy' | 'trade_sell' | 'pool_investment' | 'pool_withdrawal';
  asset: string;
  amount: number;
  usdValue: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  timestamp: Date;
  txHash?: string;
  fee?: number;
}

const Assets: React.FC = () => {
  const { user } = useAuthStore();
  const { marketData, portfolio } = useWebSocketStore();
  const [showBalances, setShowBalances] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'crypto' | 'fiat'>('all');
  const [sortBy, setSortBy] = useState<'balance' | 'value' | 'change'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'deposit' | 'withdraw' | 'trade' | 'pool'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    data: assetsData, 
    loading: assetsLoading, 
    error: assetsError, 
    fetch: fetchAssets,
    refetch: refetchAssets 
  } = useDataFetching();

  // Mock transaction data
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'deposit',
      asset: 'BTC',
      amount: 0.5,
      usdValue: 21500,
      status: 'completed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      txHash: '0x1234...5678',
      fee: 0.0001
    },
    {
      id: '2',
      type: 'trade_sell',
      asset: 'ETH',
      amount: 2.5,
      usdValue: 4250,
      status: 'completed',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      fee: 8.5
    },
    {
      id: '3',
      type: 'pool_investment',
      asset: 'USDT',
      amount: 1000,
      usdValue: 1000,
      status: 'pending',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      id: '4',
      type: 'withdraw',
      asset: 'BTC',
      amount: 0.1,
      usdValue: 4300,
      status: 'failed',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      fee: 0.0005
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setTransactions(mockTransactions);
      setLoading(false);
    }, 1000);

    // Load initial assets data
    fetchAssets(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { loaded: true, timestamp: Date.now() };
    }).catch(() => {
      // Error is handled by the hook
    });

    return () => clearTimeout(timer);
  }, []);

  // Calculate asset balances with market data
  const assetBalances: AssetBalance[] = portfolio ? Object.entries(portfolio).map(([symbol, asset]) => {
    const market = marketData[symbol];
    const price = market?.price || asset.price || 0;
    const change24h = market?.change24h || 0;
    
    return {
      symbol,
      name: symbol,
      balance: asset.balance,
      lockedBalance: 0,
      availableBalance: asset.balance,
      usdValue: asset.usdValue,
      change24h: asset.balance * change24h,
      changePercent24h: change24h
    };
  }) : [];

  // Filter and sort assets
  const filteredAssets = assetBalances
    .filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'crypto' && asset.symbol !== 'USDT') ||
                           (filterType === 'fiat' && asset.symbol === 'USDT');
      return matchesSearch && matchesFilter && asset.balance > 0;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        case 'value':
          aValue = a.usdValue;
          bValue = b.usdValue;
          break;
        case 'change':
          aValue = a.changePercent24h;
          bValue = b.changePercent24h;
          break;
        default:
          aValue = a.usdValue;
          bValue = b.usdValue;
      }
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (transactionFilter === 'all') return true;
    if (transactionFilter === 'trade') return tx.type.startsWith('trade_');
    if (transactionFilter === 'pool') return tx.type.startsWith('pool_');
    return tx.type === transactionFilter;
  });

  const totalPortfolioValue = assetBalances.reduce((sum, asset) => sum + asset.usdValue, 0);
  const totalChange24h = assetBalances.reduce((sum, asset) => sum + asset.change24h, 0);
  const totalChangePercent = totalPortfolioValue > 0 ? (totalChange24h / (totalPortfolioValue - totalChange24h)) * 100 : 0;

  const formatCurrency = (amount: number, currency = 'USD') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
    return `${amount.toFixed(8)} ${currency}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'withdraw':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'trade_buy':
        return <Plus className="w-4 h-4 text-blue-500" />;
      case 'trade_sell':
        return <Minus className="w-4 h-4 text-orange-500" />;
      case 'pool_investment':
      case 'pool_withdrawal':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchAssets(async () => {
        // Simulate API call to refresh portfolio data
        await new Promise(resolve => setTimeout(resolve, 1000));
        // In a real app, this would fetch updated balances from the API
        return { refreshed: true, timestamp: Date.now() };
      });
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner text="Loading your assets..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Assets</h1>
            <p className="text-gray-600 mt-1">Manage your cryptocurrency portfolio</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showBalances ? 'Hide' : 'Show'} Balances</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing || assetsLoading}
              className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing || assetsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Portfolio Summary */}
        <Card className="p-4 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            <div>
            <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-gray-900">
              {showBalances ? formatCurrency(totalPortfolioValue) : '••••••••'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">24h Change</p>
            <div className="flex items-center space-x-2">
              <p className={`text-2xl font-bold ${
                totalChange24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {showBalances ? formatCurrency(totalChange24h) : '••••••'}
              </p>
              {totalChange24h >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">24h Change %</p>
            <p className={`text-2xl font-bold ${
              totalChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%
            </p>
          </div>
        </div>
        </Card>

        <ErrorDisplay 
          error={assetsError} 
          onRetry={handleRefresh}
          className="mb-6"
        />
        
        {/* Assets Table */}
        {assetsLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : (
          <Card>
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <h2 className="text-lg font-semibold text-gray-900">Your Assets</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Assets</option>
                  <option value="crypto">Crypto</option>
                  <option value="fiat">Fiat</option>
                </select>
                
                {/* Sort */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-');
                    setSortBy(by as any);
                    setSortOrder(order as any);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="value-desc">Value (High to Low)</option>
                  <option value="value-asc">Value (Low to High)</option>
                  <option value="balance-desc">Balance (High to Low)</option>
                  <option value="balance-asc">Balance (Low to High)</option>
                  <option value="change-desc">Change (High to Low)</option>
                  <option value="change-asc">Change (Low to High)</option>
                </select>
              </div>
            </div>
          </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Locked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  USD Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  24h Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset) => (
                <tr key={asset.symbol} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-gray-600">
                          {asset.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{asset.symbol}</div>
                        <div className="text-sm text-gray-500">{asset.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {showBalances ? asset.balance.toFixed(8) : '••••••••'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {showBalances ? asset.availableBalance.toFixed(8) : '••••••••'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {showBalances ? asset.lockedBalance.toFixed(8) : '••••••••'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {showBalances ? formatCurrency(asset.usdValue) : '••••••••'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center text-sm font-medium ${
                      asset.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {asset.changePercent24h >= 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      {asset.changePercent24h >= 0 ? '+' : ''}{asset.changePercent24h.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/deposit?asset=${asset.symbol}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        Deposit
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        to={`/withdraw?asset=${asset.symbol}`}
                        className="text-red-600 hover:text-red-900"
                      >
                        Withdraw
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        to={`/trade?pair=${asset.symbol}_USDT`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Trade
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </Card>
        )}

        {/* Transaction History */}
        <Card>
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Transactions</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdraw">Withdrawals</option>
                  <option value="trade">Trades</option>
                  <option value="pool">Pool Activities</option>
                </select>
                <button className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  USD Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTransactionIcon(transaction.type)}
                      <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                        {transaction.type.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.asset}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.amount.toFixed(8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(transaction.usdValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      getStatusColor(transaction.status)
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.timestamp.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.fee ? `${transaction.fee} ${transaction.asset}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Assets;