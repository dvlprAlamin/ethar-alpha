import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Info,
  Calculator,
  Shield,
  X
} from 'lucide-react';
import { useFormSubmission, useDataFetching } from '../hooks/useAsyncOperation';
import ErrorDisplay, { ValidationErrorDisplay } from '../components/ErrorDisplay';
import LoadingSkeleton, { ListSkeleton } from '../components/LoadingSkeleton';
import { validateAmount, showSuccessToast } from '../utils/errorHandling';

interface WithdrawLimits {
  daily: number;
  dailyUsed: number;
  minimum: number;
  maximum: number;
  fee: number;
  feeType: 'fixed' | 'percentage';
}

interface WithdrawHistory {
  id: string;
  asset: string;
  amount: number;
  address: string;
  txHash: string;
  fee: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  timestamp: Date;
  network: string;
}

const Withdraw: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [selectedAsset, setSelectedAsset] = useState(searchParams.get('asset') || 'BTC');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLimits, setWithdrawLimits] = useState<WithdrawLimits | null>(null);
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawHistory[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const { 
    data: limitsData, 
    loading: limitsLoading, 
    error: limitsError, 
    fetch: fetchLimitsData 
  } = useDataFetching();
  
  const { 
    data: historyData, 
    loading: historyLoading, 
    error: historyError, 
    fetch: fetchHistoryData,
    refetch: refetchHistory 
  } = useDataFetching();
  
  const { submit: submitWithdraw, loading: submitting, error: submitError } = useFormSubmission({
    onSuccess: () => {
      setWithdrawAddress('');
      setWithdrawAmount('');
      setValidationErrors([]);
      setShowConfirmation(false);
      showSuccessToast('Withdrawal request submitted successfully!');
      loadHistory();
    }
  });

  const supportedAssets = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      network: 'Bitcoin',
      addressPattern: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
      icon: '₿'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      network: 'Ethereum',
      addressPattern: /^0x[a-fA-F0-9]{40}$/,
      icon: 'Ξ'
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      network: 'TRC20',
      addressPattern: /^T[A-Za-z1-9]{33}$/,
      icon: '₮'
    }
  ];

  const mockWithdrawHistory: WithdrawHistory[] = [
    {
      id: '1',
      asset: 'BTC',
      amount: 0.1,
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      txHash: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z',
      fee: 0.0005,
      status: 'completed',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      network: 'Bitcoin'
    },
    {
      id: '2',
      asset: 'ETH',
      amount: 1.5,
      address: '0x742d35Cc6634C0532925a3b8D4C9db4C4C4C4C4C',
      txHash: '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef',
      fee: 0.005,
      status: 'processing',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      network: 'Ethereum'
    },
    {
      id: '3',
      asset: 'USDT',
      amount: 500,
      address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
      txHash: '',
      fee: 1,
      status: 'pending',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      network: 'TRC20'
    }
  ];

  useEffect(() => {
    loadLimits();
    loadHistory();
  }, [selectedAsset]);

  const loadLimits = async () => {
    try {
      const limitsResult = await fetchLimitsData(async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock limits for different assets
        const mockLimits = {
          BTC: {
            daily: 10,
            dailyUsed: 2.5,
            minimum: 0.001,
            maximum: 5,
            fee: 0.0005,
            feeType: 'fixed' as const
          },
          ETH: {
            daily: 100,
            dailyUsed: 15,
            minimum: 0.01,
            maximum: 50,
            fee: 0.005,
            feeType: 'fixed' as const
          },
          USDT: {
            daily: 50000,
            dailyUsed: 5000,
            minimum: 10,
            maximum: 10000,
            fee: 1,
            feeType: 'fixed' as const
          }
        };
        
        return mockLimits[selectedAsset as keyof typeof mockLimits];
      });
      setWithdrawLimits(limitsResult);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const validateAddress = (address: string) => {
    const asset = supportedAssets.find(a => a.symbol === selectedAsset);
    if (!asset) return false;
    return asset.addressPattern.test(address);
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!withdrawAddress.trim()) {
      newErrors.push('Withdrawal address is required');
    } else if (!validateAddress(withdrawAddress)) {
      newErrors.push('Invalid withdrawal address format');
    }
    
    if (!withdrawAmount.trim()) {
      newErrors.push('Amount is required');
    } else {
      const numAmount = parseFloat(withdrawAmount);
      if (isNaN(numAmount) || numAmount <= 0) {
        newErrors.push('Invalid amount');
      } else if (withdrawLimits) {
        if (numAmount < withdrawLimits.minimum) {
          newErrors.push(`Minimum withdrawal is ${withdrawLimits.minimum} ${selectedAsset}`);
        }
        if (numAmount > withdrawLimits.maximum) {
          newErrors.push(`Maximum withdrawal is ${withdrawLimits.maximum} ${selectedAsset}`);
        }
        if (numAmount > (withdrawLimits.daily - withdrawLimits.dailyUsed)) {
          newErrors.push(`Daily limit exceeded. Available: ${(withdrawLimits.daily - withdrawLimits.dailyUsed).toFixed(8)} ${selectedAsset}`);
        }
        const userBalance = user?.balances?.[selectedAsset] || 0;
        if (numAmount + withdrawLimits.fee > userBalance) {
          newErrors.push('Insufficient balance including fees');
        }
      }
    }
    
    setValidationErrors(newErrors);
    return newErrors.length === 0;
  };

  const calculateFee = () => {
    if (!withdrawLimits) return 0;
    return withdrawLimits.fee;
  };

  const calculateTotal = () => {
    const amount = parseFloat(withdrawAmount) || 0;
    const fee = calculateFee();
    return amount + fee;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setShowConfirmation(true);
  };

  const confirmWithdraw = async () => {
    try {
      await submitWithdraw(
        { selectedAsset, withdrawAddress, withdrawAmount },
        async (data) => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { success: true, transactionId: 'mock-tx-id' };
        }
      );
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const loadHistory = async () => {
    try {
      const historyResult = await fetchHistoryData(async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        return [...mockWithdrawHistory];
      });
      setWithdrawHistory(historyResult);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const cancelWithdraw = async (withdrawId: string) => {
    if (confirm('Are you sure you want to cancel this withdrawal?')) {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setWithdrawHistory(prev => 
        prev.map(w => 
          w.id === withdrawId ? { ...w, status: 'cancelled' } : w
        )
      );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
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

  const selectedAssetInfo = supportedAssets.find(a => a.symbol === selectedAsset);
  const userBalance = user?.balances?.[selectedAsset] || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdraw Cryptocurrency</h1>
          <p className="text-gray-600">Send funds to external addresses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Select Asset</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {supportedAssets.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => setSelectedAsset(asset.symbol)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                      selectedAsset === asset.symbol
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-600">{asset.icon}</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{asset.symbol}</p>
                        <p className="text-sm text-gray-500">{asset.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{asset.network}</p>
                      <p className="text-xs text-gray-400">
                        Balance: {userBalance.toFixed(8)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Withdrawal Limits */}
          <div className="bg-white rounded-lg shadow-sm border mt-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Withdrawal Limits</h2>
            </div>
            <div className="p-6">
              <ErrorDisplay 
                error={limitsError} 
                onRetry={loadLimits}
                className="mb-4"
              />
              
              {limitsLoading ? (
                <div className="space-y-4">
                  <LoadingSkeleton variant="text" lines={5} />
                </div>
              ) : withdrawLimits && (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Daily Limit</span>
                    <span className="text-sm font-medium text-gray-900">
                      {withdrawLimits.daily} {selectedAsset}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Daily Used</span>
                    <span className="text-sm font-medium text-gray-900">
                      {withdrawLimits.dailyUsed} {selectedAsset}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Available Today</span>
                    <span className="text-sm font-medium text-green-600">
                      {(withdrawLimits.daily - withdrawLimits.dailyUsed).toFixed(8)} {selectedAsset}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Min/Max</span>
                    <span className="text-sm font-medium text-gray-900">
                      {withdrawLimits.minimum} - {withdrawLimits.maximum} {selectedAsset}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Network Fee</span>
                    <span className="text-sm font-medium text-gray-900">
                      {withdrawLimits.fee} {selectedAsset}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Withdraw {selectedAsset}
              </h2>
            </div>
            
            <div className="p-6">
              <ValidationErrorDisplay errors={validationErrors} className="mb-6" />
              
              <ErrorDisplay 
                error={submitError} 
                className="mb-6"
              />
              
              {/* Security Notice */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Security Notice:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Double-check the withdrawal address - transactions cannot be reversed</li>
                      <li>• Only withdraw to {selectedAssetInfo?.network} network addresses</li>
                      <li>• Withdrawals may take time to process and confirm on the network</li>
                      <li>• Contact support if you need assistance</li>
                    </ul>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Withdrawal Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Address ({selectedAssetInfo?.network})
                  </label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder={`Enter ${selectedAsset} address`}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                {/* Withdrawal Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00000000"
                      className={`w-full p-3 pr-16 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.amount ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-sm text-gray-500">{selectedAsset}</span>
                    </div>
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                  )}
                  <div className="mt-2 flex justify-between text-sm text-gray-600">
                    <span>Available: {userBalance.toFixed(8)} {selectedAsset}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (withdrawLimits) {
                          const maxAmount = Math.min(
                            userBalance - withdrawLimits.fee,
                            withdrawLimits.maximum,
                            withdrawLimits.daily - withdrawLimits.dailyUsed
                          );
                          setWithdrawAmount(Math.max(0, maxAmount).toFixed(8));
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Use Max
                    </button>
                  </div>
                </div>

                {/* Fee Calculation */}
                {withdrawAmount && withdrawLimits && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Calculator className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Transaction Summary</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-medium">{parseFloat(withdrawAmount).toFixed(8)} {selectedAsset}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Network Fee</span>
                        <span className="font-medium">{calculateFee().toFixed(8)} {selectedAsset}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900">Total Deducted</span>
                          <span className="font-bold text-gray-900">{calculateTotal().toFixed(8)} {selectedAsset}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !withdrawAddress || !withdrawAmount}
                  className="w-full py-3 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Processing...' : 'Review Withdrawal'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Withdrawal History</h2>
            <button
              onClick={loadHistory}
              disabled={historyLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <ErrorDisplay 
          error={historyError} 
          onRetry={loadHistory}
          className="mb-4"
        />
        
        {historyLoading ? (
          <ListSkeleton items={3} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawHistory.map((withdraw) => (
                <tr key={withdraw.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-gray-600">
                          {withdraw.asset.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{withdraw.asset}</div>
                        <div className="text-sm text-gray-500">{withdraw.network}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {withdraw.amount.toFixed(8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    <span className="truncate max-w-32 block">{withdraw.address}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(withdraw.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        getStatusColor(withdraw.status)
                      }`}>
                        {withdraw.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {withdraw.fee.toFixed(8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {withdraw.timestamp.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {withdraw.txHash && withdraw.status === 'completed' && (
                        <button
                          onClick={() => window.open(`#`, '_blank')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      {withdraw.status === 'pending' && (
                        <button
                          onClick={() => cancelWithdraw(withdraw.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
            
            {withdrawHistory.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-gray-500">No withdrawal history found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Withdrawal</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Asset:</span>
                <span className="font-medium">{selectedAsset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{parseFloat(withdrawAmount).toFixed(8)} {selectedAsset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network Fee:</span>
                <span className="font-medium">{calculateFee().toFixed(8)} {selectedAsset}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Total Deducted:</span>
                <span className="font-bold">{calculateTotal().toFixed(8)} {selectedAsset}</span>
              </div>
              <div className="mt-4">
                <span className="text-gray-600">To Address:</span>
                <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded mt-1">
                  {withdrawAddress}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmWithdraw}
                disabled={submitting}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdraw;