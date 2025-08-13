import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWebSocketStore } from '../store/websocketStore';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  DollarSign,
  Activity,
  Eye,
  EyeOff,
} from 'lucide-react';
import { StatCard } from '../components/Card';
import MarketPriceSection from '../components/MarketPriceSection';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'trade' | 'pool_investment';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { marketData, portfolio } = useWebSocketStore();
  const [showBalances, setShowBalances] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'deposit',
      amount: 0.5,
      currency: 'BTC',
      status: 'completed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      type: 'trade',
      amount: 1000,
      currency: 'USDT',
      status: 'completed',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: '3',
      type: 'pool_investment',
      amount: 500,
      currency: 'USDT',
      status: 'pending',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ];

  useEffect(() => {
    const { subscribeToPortfolio } = useWebSocketStore.getState();

    // Subscribe to portfolio updates
    subscribeToPortfolio();

    // Simulate loading
    const timer = setTimeout(() => {
      setRecentTransactions(mockTransactions);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const portfolioAssets = portfolio
    ? Object.entries(portfolio).map(([symbol, data]) => ({
        symbol,
        balance: data.balance,
        usdValue: data.usdValue,
        price: data.price,
      }))
    : [];

  const totalPortfolioValue = portfolioAssets.reduce((total, asset) => {
    return total + asset.usdValue;
  }, 0);

  const portfolioChange24h = portfolioAssets.reduce((total, asset) => {
    const market = marketData[asset.symbol];
    if (!market) return total;
    return total + asset.balance * market.price * (market.change24h / 100);
  }, 0);

  const portfolioChangePercent =
    totalPortfolioValue > 0
      ? (portfolioChange24h / (totalPortfolioValue - portfolioChange24h)) * 100
      : 0;

  const formatCurrency = (amount: number, currency = 'USD') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
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
      case 'trade':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'pool_investment':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
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
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        {/* <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showBalances ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            <span>{showBalances ? 'Hide' : 'Show'} Balances</span>
          </button>
        </div> */}
      </div>

      {/* Real-time Market Price Section */}
      <MarketPriceSection />

      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Portfolio"
          value={showBalances ? formatCurrency(totalPortfolioValue) : '••••••'}
          icon={Wallet}
          iconColor="blue"
          trend={{
            value: portfolioChangePercent,
            isPositive: portfolioChange24h >= 0,
          }}
        />

        <StatCard
          title="Available Balance"
          value={
            showBalances ? formatCurrency(user?.balances?.USD || 0) : '••••••'
          }
          subtitle="USD"
          icon={DollarSign}
          iconColor="green"
        />

        <StatCard
          title="Active Investments"
          value="3"
          subtitle="Pool investments"
          icon={Users}
          iconColor="purple"
        />

        <StatCard
          title="Today's P&L"
          value={showBalances ? formatCurrency(portfolioChange24h) : '••••••'}
          subtitle="24h change"
          icon={Activity}
          iconColor="orange"
        />
      </div> */}
    </div>
  );
};

export default Dashboard;
