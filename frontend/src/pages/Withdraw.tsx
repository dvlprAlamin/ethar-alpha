import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

interface DepositAddress {
  _id: string;
  network: string;
  address: string;
  qrCode?: string;
  isActive: boolean;
}

const Withdraw: React.FC = () => {
  const { user, token, isAuthenticated, refreshUser } = useAuthStore();
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [depositAddresses, setDepositAddresses] = useState<DepositAddress[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch deposit addresses from API
  const fetchDepositAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/deposits/addresses`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch deposit addresses');
      }
      const data = await response.json();
      setDepositAddresses(data?.depositAddresses);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch deposit addresses'
      );
      toast.error('Failed to load networks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and refresh user
  useEffect(() => {
    fetchDepositAddresses();
  }, []);

  // Separate effect to refresh user data
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, hasToken: !!token });
    if (isAuthenticated && token) {
      console.log('Calling refreshUser...');
      refreshUser()
        .then(() => {
          console.log('refreshUser completed');
        })
        .catch((error) => {
          console.error('refreshUser failed:', error);
        });
    }
  }, [isAuthenticated, token]);

  const handleNetworkSelect = (network: string) => {
    setSelectedNetwork(network);
    setShowNetworkDropdown(false);
  };

  const handleWithdraw = async () => {
    if (!isAuthenticated || !token) {
      toast.error('Please log in to make a withdrawal');
      return;
    }

    if (!selectedNetwork) {
      toast.error('Please select a network');
      return;
    }
    if (!address.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountNum = parseFloat(amount);

    // Check if user has sufficient balance
    if (!user?.balances?.USD || user.balances.USD < amountNum) {
      toast.error(`Insufficient balance. You need $${amountNum.toFixed(2)}`);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/withdrawals`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currency: 'USD',
            amount: amountNum,
            address: address.trim(),
            network: selectedNetwork,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit withdrawal request');
      }

      toast.success(
        'Withdrawal request submitted successfully! It will be reviewed by our team.'
      );

      // Reset form
      setAddress('');
      setAmount('');
      setSelectedNetwork('');

      // Refresh user data to update balance
      const { refreshUser } = useAuthStore.getState();
      await refreshUser();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to submit withdrawal request';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  // Additional debugging for withdraw button state
  console.log('Withdraw button disabled conditions:', {
    submitting,
    noNetwork: !selectedNetwork,
    noAddress: !address.trim(),
    noAmount: !amount,
    invalidAmount: parseFloat(amount || '0') <= 0,
    insufficientBalance: (user?.balances?.USD || 0) < parseFloat(amount || '0'),
    userBalanceUSD: user?.balances?.USD,
  });
  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Withdraw</h1>
          <p className="text-slate-400">
            Send your crypto to an external wallet
          </p>
        </div>

        <div className="space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-center">Loading networks...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-200 text-sm">{error}</p>
              <button
                onClick={fetchDepositAddresses}
                className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Network Selection */}
          {!loading && !error && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Network
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors flex items-center justify-between"
                >
                  <span>{selectedNetwork || 'Select Network'}</span>
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </button>

                {showNetworkDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
                    {depositAddresses.map((network) => (
                      <button
                        onClick={() => handleNetworkSelect(network.network)}
                        key={network._id}
                        className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {network.network}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Currency Info - Fixed to USD */}
          {!loading && !error && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Currency
              </label>
              <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white">
                <span>USD (US Dollar)</span>
              </div>
            </div>
          )}

          {/* Address Input */}
          {!loading && !error && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter wallet address"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Amount Input */}
          {!loading && !error && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Amount
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pr-16 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                    USD
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAmount(user?.balances?.USD?.toString() || '0')
                  }
                  disabled={!user?.balances?.USD || user.balances.USD <= 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Max
                </button>
              </div>
              {user?.balances?.USD !== undefined && (
                <div className="mt-3 p-3 bg-slate-700 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Available balance:</span>
                    <span className="text-white font-semibold">
                      ${user.balances.USD.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Withdraw Button */}
          {!loading && !error && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              {!isAuthenticated ? (
                <div className="text-center">
                  <p className="text-slate-400 mb-3">
                    Please log in to make a withdrawal
                  </p>
                  <button
                    onClick={() => (window.location.href = '/login')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-2 px-6 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200"
                  >
                    Log In
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleWithdraw}
                  disabled={
                    submitting ||
                    !selectedNetwork ||
                    !address.trim() ||
                    !amount ||
                    parseFloat(amount) <= 0 ||
                    (user?.balances?.USD || 0) < parseFloat(amount || '0')
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-cyan-500"
                >
                  {submitting ? 'Submitting...' : 'Withdraw'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
