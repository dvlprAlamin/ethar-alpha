import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import Card from '../components/Card';
import { NETWORK_OPTIONS } from '../constants/networks';
import { toast } from 'sonner';
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
  TrendingUp,
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
  requestedAt: string;
  reason?: string;
}

interface DepositAddress {
  _id: string;
  network: string;
  address: string;
  qrCodeUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Trade {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  status: 'active' | 'completed';
  profitLoss: 'profit' | 'loss' | null;
  returnPercentage: number;
  finalAmount: number;
  createdAt: string;
  updatedAt: string;
}

const Admin: React.FC = () => {
  const { user, token, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    'balance' | 'withdrawals' | 'wallet' | 'trades'
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
  console.log('selectedWithdrawal', selectedWithdrawal);
  // Deposit Addresses Management State
  const [depositAddresses, setDepositAddresses] = useState<DepositAddress[]>(
    []
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<DepositAddress | null>(
    null
  );
  console.log(
    'showDeleteConfirm && deleteTarget',
    showDeleteConfirm,
    deleteTarget
  );
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  // const [showEditAddressModal, setShowEditAddressModal] = useState(false);
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

  // Trade Management State
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeForm, setTradeForm] = useState({
    profitLoss: '',
    returnPercentage: '',
    status: 'completed' as 'active' | 'completed',
  });

  // User Deletion State
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Debug authentication state
  useEffect(() => {
    // Set auth loading to false after checking
    setAuthLoading(false);
  }, [user, token, isAuthenticated]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        const errorMessage =
          'Authentication token not found. Please log in again.';
        setError(errorMessage);
        toast.error(errorMessage);
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
        const errorMessage = 'Authentication failed. Please log in again.';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      if (response.status === 403) {
        const errorMessage = 'Access denied. Admin privileges required.';
        setError(errorMessage);
        toast.error(errorMessage);
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
      setError(null);

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/withdrawal-requests`,
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
        setWithdrawalRequests(data.withdrawalRequests || []);
      } else {
        setError('Failed to load withdrawal requests. Please try again.');
      }
    } catch (error) {
      console.error('Failed to load withdrawal requests:', error);
      setError('Network error. Please check your connection and try again.');
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

  const loadTrades = async () => {
    try {
      setError(null);

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/trades/all`,
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
        setTrades(data.trades || []);
      } else {
        setError('Failed to load trades. Please try again.');
      }
    } catch (error) {
      console.error('Failed to load trades:', error);
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
    loadTrades();
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
        await response.json();
        await loadUsers();
        setShowBalanceModal(false);
        setBalanceForm({
          currency: 'USD',
          type: 'add',
          amount: '',
        });
        setSelectedUser(null);
        toast.success(
          `Balance ${
            balanceForm.type === 'add' ? 'increased' : 'decreased'
          } successfully for ${selectedUser.name || selectedUser.email}`
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || 'Failed to adjust balance. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to adjust balance:', error);
      const errorMessage =
        'Network error. Please check your connection and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUserDelete = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/users/${userToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        toast.error('Authentication failed. Please log in again.');
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        toast.error('Access denied. Admin privileges required.');
        return;
      }

      if (response.ok) {
        await response.json();
        await loadUsers();
        setShowDeleteUserModal(false);
        setUserToDelete(null);
        toast.success(
          `User ${userToDelete.name || userToDelete.email} deleted successfully`
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || 'Failed to delete user. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      const errorMessage =
        'Network error. Please check your connection and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalAction = async (
    requestId: string,
    action: 'approve' | 'reject',
    reason?: string
  ) => {
    console.log(`Attempting to ${action} withdrawal:`, {
      requestId,
      action,
      reason,
    });
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/admin/withdrawal-requests/${requestId}/${action}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            action === 'approve' ? { notes: reason } : { reason }
          ),
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
        const result = await response.json();
        console.log(`Withdrawal ${action} successful:`, result);
        // Reload withdrawal requests to get updated data
        await loadWithdrawalRequests();
        setShowWithdrawalModal(false);
        setSelectedWithdrawal(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Withdrawal ${action} failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        setError(
          errorData.error ||
            `Failed to ${action} withdrawal request. Please try again.`
        );
      }
    } catch (error) {
      console.error('Failed to process withdrawal:', error);
      setError('Network error. Please check your connection and try again.');
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
          editingAddress._id
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
        // setShowEditAddressModal(false);
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
    // setShowEditAddressModal(true);
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    setEditAddressForm({ network: '', address: '', qrCode: null });
    // setShowEditAddressModal(false);
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

  const handleSubmitEditAddress = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <div className="grid grid-cols-2 gap-3 sm:flex sm:space-x-3 sm:gap-0 mb-8">
          {[
            { id: 'balance', label: 'User Balance', icon: DollarSign },
            { id: 'withdrawals', label: 'Withdrawals', icon: Minus },
            { id: 'wallet', label: 'Deposit Addresses', icon: Upload },
            { id: 'trades', label: 'Trade Management', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const pendingCount =
              tab.id === 'withdrawals' ? pendingWithdrawals.length : 0;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as 'balance' | 'withdrawals' | 'wallet' | 'trades'
                  )
                }
                className={`flex items-center justify-center sm:space-x-2 px-4 py-3 rounded-lg font-medium transition-colors relative text-center ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 hidden sm:block" />
                <span>{tab.label}</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center min-w-[1.5rem]">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Trade Result Modal */}
        {showTradeModal && selectedTrade && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Set Trade Result
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">User:</span>
                  <span className="text-white">{selectedTrade.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="text-white">
                    ${selectedTrade.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="text-white">
                    {new Date(selectedTrade.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedTrade || !tradeForm.returnPercentage) return;

                  try {
                    setLoading(true);
                    const response = await fetch(
                      `${import.meta.env.VITE_API_URL}/trades/${
                        selectedTrade._id
                      }/result`,
                      {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          profitLoss: tradeForm.profitLoss,
                          returnPercentage: parseFloat(
                            tradeForm.returnPercentage
                          ),
                        }),
                      }
                    );

                    if (response.ok) {
                      toast.success('Trade result updated successfully');
                      setShowTradeModal(false);
                      setSelectedTrade(null);
                      setTradeForm({
                        profitLoss: 'profit',
                        returnPercentage: '',
                        status: 'completed',
                      });
                      loadTrades(); // Reload trades
                    } else {
                      const errorData = await response.json();
                      toast.error(
                        errorData.message || 'Failed to update trade result'
                      );
                    }
                  } catch (error) {
                    console.error('Error updating trade result:', error);
                    toast.error('Failed to update trade result');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Result
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="profitLoss"
                        value="profit"
                        checked={tradeForm.profitLoss === 'profit'}
                        onChange={(e) =>
                          setTradeForm({
                            ...tradeForm,
                            profitLoss: e.target.value as 'profit' | 'loss',
                          })
                        }
                        className="mr-2 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-green-400">Profit</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="profitLoss"
                        value="loss"
                        checked={tradeForm.profitLoss === 'loss'}
                        onChange={(e) =>
                          setTradeForm({
                            ...tradeForm,
                            profitLoss: e.target.value as 'profit' | 'loss',
                          })
                        }
                        className="mr-2 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-red-400">Loss</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Return Percentage
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tradeForm.returnPercentage}
                    onChange={(e) =>
                      setTradeForm({
                        ...tradeForm,
                        returnPercentage: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter return percentage (e.g., 8.2 or -3.5)"
                    required
                  />
                  <p className="text-slate-400 text-xs mt-1">
                    Use positive values for profit, negative for loss
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading || !tradeForm.returnPercentage}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Updating...' : 'Update Trade'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTradeModal(false);
                      setSelectedTrade(null);
                      setTradeForm({
                        profitLoss: 'profit',
                        returnPercentage: '',
                        status: 'completed',
                      });
                    }}
                    className="px-6 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Trade Management */}
        {activeTab === 'trades' && (
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
                    Trade Management
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Manage user trades and set profit/loss outcomes
                  </p>
                </div>
              </div>

              {/* Table */}

              <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-slate-750">
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                        Profit/Loss
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                        Return (%)
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-slate-400"
                        >
                          No trades found
                        </td>
                      </tr>
                    ) : (
                      trades.map((trade) => (
                        <tr
                          key={trade._id}
                          className="border-b border-slate-700 hover:bg-slate-750 transition-colors"
                        >
                          {/* User */}
                          <td className="py-4 px-4">
                            <div>
                              <div className="text-white text-sm font-medium">
                                {trade.userName || 'Unknown User'}
                              </div>
                              <div className="text-slate-400 text-xs">
                                {trade.userEmail || 'No email'}
                              </div>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-4">
                            <span className="text-white text-sm font-medium">
                              ${trade.amount.toFixed(2)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                trade.status === 'active'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {trade.status}
                            </span>
                          </td>

                          {/* Profit/Loss */}
                          <td className="py-4 px-4">
                            {trade.status === 'completed' ? (
                              <span
                                className={`text-sm font-medium ${
                                  trade.profitLoss === 'profit'
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {trade.profitLoss === 'profit'
                                  ? 'Profit'
                                  : 'Loss'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </td>

                          {/* Return % */}
                          <td className="py-4 px-4">
                            {trade.status === 'completed' &&
                            trade.returnPercentage ? (
                              <span
                                className={`text-sm font-medium ${
                                  trade.returnPercentage > 0
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {trade.returnPercentage > 0 ? '+' : ''}
                                {trade.returnPercentage}%
                              </span>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-4 px-4">
                            <span className="text-slate-400 text-sm">
                              {new Date(trade.createdAt).toLocaleDateString()}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4">
                            {trade.status === 'active' && (
                              <button
                                onClick={() => {
                                  setSelectedTrade(trade);
                                  setTradeForm({
                                    profitLoss: 'profit',
                                    returnPercentage: '',
                                    status: 'completed',
                                  });
                                  setShowTradeModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                              >
                                Set Result
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

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
                              {user.name || 'Unknown User'}
                            </div>
                            <div className="text-slate-400 text-sm">
                              {user.email || 'No email'}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-white">
                          ${user.balances.USD.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowBalanceModal(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Adjust Balance
                            </button>
                            <button
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteUserModal(true);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

              <div className="space-y-4 overflow-auto">
                {pendingWithdrawals.map((request) => (
                  <div
                    key={request.id}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-700 min-w-fit"
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
                            {request.userName || 'Unknown User'}
                          </div>
                          <div className="text-slate-400 text-sm">
                            {request.userEmail || 'No email'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">
                            {request.amount} {request.currency}
                          </div>
                          <div className="text-slate-400 text-sm">
                            {new Date(request.requestedAt).toLocaleDateString()}
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
              <div className="overflow-x-auto">
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                  <table className="w-full min-w-[600px]">
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
                            key={address._id}
                            className="border-b border-slate-700 hover:bg-slate-750 transition-colors"
                          >
                            {/* Network */}
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
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
                                    src={`${
                                      import.meta.env.VITE_SERVER_URL
                                    }/qr-codes/${address.qrCodeUrl}`}
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
                                  onClick={() => confirmDelete(address._id)}
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
                        QR Code
                      </label>

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

        {/* Delete User Confirmation Modal */}
        {showDeleteUserModal && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Delete User
                </h3>
              </div>

              <div className="mb-6">
                <p className="text-slate-300 mb-4">
                  Are you sure you want to delete this user? This action cannot
                  be undone.
                </p>

                <div className="bg-slate-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="text-white">
                      {userToDelete.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white">{userToDelete.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Balance:</span>
                    <span className="text-white">
                      ${userToDelete.balances?.USD?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteUserModal(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUserDelete}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{loading ? 'Deleting...' : 'Delete User'}</span>
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
                    {new Date(selectedWithdrawal.requestedAt).toLocaleString()}
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
                Are you sure you want to delete the{' '}
                {depositAddresses.find((addr) => addr._id === deleteTarget)
                  ?.network || deleteTarget}{' '}
                deposit address? This action cannot be undone.
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
