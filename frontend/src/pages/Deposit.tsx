import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// import { useAuthStore } from '../store/authStore';
import {
  Copy,
  QrCode,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Info,
  // ArrowLeft
} from 'lucide-react';
import { useDataFetching, useAsyncOperation } from '../hooks/useAsyncOperation';
import ErrorDisplay from '../components/ErrorDisplay';
import LoadingSkeleton, { ListSkeleton } from '../components/LoadingSkeleton';
import { showSuccessToast, showErrorToast } from '../utils/errorHandling';

interface DepositAddress {
  address: string;
  qrCode: string;
  network: string;
  minAmount: number;
  confirmations: number;
}

interface DepositHistory {
  id: string;
  asset: string;
  amount: number;
  address: string;
  txHash: string;
  confirmations: number;
  requiredConfirmations: number;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
  timestamp: Date;
  network: string;
}

const Deposit: React.FC = () => {
  const [searchParams] = useSearchParams();
  // const { user } = useAuthStore();
  const [selectedAsset, setSelectedAsset] = useState(
    searchParams.get('asset') || 'BTC'
  );
  const [depositAddress, setDepositAddress] = useState<DepositAddress | null>(
    null
  );
  const [depositHistory, setDepositHistory] = useState<DepositHistory[]>([]);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  // const [refreshing, setRefreshing] = useState(false);

  const {
    data: addressData,
    loading: addressLoading,
    error: addressError,
    fetch: fetchAddress,
  } = useDataFetching();

  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
    fetch: fetchHistory,
    refetch: refetchHistory,
  } = useDataFetching();

  const { execute: copyToClipboard } = useAsyncOperation();

  const supportedAssets = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      network: 'Bitcoin',
      minDeposit: 0.0001,
      confirmations: 3,
      icon: '₿',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      network: 'Ethereum',
      minDeposit: 0.001,
      confirmations: 12,
      icon: 'Ξ',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      network: 'TRC20',
      minDeposit: 1,
      confirmations: 19,
      icon: '₮',
    },
  ];

  const mockDepositHistory: DepositHistory[] = [
    {
      id: '1',
      asset: 'BTC',
      amount: 0.5,
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      txHash: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z',
      confirmations: 3,
      requiredConfirmations: 3,
      status: 'completed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      network: 'Bitcoin',
    },
    {
      id: '2',
      asset: 'ETH',
      amount: 2.5,
      address: '0x742d35Cc6634C0532925a3b8D4C9db4C4C4C4C4C',
      txHash:
        '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef',
      confirmations: 8,
      requiredConfirmations: 12,
      status: 'confirming',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      network: 'Ethereum',
    },
    {
      id: '3',
      asset: 'USDT',
      amount: 1000,
      address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
      txHash: 'pending',
      confirmations: 0,
      requiredConfirmations: 19,
      status: 'pending',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      network: 'TRC20',
    },
  ];

  useEffect(() => {
    generateDepositAddress();

    // Load initial history
    fetchHistory(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return [...mockDepositHistory];
    })
      .then((history) => {
        setDepositHistory(history);
      })
      .catch(() => {
        // Error is handled by the hook
      });
  }, [selectedAsset]);

  const generateDepositAddress = async () => {
    try {
      const result = await fetchAddress(async () => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const asset = supportedAssets.find((a) => a.symbol === selectedAsset);
        if (!asset) throw new Error('Asset not found');

        // Mock addresses for different assets
        const mockAddresses = {
          BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          ETH: '0x742d35Cc6634C0532925a3b8D4C9db4C4C4C4C4C',
          USDT: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
        };

        const address =
          mockAddresses[selectedAsset as keyof typeof mockAddresses];

        return {
          address,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`,
          network: asset.network,
          minAmount: asset.minDeposit,
          confirmations: asset.confirmations,
        };
      });
      setDepositAddress(result);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await copyToClipboard(async () => {
        await navigator.clipboard.writeText(text);
        return text;
      });
      setCopied(true);
      showSuccessToast('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showErrorToast('Failed to copy to clipboard');
    }
  };

  const refreshHistory = async () => {
    try {
      const history = await refetchHistory(async () => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return [...mockDepositHistory];
      });
      setDepositHistory(history);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'confirming':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'confirming':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const selectedAssetInfo = supportedAssets.find(
    (a) => a.symbol === selectedAsset
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Deposit Cryptocurrency
          </h1>
          <p className="text-gray-600">Add funds to your account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Asset
              </h2>
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
                        <span className="text-lg font-bold text-gray-600">
                          {asset.icon}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {asset.symbol}
                        </p>
                        <p className="text-sm text-gray-500">{asset.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{asset.network}</p>
                      <p className="text-xs text-gray-400">
                        Min: {asset.minDeposit}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Address */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Deposit {selectedAsset}
                </h2>
                <button
                  onClick={generateDepositAddress}
                  disabled={addressLoading}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      addressLoading ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Generate New</span>
                </button>
              </div>
            </div>

            <ErrorDisplay
              error={addressError}
              onRetry={generateDepositAddress}
              className="mb-4"
            />

            {addressLoading ? (
              <div className="p-6">
                <div className="space-y-4">
                  <LoadingSkeleton variant="text" width="100%" height={48} />
                  <LoadingSkeleton
                    variant="rectangular"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                </div>
              </div>
            ) : depositAddress ? (
              <div className="p-6">
                {/* Important Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Important Notice:</p>
                      <ul className="space-y-1 text-xs">
                        <li>
                          • Only send {selectedAsset} to this address on{' '}
                          {selectedAssetInfo?.network} network
                        </li>
                        <li>
                          • Minimum deposit: {selectedAssetInfo?.minDeposit}{' '}
                          {selectedAsset}
                        </li>
                        <li>
                          • Requires {selectedAssetInfo?.confirmations} network
                          confirmations
                        </li>
                        <li>
                          • Sending other assets may result in permanent loss
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Deposit Address */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedAsset} Deposit Address ({depositAddress.network})
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm break-all">
                        {depositAddress.address}
                      </div>
                      <button
                        onClick={() =>
                          handleCopyToClipboard(depositAddress.address)
                        }
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {copied ? 'Copied!' : 'Copy'}
                        </span>
                      </button>
                      <button
                        onClick={() => setShowQR(!showQR)}
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="hidden sm:inline">QR</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  {showQR && (
                    <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <img
                          src={depositAddress.qrCode}
                          alt="Deposit Address QR Code"
                          className="w-48 h-48 mx-auto mb-2"
                        />
                        <p className="text-sm text-gray-600">
                          Scan to get deposit address
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Network Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        Network
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {depositAddress.network}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        Min Deposit
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {depositAddress.minAmount} {selectedAsset}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        Confirmations
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {depositAddress.confirmations}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">
                  Failed to generate deposit address. Please try again.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deposit History */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Deposits
            </h2>
            <button
              onClick={refreshHistory}
              disabled={historyLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <ErrorDisplay
          error={historyError}
          onRetry={refreshHistory}
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confirmations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {depositHistory.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-600">
                            {deposit.asset.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {deposit.asset}
                          </div>
                          <div className="text-sm text-gray-500">
                            {deposit.network}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deposit.amount.toFixed(8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(deposit.status)}
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            deposit.status
                          )}`}
                        >
                          {deposit.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deposit.status === 'pending'
                        ? 'Waiting...'
                        : `${deposit.confirmations}/${deposit.requiredConfirmations}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deposit.timestamp.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deposit.txHash === 'pending' ? (
                        'Pending'
                      ) : (
                        <button
                          onClick={() => window.open(`#`, '_blank')}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                        >
                          <span className="truncate max-w-20">
                            {deposit.txHash}
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {depositHistory.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-gray-500">No deposit history found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Deposit;
