import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  BarChart3,
  PieChart,
  Calendar,
  Globe,
  Database,
  Server,
  Mail,
  Bell
} from 'lucide-react';
import { useDataFetching, useMultipleAsyncOperations } from '../hooks/useAsyncOperation';
import ErrorDisplay from '../components/ErrorDisplay';
import LoadingSkeleton, { StatCardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  totalPools: number;
  activePools: number;
  pendingWithdrawals: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  balance: number;
  lastLogin: Date;
  createdAt: Date;
  kycStatus: 'pending' | 'approved' | 'rejected';
  twoFactorEnabled: boolean;
}

interface Transaction {
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

interface Pool {
  id: string;
  name: string;
  strategy: string;
  totalInvested: number;
  totalInvestors: number;
  apy: number;
  status: 'active' | 'closed' | 'upcoming';
  createdAt: Date;
  performance: number;
}

interface SystemConfig {
  maintenanceMode: boolean;
  tradingEnabled: boolean;
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
  registrationEnabled: boolean;
  kycRequired: boolean;
  maxWithdrawalDaily: number;
  tradingFee: number;
  withdrawalFee: number;
  minDepositAmount: number;
}

const Admin: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const { execute, getOperation, isAnyLoading } = useMultipleAsyncOperations();
  
  const statsOperation = getOperation('stats');
  const usersOperation = getOperation('users');
  const transactionsOperation = getOperation('transactions');
  const poolsOperation = getOperation('pools');
  const configOperation = getOperation('config');

