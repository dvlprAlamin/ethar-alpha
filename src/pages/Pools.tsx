import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Calculator,
  ArrowRight,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

interface Pool {
  id: string;
  name: string;
  description: string;
  strategy: string;
  minInvestment: number;
  maxInvestment: number;
  currentValue: number;
  targetValue: number;
  apy: number;
  duration: number; // in days
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'closed' | 'upcoming';
  totalInvestors: number;
  totalInvested: number;
  startDate: Date;
  endDate: Date;
  currency: string;
  manager: string;
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

interface UserInvestment {
  id: string;
  poolId: string;
  poolName: string;
  amount: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
  investmentDate: Date;
  maturityDate: Date;
  status: 'active' | 'matured' | 'withdrawn';
  canWithdraw: boolean;
  earlyWithdrawalPenalty?: number;
}

const Pools: React.FC = () => {
  const { user } = useAuthStore();
  const [pools, setPools] = useState<Pool[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'upcoming'>('all');
  const [sortBy, setSortBy] = useState<'apy' | 'duration' | 'invested'>('apy');
  const [refreshing, setRefreshing] = useState(false);

  const mockPools: Pool[] = [
    {
      id: '1',
      name: 'Bitcoin Growth Pool',
      description: 'Conservative Bitcoin investment strategy focusing on long-term growth with DCA approach.',
      strategy: 'Dollar Cost Averaging',
      minInvestment: 100,
      maxInvestment: 10000,
      currentValue: 850000,
      targetValue: 1000000,
      apy: 12.5,
      duration: 90,
      riskLevel: 'medium',
      status: 'active',
      totalInvestors: 156,
      totalInvested: 850000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-04-01'),
      currency: 'USDT',
      manager: 'Alpha Trading Team',
      performance: {
        daily: 0.15,
        weekly: 1.2,
        monthly: 4.8
      }
    },
    {
      id: '2',
      name: 'Ethereum Staking Pool',
      description: 'Participate in Ethereum 2.0 staking with professional validator management.',
      strategy: 'ETH 2.0 Staking',
      minInvestment: 50,
      maxInvestment: 5000,
      currentValue: 450000,
      targetValue: 500000,
      apy: 8.2,
      duration: 180,
      riskLevel: 'low',
      status: 'active',
      totalInvestors: 89,
      totalInvested: 450000,
      startDate: new Date('2023-12-15'),
      endDate: new Date('2024-06-15'),
      currency: 'USDT',
      manager: 'Staking Solutions',
      performance: {
        daily: 0.08,
        weekly: 0.6,
        monthly: 2.1
      }
    },
    {
      id: '3',
      name: 'DeFi Yield Farming',
      description: 'High-yield farming across multiple DeFi protocols with active management.',
      strategy: 'Yield Farming',
      minInvestment: 200,
      maxInvestment: 20000,
      currentValue: 320000,
      targetValue: 1000000,
      apy: 25.8,
      duration: 60,
      riskLevel: 'high',
      status: 'active',
      totalInvestors: 67,
      totalInvested: 320000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15'),
      currency: 'USDT',
      manager: 'DeFi Experts',
      performance: {
        daily: 0.45,
        weekly: 3.2,
        monthly: 12.1
      }
    },
    {
      id: '4',
      name: 'Stable Coin Arbitrage',
      description: 'Low-risk arbitrage opportunities across different exchanges and protocols.',
      strategy: 'Arbitrage Trading',
      minInvestment: 500,
      maxInvestment: 50000,
      currentValue: 0,
      targetValue: 2000000,
      apy: 6.5,
      duration: 30,
      riskLevel: 'low',
      status: 'upcoming',
      totalInvestors: 0,
      totalInvested: 0,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-03-01'),
      currency: 'USDT',
      manager: 'Arbitrage Pro',
      performance: {
        daily: 0,
        weekly: 0,
        monthly: 0
      }
    }
  ];

  const mockUserInvestments: UserInvestment[] = [
    {
      id: '1',
      poolId: '1',
      poolName: 'Bitcoin Growth Pool',
      amount: 1000,
      currentValue: 1125,
      profit: 125,
      profitPercent: 12.5,
      investmentDate: new Date('2024-01-01'),
      maturityDate: new Date('2024-04-01'),
      status: 'active',
      canWithdraw: false
    },
    {
      id: '2',
      poolId: '2',
      poolName: 'Ethereum Staking Pool',
      amount: 500,
      currentValue: 535,
      profit: 35,
      profitPercent: 7.0,
      investmentDate: new Date('2023-12-15'),
      maturityDate: new Date('2024-06-15'),
      status: 'active',
      canWithdraw: true,
      earlyWithdrawalPenalty: 2.5
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setPools(mockPools);
      setUserInvestments(mockUserInvestments);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter and sort pools
  const filteredPools = pools
    .filter(pool => {
      const matchesSearch = pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pool.strategy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = riskFilter === 'all' || pool.riskLevel === riskFilter;
      const matchesStatus = statusFilter === 'all' || pool.status === statusFilter;
      return matchesSearch && matchesRisk && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'apy':
          return b.apy - a.apy;
        case 'duration':
          return a.duration - b.duration;
        case 'invested':
          return b.totalInvested - a.totalInvested;
        default:
          return 0;
      }
    });

  const handleInvest = (pool: Pool) => {
    setSelectedPool(pool);
    setInvestmentAmount('');
    setShowInvestModal(true);
  };

  const confirmInvestment = async () => {
    if (!selectedPool || !investmentAmount) return;
    
    setInvesting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form
      setShowInvestModal(false);
      setSelectedPool(null);
      setInvestmentAmount('');
      
      alert('Investment successful!');
      
      // Refresh data
      await refreshData();
    } catch (error) {
      alert('Investment failed. Please try again.');
    } finally {
      setInvesting(false);
    }
  };

  const withdrawInvestment = async (investmentId: string) => {
    if (confirm('Are you sure you want to withdraw this investment?')) {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUserInvestments(prev => 
        prev.map(inv => 
          inv.id === investmentId ? { ...inv, status: 'withdrawn' } : inv
        )
      );
      
      alert('Withdrawal successful!');
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'upcoming':
        return 'text-blue-600 bg-blue-100';
      case 'closed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateProjectedReturn = () => {
    if (!selectedPool || !investmentAmount) return 0;
    const amount = parseFloat(investmentAmount);
    return amount * (selectedPool.apy / 100) * (selectedPool.duration / 365);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Investment Pools</h1>
          <p className="text-gray-600">Diversify your portfolio with managed investment pools</p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* User Investments Summary */}
      {userInvestments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Investments</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Invested</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(userInvestments.reduce((sum, inv) => sum + inv.amount, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Current Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(userInvestments.reduce((sum, inv) => sum + inv.currentValue, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Profit</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(userInvestments.reduce((sum, inv) => sum + inv.profit, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Active Pools</p>
                <p className="text-2xl font-bold text-blue-600">
                  {userInvestments.filter(inv => inv.status === 'active').length}
                </p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pool</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invested</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current Value</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Profit/Loss</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Maturity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userInvestments.map((investment) => (
                    <tr key={investment.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {investment.poolName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(investment.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(investment.currentValue)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className={`font-medium ${
                          investment.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(investment.profit)} ({investment.profitPercent.toFixed(2)}%)
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {investment.maturityDate.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {investment.canWithdraw && investment.status === 'active' && (
                          <button
                            onClick={() => withdrawInvestment(investment.id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Withdraw
                            {investment.earlyWithdrawalPenalty && (
                              <span className="text-xs text-gray-500 ml-1">
                                (-{investment.earlyWithdrawalPenalty}%)
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search pools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Risk Filter */}
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="apy">Sort by APY</option>
              <option value="duration">Sort by Duration</option>
              <option value="invested">Sort by Total Invested</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPools.map((pool) => (
          <div key={pool.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Pool Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{pool.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{pool.strategy}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      getRiskColor(pool.riskLevel)
                    }`}>
                      {pool.riskLevel} risk
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      getStatusColor(pool.status)
                    }`}>
                      {pool.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pool Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">APY</span>
                  <span className="text-sm font-bold text-green-600">{pool.apy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-medium text-gray-900">{pool.duration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Min Investment</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(pool.minInvestment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Invested</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(pool.totalInvested)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Investors</span>
                  <span className="text-sm font-medium text-gray-900">{pool.totalInvestors}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{((pool.currentValue / pool.targetValue) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((pool.currentValue / pool.targetValue) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Performance */}
              {pool.status === 'active' && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">Recent Performance</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-gray-600">24h</p>
                      <p className={`font-medium ${
                        pool.performance.daily >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {pool.performance.daily >= 0 ? '+' : ''}{pool.performance.daily}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">7d</p>
                      <p className={`font-medium ${
                        pool.performance.weekly >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {pool.performance.weekly >= 0 ? '+' : ''}{pool.performance.weekly}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">30d</p>
                      <p className={`font-medium ${
                        pool.performance.monthly >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {pool.performance.monthly >= 0 ? '+' : ''}{pool.performance.monthly}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">{pool.description}</p>

              {/* Action Button */}
              <button
                onClick={() => handleInvest(pool)}
                disabled={pool.status !== 'active'}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <span>{pool.status === 'active' ? 'Invest Now' : pool.status === 'upcoming' ? 'Coming Soon' : 'Closed'}</span>
                {pool.status === 'active' && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPools.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No pools found matching your criteria</p>
        </div>
      )}

      {/* Investment Modal */}
      {showInvestModal && selectedPool && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Invest in {selectedPool.name}
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Amount (USDT)
                </label>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder={`Min: ${selectedPool.minInvestment}`}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="mt-1 flex justify-between text-sm text-gray-600">
                  <span>Min: {formatCurrency(selectedPool.minInvestment)}</span>
                  <span>Max: {formatCurrency(selectedPool.maxInvestment)}</span>
                </div>
              </div>
              
              {investmentAmount && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Investment Summary</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Investment Amount</span>
                      <span className="font-medium text-blue-900">{formatCurrency(parseFloat(investmentAmount))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Expected Return</span>
                      <span className="font-medium text-blue-900">{formatCurrency(calculateProjectedReturn())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Maturity Date</span>
                      <span className="font-medium text-blue-900">
                        {new Date(Date.now() + selectedPool.duration * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 pt-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-blue-900">Total at Maturity</span>
                        <span className="font-bold text-blue-900">
                          {formatCurrency(parseFloat(investmentAmount) + calculateProjectedReturn())}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowInvestModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmInvestment}
                disabled={investing || !investmentAmount || parseFloat(investmentAmount) < selectedPool.minInvestment}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {investing ? 'Processing...' : 'Confirm Investment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pools;