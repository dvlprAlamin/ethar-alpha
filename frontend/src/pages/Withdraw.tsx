import React, { useState } from 'react';
import { ChevronDown, AlertTriangle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Network {
  id: string;
  name: string;
  symbol: string;
}

interface Currency {
  id: string;
  name: string;
  symbol: string;
  balance: number;
}

const Withdraw: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    null
  );
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // Mock data for networks
  const networks: Network[] = [
    { id: 'ethereum', name: 'Ethereum (ERC-20)', symbol: 'ETH' },
    { id: 'bsc', name: 'Binance Smart Chain (BEP-20)', symbol: 'BSC' },
    { id: 'polygon', name: 'Polygon (MATIC)', symbol: 'MATIC' },
    { id: 'arbitrum', name: 'Arbitrum One', symbol: 'ARB' },
  ];

  // Mock data for currencies
  const currencies: Currency[] = [
    { id: 'usdt', name: 'Tether USD', symbol: 'USDT', balance: 1250.5 },
    { id: 'usdc', name: 'USD Coin', symbol: 'USDC', balance: 890.25 },
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', balance: 2.45 },
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', balance: 0.125 },
  ];

  // Set default selections
  React.useEffect(() => {
    if (!selectedNetwork && networks.length > 0) {
      setSelectedNetwork(networks[0]);
    }
    if (!selectedCurrency && currencies.length > 0) {
      setSelectedCurrency(currencies[0]);
    }
  }, []);

  const handleNetworkSelect = (network: Network) => {
    setSelectedNetwork(network);
    setShowNetworkDropdown(false);
  };

  const handleCurrencySelect = (currency: Currency) => {
    setSelectedCurrency(currency);
    setShowCurrencyDropdown(false);
  };

  const handleWithdraw = () => {
    if (!address.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (selectedCurrency && parseFloat(amount) > selectedCurrency.balance) {
      toast.error('Insufficient balance');
      return;
    }

    toast.success('Withdrawal request submitted successfully');
    // Reset form
    setAddress('');
    setAmount('');
  };

  const usdValue = amount ? (parseFloat(amount) * 1.0).toFixed(2) : '0.00';

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
          {/* Network Selection */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Network
            </label>
            <div className="relative">
              <button
                onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors flex items-center justify-between"
              >
                <span>{selectedNetwork?.name || 'Select Network'}</span>
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </button>

              {showNetworkDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
                  {networks.map((network) => (
                    <button
                      key={network.id}
                      onClick={() => handleNetworkSelect(network)}
                      className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {network.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Currency Selection */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Currency
            </label>
            <div className="relative">
              <button
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <span>{selectedCurrency?.symbol || 'Select Currency'}</span>
                  {selectedCurrency && (
                    <span className="text-slate-400 text-sm">
                      Balance: {selectedCurrency.balance.toFixed(4)}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </button>

              {showCurrencyDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
                  {currencies.map((currency) => (
                    <button
                      key={currency.id}
                      onClick={() => handleCurrencySelect(currency)}
                      className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span>{currency.symbol}</span>
                        <span className="text-slate-400 text-sm">
                          {currency.balance.toFixed(4)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Address Input */}
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

          {/* Amount Input */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pr-16 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                USD
              </div>
            </div>
            {amount && (
              <p className="text-xs text-slate-400 mt-2">≈ ${usdValue} USD</p>
            )}
          </div>

          {/* Warning Messages */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="space-y-3">
              {/* Tax Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-200 text-sm">
                      Your account must have applicable country taxes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Warning */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-200 text-sm">
                      Use the correct address and network. Be careful, otherwise
                      you may lose your funds.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Withdraw Button */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <button
              onClick={handleWithdraw}
              disabled={!address.trim() || !amount || parseFloat(amount) <= 0}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-cyan-500"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