  const mockStats: DashboardStats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalTransactions: 5634,
    totalVolume: 2450000,
    totalPools: 12,
    activePools: 8,
    pendingWithdrawals: 23,
    systemHealth: 'healthy'
  };

  const mockUsers: User[] = [
    {
      id: '1',
      email: 'john.doe@example.com',
      name: 'John Doe',
      role: 'user',
      status: 'active',
      balance: 5420.50,
      lastLogin: new Date('2024-01-20T10:30:00'),
      createdAt: new Date('2023-12-01T09:00:00'),
      kycStatus: 'approved',
      twoFactorEnabled: true
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      role: 'user',
      status: 'active',
      balance: 12750.25,
      lastLogin: new Date('2024-01-19T16:45:00'),
      createdAt: new Date('2023-11-15T14:20:00'),
      kycStatus: 'approved',
      twoFactorEnabled: false
    },
    {
      id: '3',
      email: 'bob.wilson@example.com',
      name: 'Bob Wilson',
      role: 'user',
      status: 'suspended',
      balance: 0,
      lastLogin: new Date('2024-01-10T08:15:00'),
      createdAt: new Date('2024-01-05T11:30:00'),
      kycStatus: 'pending',
      twoFactorEnabled: false
    }
  ];

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      userId: '1',
      userEmail: 'john.doe@example.com',
      type: 'deposit',
      asset: 'BTC',
      amount: 0.5,
      status: 'completed',
      timestamp: new Date('2024-01-20T10:30:00'),
      txHash: '0x1234...abcd',
      fee: 0.001
    },
    {
      id: '2',
      userId: '2',
      userEmail: 'jane.smith@example.com',
      type: 'withdraw',
      asset: 'USDT',
      amount: 1000,
      status: 'pending',
      timestamp: new Date('2024-01-20T09:15:00'),
      fee: 5
    },
    {
      id: '3',
      userId: '1',
      userEmail: 'john.doe@example.com',
      type: 'trade',
      asset: 'ETH',
      amount: 2.5,
      status: 'completed',
      timestamp: new Date('2024-01-19T16:45:00'),
      fee: 2.5
    }
  ];

  const mockPools: Pool[] = [
    {
      id: '1',
      name: 'Bitcoin Growth Pool',
      strategy: 'Dollar Cost Averaging',
      totalInvested: 850000,
      totalInvestors: 156,
      apy: 12.5,
      status: 'active',
      createdAt: new Date('2024-01-01'),
      performance: 8.2
    },
    {
      id: '2',
      name: 'Ethereum Staking Pool',
      strategy: 'ETH 2.0 Staking',
      totalInvested: 450000,
      totalInvestors: 89,
      apy: 8.2,
      status: 'active',
      createdAt: new Date('2023-12-15'),
      performance: 5.1
    }
  ];

  const mockSystemConfig: SystemConfig = {
    maintenanceMode: false,
    tradingEnabled: true,
    depositsEnabled: true,
    withdrawalsEnabled: true,
    registrationEnabled: true,
    kycRequired: true,
    maxWithdrawalDaily: 50000,
    tradingFee: 0.1,
    withdrawalFee: 0.5,
    minDepositAmount: 10
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Load stats
      await execute('stats', async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return mockStats;
      });
      
      // Load users
      await execute('users', async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
        return mockUsers;
      });
      
      // Load transactions
      await execute('transactions', async () => {
        await new Promise(resolve => setTimeout(resolve, 700));
        return mockTransactions;
      });
      
      // Load pools
      await execute('pools', async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockPools;
      });
      
      // Load system config
      await execute('config', async () => {
        await new Promise(resolve => setTimeout(resolve, 400));
        return mockSystemConfig;
      });
      
    } catch (error) {
      // Errors are handled by the hook
    }
  };
  
  // Update local state when operations complete
  useEffect(() => {
    if (statsOperation.data) {
      setStats(statsOperation.data);
    }
  }, [statsOperation.data]);
  
  useEffect(() => {
    if (usersOperation.data) {
      setUsers(usersOperation.data);
    }
  }, [usersOperation.data]);
  
  useEffect(() => {
    if (transactionsOperation.data) {
      setTransactions(transactionsOperation.data);
    }
  }, [transactionsOperation.data]);
  
  useEffect(() => {
    if (poolsOperation.data) {
      setPools(poolsOperation.data);
    }
  }, [poolsOperation.data]);
  
  useEffect(() => {
    if (configOperation.data) {
      setSystemConfig(configOperation.data);
    }
  }, [configOperation.data]);

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const refreshData = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const updateUserStatus = async (userId: string, status: string) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId ? { ...user, status: status as any } : user
      )
    );
    alert(`User status updated to ${status}`);
  };

  const updateTransactionStatus = async (transactionId: string, status: string) => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.id === transactionId ? { ...tx, status: status as any } : tx
      )
    );
    alert(`Transaction status updated to ${status}`);
  };

  const updateSystemConfig = async (config: Partial<SystemConfig>) => {
    if (systemConfig) {
      setSystemConfig({ ...systemConfig, ...config });
      alert('System configuration updated successfully');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'suspended':
      case 'failed':
      case 'cancelled':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (isAnyLoading && !statsOperation.data && !usersOperation.data) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage users, transactions, and system settings</p>
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

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'transactions', label: 'Transactions', icon: Activity },
            { id: 'pools', label: 'Pools', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Error Display for Stats */}
          <ErrorDisplay 
            error={statsOperation.error} 
            onRetry={() => execute('stats', async () => {
              await new Promise(resolve => setTimeout(resolve, 800));
              return mockStats;
            })}
            className="mb-6"
          />
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsOperation.loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : stats && (
            <>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-sm text-green-600">{stats.activeUsers} active</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Volume</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalVolume)}</p>
                  <p className="text-sm text-gray-500">{stats.totalTransactions} transactions</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Investment Pools</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPools}</p>
                  <p className="text-sm text-green-600">{stats.activePools} active</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">System Health</p>
                    <p className={`text-2xl font-bold capitalize ${getHealthColor(stats.systemHealth)}`}>
                      {stats.systemHealth}
                    </p>
                    <p className="text-sm text-yellow-600">{stats.pendingWithdrawals} pending withdrawals</p>
                  </div>
                  <Server className={`w-8 h-8 ${getHealthColor(stats.systemHealth)}`} />
                </div>
              </div>
            </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              </div>
              <ErrorDisplay 
                error={transactionsOperation.error} 
                onRetry={() => execute('transactions', async () => {
                  await new Promise(resolve => setTimeout(resolve, 700));
                  return mockTransactions;
                })}
                className="m-4"
              />
              {transactionsOperation.loading ? (
                <div className="p-4">
                  <LoadingSkeleton className="h-20" />
                </div>
              ) : (
                <div className="p-4">
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          tx.status === 'completed' ? 'bg-green-500' :
                          tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tx.type.toUpperCase()} - {tx.asset}
                          </p>
                          <p className="text-xs text-gray-500">{tx.userEmail}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {tx.amount} {tx.asset}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tx.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">High withdrawal volume</p>
                      <p className="text-xs text-gray-500">23 pending withdrawals require review</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">System backup completed</p>
                      <p className="text-xs text-gray-500">Daily backup finished successfully</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">New pool created</p>
                      <p className="text-xs text-gray-500">DeFi Yield Farming pool is now active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KYC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2FA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatusColor(user.status)
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(user.balance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatusColor(user.kycStatus)
                        }`}>
                          {user.kycStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.twoFactorEnabled ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <select
                            value={user.status}
                            onChange={(e) => updateUserStatus(user.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspend</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdraw">Withdraw</option>
                    <option value="trade">Trade</option>
                    <option value="pool_investment">Pool Investment</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tx.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.userEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.asset}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.amount} {tx.asset}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatusColor(tx.status)
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.timestamp.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          {tx.status === 'pending' && (
                            <select
                              value={tx.status}
                              onChange={(e) => updateTransactionStatus(tx.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="completed">Approve</option>
                              <option value="failed">Reject</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pools Tab */}
      {activeTab === 'pools' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Investment Pools</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Create Pool</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool) => (
              <div key={pool.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{pool.name}</h3>
                      <p className="text-sm text-gray-600">{pool.strategy}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getStatusColor(pool.status)
                    }`}>
                      {pool.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Invested</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(pool.totalInvested)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Investors</span>
                      <span className="text-sm font-medium text-gray-900">{pool.totalInvestors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">APY</span>
                      <span className="text-sm font-medium text-green-600">{pool.apy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Performance</span>
                      <span className={`text-sm font-medium ${
                        pool.performance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {pool.performance >= 0 ? '+' : ''}{pool.performance}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button className="flex-1 py-2 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                    <button className="py-2 px-3 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && systemConfig && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Controls */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">System Controls</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Maintenance Mode</label>
                    <p className="text-xs text-gray-500">Disable all user operations</p>
                  </div>
                  <button
                    onClick={() => updateSystemConfig({ maintenanceMode: !systemConfig.maintenanceMode })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      systemConfig.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemConfig.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Trading Enabled</label>
                    <p className="text-xs text-gray-500">Allow users to trade</p>
                  </div>
                  <button
                    onClick={() => updateSystemConfig({ tradingEnabled: !systemConfig.tradingEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      systemConfig.tradingEnabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemConfig.tradingEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Deposits Enabled</label>
                    <p className="text-xs text-gray-500">Allow deposits</p>
                  </div>
                  <button
                    onClick={() => updateSystemConfig({ depositsEnabled: !systemConfig.depositsEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      systemConfig.depositsEnabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemConfig.depositsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Withdrawals Enabled</label>
                    <p className="text-xs text-gray-500">Allow withdrawals</p>
                  </div>
                  <button
                    onClick={() => updateSystemConfig({ withdrawalsEnabled: !systemConfig.withdrawalsEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      systemConfig.withdrawalsEnabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemConfig.withdrawalsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Fee Settings */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Fee Settings</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trading Fee (%)
                  </label>
                  <input
                    type="number"
                    value={systemConfig.tradingFee}
                    onChange={(e) => updateSystemConfig({ tradingFee: parseFloat(e.target.value) })}
                    step="0.01"
                    min="0"
                    max="5"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Fee (%)
                  </label>
                  <input
                    type="number"
                    value={systemConfig.withdrawalFee}
                    onChange={(e) => updateSystemConfig({ withdrawalFee: parseFloat(e.target.value) })}
                    step="0.01"
                    min="0"
                    max="5"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Daily Withdrawal ($)
                  </label>
                  <input
                    type="number"
                    value={systemConfig.maxWithdrawalDaily}
                    onChange={(e) => updateSystemConfig({ maxWithdrawalDaily: parseFloat(e.target.value) })}
                    step="1000"
                    min="1000"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Deposit Amount ($)
                  </label>
                  <input
                    type="number"
                    value={systemConfig.minDepositAmount}
                    onChange={(e) => updateSystemConfig({ minDepositAmount: parseFloat(e.target.value) })}
                    step="1"
                    min="1"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;