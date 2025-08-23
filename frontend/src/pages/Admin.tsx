import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import Card from '../components/Card';
import { NETWORK_OPTIONS } from '../constants/networks';
import {
  Search,
  Minus,
  Upload,
  Check,
  X,
  Eye,
  DollarSign,
  Bitcoin,
  Coins,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  email: string;
  name: string;
  balances: {
    BTC: number;
    ETH: number;
    TRC20: number;
    USD: number;
  };
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  currency: string;
  amount: number;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reason?: string;
}

interface DepositAddress {
  id: string;
  network: string;
  address: string;
  qrCodeUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// interface WalletConfig {
//   depositAddresses: {
//     BTC: string;
//     ETH: string;
//     TRC20: string;
//     BNB: string;
//   };
//   qrCodes: {
//     BTC: string | null;
//     ETH: string | null;
//     TRC20: string | null;
//     BNB: string | null;
//   };
// }

// Helper function to get currency icons
// const getCurrencyIcon = (network: string) => {
//   switch (network) {
//     case 'Bitcoin (BTC)':
//       return <Bitcoin className="w-4 h-4 text-orange-400" />;
//     case 'Ethereum (ETH)':
//       return <Coins className="w-4 h-4 text-blue-400" />;
//     case 'Tether (USDT TRC20)':
//       return <DollarSign className="w-4 h-4 text-green-400" />;
//     case 'Binance Coin (BNB)':
//       return <Coins className="w-4 h-4 text-yellow-400" />;
//     case 'Litecoin (LTC)':
//       return <Coins className="w-4 h-4 text-gray-400" />;
//     case 'Ripple (XRP)':
//       return <Coins className="w-4 h-4 text-blue-600" />;
//     default:
//       return <Coins className="w-4 h-4 text-slate-400" />;
//   }
// };

const Admin: React.FC = () => {
  const { user, token, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    'balance' | 'withdrawals' | 'wallet'
  >('balance');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // User Balance Management State
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceForm, setBalanceForm] = useState({
    currency: 'USD',
    type: 'add',
    amount: '',
  });
  const [showBalanceModal, setShowBalanceModal] = useState(false);

  // Withdrawal Requests State
  const [withdrawalRequests, setWithdrawalRequests] = useState<
    WithdrawalRequest[]
  >([]);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequest | null>(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  // Deposit Addresses Management State
  const [depositAddresses, setDepositAddresses] = useState<DepositAddress[]>(
    []
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<DepositAddress | null>(
    null
  );
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    network: '',
    address: '',
    qrCode: null as File | null,
  });
  const [editAddressForm, setEditAddressForm] = useState({
    network: '',
    address: '',
    qrCode: null as File | null,
  });
  const [error, setError] = useState<string | null>(null);

  // Debug authentication state
  useEffect(() => {
    console.log('Admin component - Auth state:', {
      user,
      token,
      isAuthenticated,
      userRole: user?.role,
      isAdmin: user?.role === 'admin',
    });

    // Set auth loading to false after checking
    setAuthLoading(false);
  }, [user, token, isAuthenticated]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError('Failed to load users. Please try again.');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawalRequests = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockRequests: WithdrawalRequest[] = [
        {
          id: '1',
          userId: 'user1',
          userEmail: 'john@example.com',
          userName: 'John Doe',
          currency: 'BTC',
          amount: 0.5,
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          status: 'pending',
          createdAt: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          userId: 'user2',
          userEmail: 'jane@example.com',
          userName: 'Jane Smith',
          currency: 'ETH',
          amount: 2.5,
          address: '0x742d35Cc6634C0532925a3b8D4C0d886E',
          status: 'pending',
          createdAt: '2024-01-15T09:15:00Z',
        },
      ];
      setWithdrawalRequests(mockRequests);
    } catch (error) {
      console.error('Failed to load withdrawal requests:', error);
    }
  };

