import React, { useState, useEffect } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ComposedChart,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// Static data for demonstration
const priceData = [
  { time: '09:00', price: 105460, volume: 1200, ma5: 105400, ma20: 105300 },
  { time: '09:15', price: 105520, volume: 1500, ma5: 105420, ma20: 105310 },
  { time: '09:30', price: 105480, volume: 980, ma5: 105440, ma20: 105320 },
  { time: '09:45', price: 105600, volume: 2100, ma5: 105460, ma20: 105330 },
  { time: '10:00', price: 105550, volume: 1800, ma5: 105480, ma20: 105340 },
  { time: '10:15', price: 105620, volume: 1600, ma5: 105500, ma20: 105350 },
  { time: '10:30', price: 105580, volume: 1400, ma5: 105520, ma20: 105360 },
  { time: '10:45', price: 105640, volume: 1900, ma5: 105540, ma20: 105370 },
  { time: '11:00', price: 105700, volume: 2200, ma5: 105560, ma20: 105380 },
  { time: '11:15', price: 105680, volume: 1700, ma5: 105580, ma20: 105390 },
  { time: '11:30', price: 105720, volume: 1300, ma5: 105600, ma20: 105400 },
  { time: '11:45', price: 105760, volume: 2000, ma5: 105620, ma20: 105410 },
];

type TradeStatus = 'idle' | 'active' | 'completed';

const Trade: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [tradeStatus, setTradeStatus] = useState<TradeStatus>('idle');
  const [error, setError] = useState('');
  const [currentPrice, setCurrentPrice] = useState(105760);
  const [priceChange, setPriceChange] = useState(1.06);
  
  const { user, updateBalance } = useAuthStore();

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 100;
      setCurrentPrice((prev) => Math.max(105000, prev + change));
      setPriceChange((prev) => prev + (Math.random() - 0.5) * 0.1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const handleContinue = () => {
    setError('');
    const tradeAmount = parseFloat(amount);
    
    if (!tradeAmount || tradeAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!user?.balances?.USD || user.balances.USD < tradeAmount) {
      setError('Insufficient balance');
      return;
    }
    
    // Start trade and reduce balance
    updateBalance('USD', user.balances.USD - tradeAmount);
    setTradeStatus('active');
  };
  
  const handleExitTrade = () => {
    setTradeStatus('completed');
    setAmount('');
    setError('');
    // Reset to idle after a brief moment
    setTimeout(() => setTradeStatus('idle'), 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <h1 className="sm:text-2xl text-xl font-bold">BTC/USDT</h1>
                {/* <ChevronDown className="h-5 w-5 text-slate-400" /> */}
              </div>
              <div className="flex items-center space-x-4">
                <div className="sm:text-3xl text-xl font-bold text-green-400">
                  {formatPrice(currentPrice)}
                </div>
                <div
                  className={`flex items-center space-x-1 ${
                    priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {priceChange >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {priceChange >= 0 ? '+' : ''}
                    {formatNumber(priceChange, 2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-slate-400 text-sm">24h High</div>
              <div className="text-lg font-semibold">
                {formatPrice(106648.99)}
              </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-slate-400 text-sm">24h Low</div>
              <div className="text-lg font-semibold">{formatPrice(105145)}</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-slate-400 text-sm">24h Volume</div>
              <div className="text-lg font-semibold">677,858 BTC</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-slate-400 text-sm">Market Cap</div>
              <div className="text-lg font-semibold">$2.1T</div>
            </div>
          </div>
        </div>

        {/* Main Trading Interface */}
        <div>
          {/* Chart Section */}
          <div>
            <div className="bg-slate-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Price Chart</h2>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                    1m
                  </button>
                  <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600">
                    15m
                  </button>
                  <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600">
                    1h
                  </button>
                  <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600">
                    1D
                  </button>
                  <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600">
                    1W
                  </button>
                </div>
              </div>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={12}
                      domain={['dataMin - 50', 'dataMax + 50']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ma5"
                      stroke="#F59E0B"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ma20"
                      stroke="#8B5CF6"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Bar
                      dataKey="volume"
                      fill="#374151"
                      opacity={0.6}
                      yAxisId="volume"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Technical Indicators */}
              <div className="mt-4 flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Price: {formatPrice(currentPrice)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>MA5: {formatPrice(105600)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>MA20: {formatPrice(105410)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6 mt-5">
            {/* Order Placement */}
            <div className="bg-slate-900 rounded-lg p-6">
              {/* Balance Display */}
              <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Available Balance:</span>
                  <span className="text-lg font-semibold text-green-400">
                    {formatPrice(user?.balances?.USD || 0)}
                  </span>
                </div>
                {tradeStatus !== 'idle' && (
                  <div className="mt-2 pt-2 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Trade Status:</span>
                      <span className={`font-semibold ${
                        tradeStatus === 'active' ? 'text-yellow-400' : 'text-blue-400'
                      }`}>
                        {tradeStatus === 'active' ? 'Active' : 'Completed'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                  disabled={tradeStatus === 'active'}
                />
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>Available: {formatPrice(user?.balances?.USD || 0)}</span>
                  <button 
                    className="text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={tradeStatus === 'active'}
                    onClick={() => setAmount((user?.balances?.USD || 0).toString())}
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              {tradeStatus === 'idle' || tradeStatus === 'completed' ? (
                <button
                  onClick={handleContinue}
                  className="w-full py-3 rounded-lg font-medium transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!user?.balances?.USD || user.balances.USD <= 0}
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleExitTrade}
                  className="w-full py-3 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
                >
                  Exit Trade
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;
