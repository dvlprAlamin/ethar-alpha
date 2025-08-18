import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  ArrowUpDown,
  Plus,
  Minus,
  Bell,
  Settings,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';

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

const orderBookData = {
  asks: [
    { price: 105780, amount: 0.5, total: 0.5 },
    { price: 105770, amount: 1.2, total: 1.7 },
    { price: 105760, amount: 0.8, total: 2.5 },
    { price: 105750, amount: 2.1, total: 4.6 },
    { price: 105740, amount: 1.5, total: 6.1 },
  ],
  bids: [
    { price: 105730, amount: 1.8, total: 1.8 },
    { price: 105720, amount: 0.9, total: 2.7 },
    { price: 105710, amount: 1.4, total: 4.1 },
    { price: 105700, amount: 2.3, total: 6.4 },
    { price: 105690, amount: 1.1, total: 7.5 },
  ],
};

const tradeHistory = [
  { id: 1, type: 'buy', amount: 0.5, price: 105720, time: '11:45:23', status: 'completed' },
  { id: 2, type: 'sell', amount: 1.2, price: 105680, time: '11:42:15', status: 'completed' },
  { id: 3, type: 'buy', amount: 0.8, price: 105650, time: '11:38:47', status: 'completed' },
  { id: 4, type: 'sell', amount: 2.1, price: 105600, time: '11:35:12', status: 'completed' },
  { id: 5, type: 'buy', amount: 1.5, price: 105580, time: '11:31:58', status: 'completed' },
  { id: 6, type: 'sell', amount: 0.7, price: 105540, time: '11:28:34', status: 'pending' },
  { id: 7, type: 'buy', amount: 1.9, price: 105520, time: '11:25:09', status: 'completed' },
  { id: 8, type: 'sell', amount: 0.6, price: 105480, time: '11:21:45', status: 'completed' },
];

const portfolioData = [
  { asset: 'BTC', amount: 2.5, value: 264000, change: 2.5, allocation: 65 },
  { asset: 'ETH', amount: 15.8, value: 63200, change: -1.2, allocation: 20 },
  { asset: 'USDT', amount: 50000, value: 50000, change: 0, allocation: 12 },
  { asset: 'BNB', amount: 45.2, value: 13560, change: 3.8, allocation: 3 },
];

const recentTrades = [
  { price: 105760, amount: 0.25, time: '11:45:58', type: 'buy' },
  { price: 105750, amount: 0.18, time: '11:45:45', type: 'sell' },
  { price: 105740, amount: 0.32, time: '11:45:32', type: 'buy' },
  { price: 105730, amount: 0.15, time: '11:45:19', type: 'sell' },
  { price: 105720, amount: 0.28, time: '11:45:06', type: 'buy' },
];

const Trade: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('105760');
  const [showBalance, setShowBalance] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(105760);
  const [priceChange, setPriceChange] = useState(1.06);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 100;
      setCurrentPrice(prev => Math.max(105000, prev + change));
      setPriceChange(prev => prev + (Math.random() - 0.5) * 0.1);
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

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">{selectedPair}</h1>
              <ChevronDown className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-green-400">
                {formatPrice(currentPrice)}
              </div>
              <div className={`flex items-center space-x-1 ${
                priceChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {priceChange >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{priceChange >= 0 ? '+' : ''}{formatNumber(priceChange, 2)}%</span>
              </div>
            </div>
          </div>
          {/* <div className="flex items-center space-x-2">
            <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div> */}
        </div>
        
        {/* Market Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-4 rounded-lg">
            <div className="text-slate-400 text-sm">24h High</div>
            <div className="text-lg font-semibold">{formatPrice(106648.99)}</div>
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Price Chart</h2>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1m</button>
                <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600">15m</button>
                <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600">1h</button>
                <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600">1D</button>
                <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600">1W</button>
              </div>
            </div>
            
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
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
                      color: '#F9FAFB'
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
        <div className="space-y-6">
          {/* Order Placement */}
          <div className="bg-slate-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Place Order</h3>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {/* Order Type Tabs */}
            <div className="flex mb-4">
              <button
                onClick={() => setOrderType('limit')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg ${
                  orderType === 'limit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Limit
              </button>
              <button
                onClick={() => setOrderType('market')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg ${
                  orderType === 'market'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Market
              </button>
            </div>
            
            {/* Buy/Sell Tabs */}
            <div className="flex mb-4">
              <button
                onClick={() => setTradeType('buy')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg ${
                  tradeType === 'buy'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setTradeType('sell')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg ${
                  tradeType === 'sell'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Sell
              </button>
            </div>
            
            {/* Price Input */}
            {orderType === 'limit' && (
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">Price (USDT)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
            )}
            
            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Amount (BTC)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                placeholder="0.00"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>Available: {showBalance ? '2.5 BTC' : '••••••'}</span>
                <button className="text-blue-400 hover:text-blue-300">Max</button>
              </div>
            </div>
            
            {/* Total */}
            <div className="mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total:</span>
                <span className="text-white font-medium">
                  {amount && price ? formatPrice(parseFloat(amount) * parseFloat(price)) : '$0.00'}
                </span>
              </div>
            </div>
            
            {/* Place Order Button */}
            <button
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                tradeType === 'buy'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {tradeType === 'buy' ? 'Buy' : 'Sell'} BTC
            </button>
          </div>
 
          
      </div>
 
      
      </div>
    </div>
  );
};

export default Trade;