  const loadDepositAddresses = async () => {
    try {
      setError(null);

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/deposit-addresses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setDepositAddresses(data.depositAddresses || []);
      } else {
        setError('Failed to load deposit addresses. Please try again.');
      }
    } catch (error) {
      console.error('Failed to load deposit addresses:', error);
      setError('Network error. Please check your connection and try again.');
    }
  };

  // Load initial data
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      return;
    }
    loadUsers();
    loadWithdrawalRequests();
    loadDepositAddresses();
  }, [user]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Checking authentication...</p>
        </Card>
      </div>
    );
  }

  // Check admin access - must be authenticated AND have admin role
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            Access Denied
          </h2>
          <p className="text-slate-400 mb-4">
            {!isAuthenticated || !user
              ? 'You must be logged in to access this page.'
              : "You don't have admin privileges to access this page."}
          </p>
          <p className="text-slate-500 text-sm">
            Debug: Auth={isAuthenticated ? 'true' : 'false'}, User=
            {user ? 'exists' : 'null'}, Role={user?.role || 'none'}
          </p>
        </Card>
      </div>
    );
  }

  const handleBalanceAdjustment = async () => {
    if (!selectedUser || !balanceForm.amount) return;

    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/users/${
          selectedUser.id
        }/balance-adjustment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currency: balanceForm.currency,
            type: balanceForm.type,
            amount: parseFloat(balanceForm.amount),
          }),
        }
      );

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      if (response.ok) {
        await loadUsers();
        setShowBalanceModal(false);
        setBalanceForm({
          currency: 'USD',
          type: 'add',
          amount: '',
        });
        setSelectedUser(null);
      } else {
        setError('Failed to adjust balance. Please try again.');
      }
    } catch (error) {
      console.error('Failed to adjust balance:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalAction = async (
    requestId: string,
    action: 'approve' | 'reject',
    reason?: string
  ) => {
    try {
      setLoading(true);
      // Mock API call - replace with actual endpoint
      console.log(`${action} withdrawal request ${requestId}`, reason);

      // Update local state
      setWithdrawalRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                status: action === 'approve' ? 'approved' : 'rejected',
                reason,
              }
            : req
        )
      );
      setShowWithdrawalModal(false);
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error('Failed to process withdrawal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      if (!newAddressForm.network || !newAddressForm.address) {
        setError('Network and address are required.');
        return;
      }

      const formData = new FormData();
      formData.append('network', newAddressForm.network);
      formData.append('address', newAddressForm.address);
      if (newAddressForm.qrCode) {
        formData.append('qrCode', newAddressForm.qrCode);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/deposit-addresses`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      if (response.ok) {
        await loadDepositAddresses();
        setShowAddAddressModal(false);
        setNewAddressForm({ network: '', address: '', qrCode: null });
      } else {
        const errorData = await response.json();
        setError(
          errorData.message || 'Failed to create address. Please try again.'
        );
      }
    } catch (error) {
      console.error('Failed to create address:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      if (
        !editingAddress ||
        !editAddressForm.network ||
        !editAddressForm.address
      ) {
        setError('Network and address are required.');
        return;
      }

      const formData = new FormData();
      formData.append('network', editAddressForm.network);
      formData.append('address', editAddressForm.address);
      if (editAddressForm.qrCode) {
        formData.append('qrCode', editAddressForm.qrCode);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/deposit-addresses/${
          editingAddress.id
        }`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      if (response.ok) {
        await loadDepositAddresses();
        setShowEditAddressModal(false);
        setEditingAddress(null);
        setEditAddressForm({ network: '', address: '', qrCode: null });
      } else {
        const errorData = await response.json();
        setError(
          errorData.message || 'Failed to update address. Please try again.'
        );
      }
    } catch (error) {
      console.error('Failed to update address:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      if (!deleteTarget) {
        setError('No address selected for deletion.');
        return;
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/admin/deposit-addresses/${deleteTarget}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      if (response.ok) {
        await loadDepositAddresses();
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
      } else {
        const errorData = await response.json();
        setError(
          errorData.message || 'Failed to delete address. Please try again.'
        );
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address: DepositAddress) => {
    setEditingAddress(address);
    setEditAddressForm({
      network: address.network,
      address: address.address,
      qrCode: null,
    });
    setShowEditAddressModal(true);
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    setEditAddressForm({ network: '', address: '', qrCode: null });
    setShowEditAddressModal(false);
  };

  const confirmDelete = (addressId: string) => {
    setDeleteTarget(addressId);
    setShowDeleteConfirm(true);
  };

  const handleCancelAdd = () => {
    setNewAddressForm({ network: '', address: '', qrCode: null });
    setShowAddAddressModal(false);
  };

  const handleSubmitNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressForm.network || !newAddressForm.address) {
      setError('Please fill in all required fields.');
      return;
    }

    await handleCreateAddress();
  };

  const handleSubmitEditAddress = async () => {
    if (
      !editAddressForm.network ||
      !editAddressForm.address ||
      !editingAddress
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    await handleUpdateAddress();
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingWithdrawals = withdrawalRequests.filter(
    (req) => req.status === 'pending'
  );

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'BTC':
        return <Bitcoin className="w-5 h-5" />;
      case 'ETH':
        return <Coins className="w-5 h-5" />;
      case 'TRC20':
        return <Coins className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400">
            Manage user balances, withdrawal requests, and wallet configuration
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <div className="flex items-center space-x-2">
              <X className="w-5 h-5 text-red-400" />
              <span className="text-red-200 font-medium">Error</span>
            </div>
            <p className="text-red-100 mt-2">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-red-300 hover:text-red-100 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'balance', label: 'User Balance', icon: DollarSign },
            { id: 'withdrawals', label: 'Withdrawals', icon: Minus },
            { id: 'wallet', label: 'Deposit Addresses', icon: Upload },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as 'balance' | 'withdrawals' | 'wallet')
                }
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Balance Management */}
        {activeTab === 'balance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                User Balance Management
              </h2>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">
                        User
                      </th>

                      <th className="text-left py-3 px-4 text-slate-300 font-medium">
                        Balance
                      </th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-white font-medium">
                              {user.name}
                            </div>
                            <div className="text-slate-400 text-sm">
                              {user.email}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-white">
                          ${user.balances.USD.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBalanceModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Adjust Balance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Withdrawal Requests */}
        {activeTab === 'withdrawals' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Pending Withdrawal Requests
              </h2>

              <div className="space-y-4">
                {pendingWithdrawals.map((request) => (
                  <div
                    key={request.id}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getCurrencyIcon(request.currency)}
                          <span className="text-white font-medium">
                            {request.currency}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {request.userName}
                          </div>
                          <div className="text-slate-400 text-sm">
                            {request.userEmail}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">
                            {request.amount} {request.currency}
                          </div>
                          <div className="text-slate-400 text-sm">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedWithdrawal(request);
                            setShowWithdrawalModal(true);
                          }}
                          className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Review</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {pendingWithdrawals.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    No pending withdrawal requests
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Deposit Addresses Management */}
        {activeTab === 'wallet' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">
                    Deposit Addresses Management
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Manage cryptocurrency deposit addresses and QR codes
                  </p>
                </div>
                <button
                  onClick={() => setShowAddAddressModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Deposit Address</span>
                </button>
              </div>

              {/* Table */}
              <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-750">
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                        Network
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                        Wallet Address
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                        QR Code
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {depositAddresses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-slate-400"
                        >
                          No deposit addresses configured. Click "Add New
                          Deposit Address" to get started.
                        </td>
                      </tr>
                    ) : (
                      depositAddresses.map((address) => (
                        <tr
                          key={address.id}
                          className="border-b border-slate-700 hover:bg-slate-750 transition-colors"
                        >
                          {/* Network */}
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              {getCurrencyIcon(address.network)}
                              <span className="text-white text-sm font-medium">
                                {address.network}
                              </span>
                            </div>
                          </td>

                          {/* Wallet Address */}
                          <td className="py-4 px-4">
                            <span className="text-white text-sm font-mono break-all">
                              {address.address}
                            </span>
                          </td>

                          {/* QR Code */}
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              {address.qrCodeUrl ? (
                                <img
                                  src={`${address.qrCodeUrl}`}
                                  alt={`${address.network} QR Code`}
                                  className="w-10 h-10 object-cover rounded border border-slate-600"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-slate-700 border border-slate-600 rounded flex items-center justify-center">
                                  <Upload className="w-4 h-4 text-slate-400" />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditAddress(address)}
                                className="p-2 hover:bg-slate-600 rounded transition-colors group"
                                title="Edit address"
                              >
                                <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-white" />
                              </button>
                              <button
                                onClick={() => confirmDelete(address.id)}
                                className="p-2 hover:bg-red-600 rounded transition-colors group"
                                title="Delete address"
                              >
                                <Trash2 className="w-4 h-4 text-red-400 group-hover:text-white" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Add New Deposit Address Modal */}
            {showAddAddressModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Add New Deposit Address
                    </h3>
                    <button
                      onClick={handleCancelAdd}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitNewAddress} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Network
                      </label>
                      <select
                        value={newAddressForm.network}
                        onChange={(e) =>
                          setNewAddressForm({
                            ...newAddressForm,
                            network: e.target.value,
                          })
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Network</option>
                        {NETWORK_OPTIONS.map((network) => (
                          <option key={network} value={network}>
                            {network}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Wallet Address
                      </label>
                      <input
                        type="text"
                        value={newAddressForm.address}
                        onChange={(e) =>
                          setNewAddressForm({
                            ...newAddressForm,
                            address: e.target.value,
                          })
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter wallet address"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        QR Code (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setNewAddressForm({
                            ...newAddressForm,
                            qrCode: file || null,
                          });
                        }}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={handleCancelAdd}
                        className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        {loading ? 'Creating...' : 'Create Address'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Deposit Address Modal */}
            {editingAddress && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Edit Deposit Address
                    </h3>
                    <button
                      onClick={handleCancelEdit}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={handleSubmitEditAddress}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Network
                      </label>
                      <select
                        value={editAddressForm.network}
                        onChange={(e) =>
                          setEditAddressForm({
                            ...editAddressForm,
                            network: e.target.value,
                          })
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Network</option>
                        {NETWORK_OPTIONS.map((network) => (
                          <option key={network} value={network}>
                            {network}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Wallet Address
                      </label>
                      <input
                        type="text"
                        value={editAddressForm.address}
                        onChange={(e) =>
                          setEditAddressForm({
                            ...editAddressForm,
                            address: e.target.value,
                          })
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter wallet address"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        QR Code (Optional)
                      </label>
                      {editingAddress.qrCodeUrl && (
                        <div className="mb-2">
                          <img
                            src={`${import.meta.env.VITE_API_URL}${
                              editingAddress.qrCodeUrl
                            }`}
                            alt="Current QR Code"
                            className="w-16 h-16 object-cover rounded border border-slate-600"
                          />
                          <p className="text-xs text-slate-400 mt-1">
                            Current QR Code
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setEditAddressForm({
                            ...editAddressForm,
                            qrCode: file || null,
                          });
                        }}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        {loading ? 'Updating...' : 'Update Address'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Balance Adjustment Modal */}
        {showBalanceModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Adjust Balance - {selectedUser.name}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={balanceForm.currency}
                    onChange={(e) =>
                      setBalanceForm((prev) => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Action
                  </label>
                  <select
                    value={balanceForm.type}
                    onChange={(e) =>
                      setBalanceForm((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="add">Add Balance</option>
                    <option value="reduce">Reduce Balance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={balanceForm.amount}
                    onChange={(e) =>
                      setBalanceForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleBalanceAdjustment}
                  disabled={loading || !balanceForm.amount}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Processing...' : 'Apply Adjustment'}
                </button>
                <button
                  onClick={() => {
                    setShowBalanceModal(false);
                    setSelectedUser(null);
                    setBalanceForm({
                      currency: 'USD',
                      type: 'add',
                      amount: '',
                    });
                  }}
                  className="px-6 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Withdrawal Review Modal */}
        {showWithdrawalModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Review Withdrawal Request
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">User:</span>
                  <span className="text-white">
                    {selectedWithdrawal.userName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white">
                    {selectedWithdrawal.userEmail}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Currency:</span>
                  <span className="text-white">
                    {selectedWithdrawal.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="text-white">
                    {selectedWithdrawal.amount} {selectedWithdrawal.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Address:</span>
                  <span className="text-white text-sm break-all">
                    {selectedWithdrawal.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="text-white">
                    {new Date(selectedWithdrawal.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() =>
                    handleWithdrawalAction(selectedWithdrawal.id, 'approve')
                  }
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() =>
                    handleWithdrawalAction(
                      selectedWithdrawal.id,
                      'reject',
                      'Rejected by admin'
                    )
                  }
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => {
                    setShowWithdrawalModal(false);
                    setSelectedWithdrawal(null);
                  }}
                  className="px-6 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && deleteTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Delete Deposit Address
              </h3>

              <p className="text-slate-300 mb-6">
                Are you sure you want to delete the {deleteTarget} deposit
                address? This action cannot be undone.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleDeleteAddress()}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>{loading ? 'Deleting...' : 'Delete'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
