import React, { useState, useEffect } from 'react';
import { Bell, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  pair: string;
  amount: string;
  price: string;
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
}

interface StakingTransaction {
  id: string;
  type: 'stake' | 'unstake';
  asset: string;
  amount: string;
  apy: string;
  date: string;
  time: string;
  status: 'active' | 'pending' | 'completed';
}

interface WithdrawalTransaction {
  _id: string;
  currency: string;
  amount: number;
  address: string;
  network: string;
  status: 'pending' | 'approved' | 'rejected';
  fee: number;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
}

const History: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trade' | 'staking' | 'withdraw'>('trade');
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, token } = useAuthStore();

  // Mock trade history data
  const tradeHistory: Transaction[] = [
    {
      id: '1',
      type: 'buy',
      pair: 'BTC/USDT',
      amount: '0.005 BTC',
      price: '$68,500.23',
      date: '2023-10-26',
      time: '14:30',
      status: 'completed'
    },
    {
      id: '2',
      type: 'sell',
      pair: 'ETH/USDT',
      amount: '0.1 ETH',
      price: '$3,400.15',
      date: '2023-10-25',
      time: '09:15',
      status: 'completed'
    },
    {
      id: '3',
      type: 'buy',
      pair: 'SOL/USDT',
      amount: '1.5 SOL',
      price: '$120.78',
      date: '2023-10-24',
      time: '18:45',
      status: 'pending'
    },
    {
      id: '4',
      type: 'sell',
      pair: 'ADA/USDT',
      amount: '100 ADA',
      price: '$0.45',
      date: '2023-10-23',
      time: '11:20',
      status: 'failed'
    }
  ];

  // Fetch withdrawal history
  const fetchWithdrawalHistory = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/withdrawals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWithdrawalHistory(response.data.data?.withdrawals || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch withdrawal history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'withdraw' && user) {
      fetchWithdrawalHistory();
    }
  }, [activeTab, user, token]);

  // Mock staking history data
  const stakingHistory: StakingTransaction[] = [
    {
      id: '1',
      type: 'stake',
      asset: 'ETH',
      amount: '2.5 ETH',
      apy: '5.2%',
      date: '2023-10-20',
      time: '10:30',
      status: 'active'
    },
    {
      id: '2',
      type: 'stake',
      asset: 'SOL',
      amount: '50 SOL',
      apy: '7.8%',
      date: '2023-10-18',
      time: '16:45',
      status: 'active'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buy':
      case 'stake':
        return 'bg-green-500/20 text-green-400';
      case 'sell':
      case 'unstake':
      case 'withdraw':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'buy':
      case 'stake':
        return <TrendingUp className="w-3 h-3" />;
      case 'sell':
      case 'unstake':
      case 'withdraw':
        return <ArrowUpRight className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold text-white">History</h1>
          <button className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <Bell className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('trade')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'trade'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
            }`}
          >
            Trade History
          </button>
          <button
            onClick={() => setActiveTab('staking')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'staking'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
            }`}
          >
            Staking History
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'withdraw'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
            }`}
          >
            Withdrawal History
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && activeTab === 'withdraw' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-400 mt-2">Loading withdrawal history...</p>
          </div>
        )}

        {/* Transaction Cards */}
        <div className="space-y-4">
          {activeTab === 'trade' ? (
            tradeHistory.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(transaction.type)}`}>
                      {getTypeIcon(transaction.type)}
                      <span className="capitalize">{transaction.type}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{transaction.pair}</h3>
                  <span className="text-lg font-semibold text-white">{transaction.amount}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">Price:</p>
                    <p className="text-white font-medium">{transaction.price}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Date:</p>
                    <p className="text-white font-medium">{transaction.date}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Time:</p>
                    <p className="text-white font-medium">{transaction.time}</p>
                  </div>
                </div>
              </div>
            ))
          ) : activeTab === 'staking' ? (
            stakingHistory.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(transaction.type)}`}>
                      {getTypeIcon(transaction.type)}
                      <span className="capitalize">{transaction.type}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{transaction.asset} Staking</h3>
                  <span className="text-lg font-semibold text-white">{transaction.amount}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">APY:</p>
                    <p className="text-green-400 font-medium">{transaction.apy}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Date:</p>
                    <p className="text-white font-medium">{transaction.date}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Time:</p>
                    <p className="text-white font-medium">{transaction.time}</p>
                  </div>
                </div>
              </div>
            ))
          ) : activeTab === 'withdraw' ? (
            withdrawalHistory.map((withdrawal) => (
              <div
                key={withdrawal._id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${getTypeColor('withdraw')}`}>
                      {getTypeIcon('withdraw')}
                      <span>Withdraw</span>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{withdrawal.currency} Withdrawal</h3>
                  <span className="text-lg font-semibold text-white">{withdrawal.amount} {withdrawal.currency}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-slate-400 mb-1">Network:</p>
                    <p className="text-white font-medium">{withdrawal.network}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Fee:</p>
                    <p className="text-white font-medium">{withdrawal.fee} {withdrawal.currency}</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-slate-400 mb-1">Address:</p>
                  <p className="text-white font-medium text-xs break-all">{withdrawal.address}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">Requested:</p>
                    <p className="text-white font-medium">{formatDate(withdrawal.requestedAt)}</p>
                    <p className="text-slate-400 text-xs">{formatTime(withdrawal.requestedAt)}</p>
                  </div>
                  {withdrawal.processedAt && (
                    <div>
                      <p className="text-slate-400 mb-1">Processed:</p>
                      <p className="text-white font-medium">{formatDate(withdrawal.processedAt)}</p>
                      <p className="text-slate-400 text-xs">{formatTime(withdrawal.processedAt)}</p>
                    </div>
                  )}
                </div>
                
                {withdrawal.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">
                      <span className="font-medium">Rejection Reason:</span> {withdrawal.rejectionReason}
                    </p>
                   </div>
                 )}
                </div>
              ))
           ) : null
          }
        </div>

        {/* Empty state */}
        {!loading && ((activeTab === 'trade' && tradeHistory.length === 0) || 
          (activeTab === 'staking' && stakingHistory.length === 0) ||
          (activeTab === 'withdraw' && withdrawalHistory.length === 0)) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              No {activeTab} history
            </h3>
            <p className="text-slate-500">
              Your {activeTab} transactions will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;