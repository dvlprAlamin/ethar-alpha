import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useWebSocketStore } from '../store/websocketStore';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  DollarSign,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Calculator,
  Activity,
  Zap
} from 'lucide-react';

interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  amount: number;
  price?: number;
  filled: number;
  status: 'pending' | 'filled' | 'cancelled' | 'partial';
  timestamp: Date;
  total: number;
}

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: Date;
  fee: number;
  total: number;
}

const Trade: React.FC = () => {
  const { user } = useAuthStore();
  const { marketData } = useWebSocketStore();
  const [selectedPair, setSelectedPair] = useState<TradingPair | null>(null);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orderBook, setOrderBook] = useState<{
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
  }>({ bids: [], asks: [] });
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Convert WebSocket market data to trading pairs format
  const getTradingPairs = (): TradingPair[] => {
    const pairs: TradingPair[] = [];
    
    if (marketData['BTC/USD']) {
      pairs.push({
        symbol: 'BTC/USD',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        price: marketData['BTC/USD'].price,
        change24h: marketData['BTC/USD'].change24h,
        volume24h: marketData['BTC/USD'].volume24h,
        high24h: marketData['BTC/USD'].price * 1.02,
        low24h: marketData['BTC/USD'].price * 0.98
      });
    }
    
    if (marketData['ETH/USD']) {
      pairs.push({
        symbol: 'ETH/USD',
        baseAsset: 'ETH',
        quoteAsset: 'USD',
        price: marketData['ETH/USD'].price,
        change24h: marketData['ETH/USD'].change24h,
        volume24h: marketData['ETH/USD'].volume24h,
        high24h: marketData['ETH/USD'].price * 1.02,
        low24h: marketData['ETH/USD'].price * 0.98
      });
    }
    
    if (marketData['BTC/ETH']) {
      pairs.push({
        symbol: 'BTC/ETH',
        baseAsset: 'BTC',
        quoteAsset: 'ETH',
        price: marketData['BTC/ETH'].price,
        change24h: marketData['BTC/ETH'].change24h,
        volume24h: marketData['BTC/ETH'].volume24h,
        high24h: marketData['BTC/ETH'].price * 1.02,
        low24h: marketData['BTC/ETH'].price * 0.98
      });
    }
    
    if (marketData['TRC20/USD']) {
      pairs.push({
        symbol: 'TRC20/USD',
        baseAsset: 'TRC20',
        quoteAsset: 'USD',
        price: marketData['TRC20/USD'].price,
        change24h: marketData['TRC20/USD'].change24h,
        volume24h: marketData['TRC20/USD'].volume24h,
        high24h: marketData['TRC20/USD'].price * 1.02,
        low24h: marketData['TRC20/USD'].price * 0.98
      });
    }
    
    // Fallback to mock data if no real data available
    if (pairs.length === 0) {
      return [
        {
          symbol: 'BTC/USD',
          baseAsset: 'BTC',
          quoteAsset: 'USD',
          price: 43250.50,
          change24h: 2.45,
          volume24h: 1250000,
          high24h: 44100.00,
          low24h: 42800.00
        },
        {
          symbol: 'ETH/USD',
          baseAsset: 'ETH',
          quoteAsset: 'USD',
          price: 2650.75,
          change24h: -1.23,
          volume24h: 850000,
          high24h: 2720.00,
          low24h: 2580.00
        }
      ];
    }
    
    return pairs;
  };
  
  const tradingPairs = getTradingPairs();

  const mockOrders: Order[] = [
    {
      id: '1',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'limit',
      amount: 0.1,
      price: 43000,
      filled: 0,
      status: 'pending',
      timestamp: new Date('2024-01-20T10:30:00'),
      total: 4300
    },
    {
      id: '2',
      symbol: 'ETH/USDT',
      side: 'sell',
      type: 'limit',
      amount: 2,
      price: 2700,
      filled: 1.5,
      status: 'partial',
      timestamp: new Date('2024-01-20T09:15:00'),
      total: 5400
    },
    {
      id: '3',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'market',
      amount: 0.05,
      filled: 0.05,
      status: 'filled',
      timestamp: new Date('2024-01-19T16:45:00'),
      total: 2162.5
    }
  ];

  const mockTrades: Trade[] = [
    {
      id: '1',
      symbol: 'BTC/USDT',
      side: 'buy',
      amount: 0.05,
      price: 43250,
      timestamp: new Date('2024-01-19T16:45:00'),
      fee: 2.16,
      total: 2162.5
    },
    {
      id: '2',
      symbol: 'ETH/USDT',
      side: 'sell',
      amount: 1.5,
      price: 2680,
      timestamp: new Date('2024-01-19T14:20:00'),
      fee: 4.02,
      total: 4020
    }
  ];

  const generateOrderBook = (pair: TradingPair) => {
    const bids: OrderBookEntry[] = [];
    const asks: OrderBookEntry[] = [];
    
    // Generate mock order book data
    for (let i = 0; i < 10; i++) {
      const bidPrice = pair.price - (i + 1) * (pair.price * 0.001);
      const askPrice = pair.price + (i + 1) * (pair.price * 0.001);
      const bidAmount = Math.random() * 5 + 0.1;
      const askAmount = Math.random() * 5 + 0.1;
      
      bids.push({
        price: bidPrice,
        amount: bidAmount,
        total: bidPrice * bidAmount
      });
      
      asks.push({
        price: askPrice,
        amount: askAmount,
        total: askPrice * askAmount
      });
    }
    
    return { bids, asks };
  };

  useEffect(() => {
    const { subscribeToMarket } = useWebSocketStore.getState();
    
    // Subscribe to market data for trading pairs
    const pairs = ['BTC/USD', 'ETH/USD', 'BTC/ETH', 'TRC20/USD'];
    subscribeToMarket(pairs);
    
    const timer = setTimeout(() => {
      const pairs = getTradingPairs();
      if (pairs.length > 0) {
        setSelectedPair(pairs[0]);
        setOrderBook(generateOrderBook(pairs[0]));
      }
      setOrders(mockOrders);
      setTrades(mockTrades);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedPair) {
      setOrderBook(generateOrderBook(selectedPair));
      if (orderType === 'market') {
        setPrice('');
      } else {
        setPrice(selectedPair.price.toString());
      }
    }
  }, [selectedPair, orderType]);

  // Update selected pair when market data changes
  useEffect(() => {
    if (selectedPair && marketData[selectedPair.symbol]) {
      const updatedPair = {
        ...selectedPair,
        price: marketData[selectedPair.symbol].price,
        change24h: marketData[selectedPair.symbol].change24h,
        volume24h: marketData[selectedPair.symbol].volume24h,
        high24h: marketData[selectedPair.symbol].price * 1.02,
        low24h: marketData[selectedPair.symbol].price * 0.98
      };
      setSelectedPair(updatedPair);
      setOrderBook(generateOrderBook(updatedPair));
    }
  }, [marketData]);

  const handlePairSelect = (pair: TradingPair) => {
    setSelectedPair(pair);
    setAmount('');
    setPrice(orderType === 'limit' ? pair.price.toString() : '');
  };

  const calculateTotal = () => {
    if (!amount) return 0;
    const amountNum = parseFloat(amount);
    if (orderType === 'market' && selectedPair) {
      return amountNum * selectedPair.price;
    }
    if (orderType === 'limit' && price) {
      return amountNum * parseFloat(price);
    }
    return 0;
  };

  const calculateFee = () => {
    const total = calculateTotal();
    return total * 0.001; // 0.1% fee
  };

  const placeOrder = async () => {
    if (!selectedPair || !amount || (orderType === 'limit' && !price)) {
      alert('Please fill in all required fields');
      return;
    }

    setPlacing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newOrder: Order = {
        id: Date.now().toString(),
        symbol: selectedPair.symbol,
        side: orderSide,
        type: orderType,
        amount: parseFloat(amount),
        price: orderType === 'limit' ? parseFloat(price) : undefined,
        filled: 0,
        status: 'pending',
        timestamp: new Date(),
        total: calculateTotal()
      };
      
      setOrders(prev => [newOrder, ...prev]);
      setAmount('');
      setPrice(orderType === 'limit' ? selectedPair.price.toString() : '');
      
      alert('Order placed successfully!');
    } catch (error) {
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        )
      );
      alert('Order cancelled successfully!');
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (selectedPair) {
      setOrderBook(generateOrderBook(selectedPair));
    }
    setRefreshing(false);
  };

  const formatPrice = (price: number, decimals: number = 2) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'partial':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Trading</h1>
          <p className="text-gray-600">Trade cryptocurrencies with advanced order types</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{showBalances ? 'Hide' : 'Show'} Balances</span>
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Trading Pairs */}
        <div className="xl:col-span-1 lg:col-span-1 order-1 xl:order-1">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Markets</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {tradingPairs.map((pair) => (
                  <button
                    key={pair.symbol}
                    onClick={() => handlePairSelect(pair)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedPair?.symbol === pair.symbol
                        ? 'bg-blue-50 border-blue-200 border'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900">{pair.symbol}</span>
                      <span className={`text-sm font-medium ${
                        pair.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {pair.change24h >= 0 ? '+' : ''}{pair.change24h}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">
                        ${formatPrice(pair.price, pair.price < 1 ? 4 : 2)}
                      </span>
                      <div className="flex items-center">
                        {pair.change24h >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Vol: ${formatPrice(pair.volume24h, 0)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Trading Area */}
        <div className="xl:col-span-2 lg:col-span-2 order-3 lg:order-2 space-y-4 lg:space-y-6">
          {/* Price Chart Placeholder */}
          {selectedPair && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-semibold text-gray-900">{selectedPair.symbol}</h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">
                        ${formatPrice(selectedPair.price, selectedPair.price < 1 ? 4 : 2)}
                      </span>
                      <span className={`flex items-center text-sm font-medium ${
                        selectedPair.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedPair.change24h >= 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {selectedPair.change24h >= 0 ? '+' : ''}{selectedPair.change24h}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">24h High:</span>
                      <span className="ml-1">${formatPrice(selectedPair.high24h, selectedPair.high24h < 1 ? 4 : 2)}</span>
                    </div>
                    <div>
                      <span className="font-medium">24h Low:</span>
                      <span className="ml-1">${formatPrice(selectedPair.low24h, selectedPair.low24h < 1 ? 4 : 2)}</span>
                    </div>
                    <div>
                      <span className="font-medium">24h Volume:</span>
                      <span className="ml-1">${formatPrice(selectedPair.volume24h, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Price Chart</p>
                    <p className="text-sm text-gray-400">Chart integration would go here</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Book */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Order Book</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Asks (Sell Orders) */}
                <div>
                  <div className="text-sm font-medium text-red-600 mb-2">Asks (Sell)</div>
                  <div className="space-y-1">
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 font-medium">
                      <span>Price</span>
                      <span className="text-right">Amount</span>
                      <span className="text-right">Total</span>
                    </div>
                    {orderBook.asks.slice(0, 8).reverse().map((ask, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2 text-xs hover:bg-red-50 p-1 rounded">
                        <span className="text-red-600 font-medium">
                          {formatPrice(ask.price, selectedPair?.price && selectedPair.price < 1 ? 4 : 2)}
                        </span>
                        <span className="text-right text-gray-900">
                          {ask.amount.toFixed(4)}
                        </span>
                        <span className="text-right text-gray-600">
                          {formatPrice(ask.total, 2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bids (Buy Orders) */}
                <div>
                  <div className="text-sm font-medium text-green-600 mb-2">Bids (Buy)</div>
                  <div className="space-y-1">
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 font-medium">
                      <span>Price</span>
                      <span className="text-right">Amount</span>
                      <span className="text-right">Total</span>
                    </div>
                    {orderBook.bids.slice(0, 8).map((bid, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2 text-xs hover:bg-green-50 p-1 rounded">
                        <span className="text-green-600 font-medium">
                          {formatPrice(bid.price, selectedPair?.price && selectedPair.price < 1 ? 4 : 2)}
                        </span>
                        <span className="text-right text-gray-900">
                          {bid.amount.toFixed(4)}
                        </span>
                        <span className="text-right text-gray-600">
                          {formatPrice(bid.total, 2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Panel */}
        <div className="xl:col-span-1 lg:col-span-3 xl:col-span-1 order-2 lg:order-3 space-y-4 lg:space-y-6">
          {/* Balances */}
          {showBalances && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Balances</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">BTC</span>
                    <span className="text-sm font-medium text-gray-900">0.12345678</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ETH</span>
                    <span className="text-sm font-medium text-gray-900">2.45678901</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">USDT</span>
                    <span className="text-sm font-medium text-gray-900">5,432.10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">BNB</span>
                    <span className="text-sm font-medium text-gray-900">15.67890123</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Form */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Place Order</h3>
            </div>
            <div className="p-4">
              {/* Order Type Tabs */}
              <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setOrderType('limit')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    orderType === 'limit'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Limit
                </button>
                <button
                  onClick={() => setOrderType('market')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    orderType === 'market'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Market
                </button>
              </div>

              {/* Buy/Sell Tabs */}
              <div className="flex space-x-1 mb-4">
                <button
                  onClick={() => setOrderSide('buy')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    orderSide === 'buy'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setOrderSide('sell')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    orderSide === 'sell'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Sell
                </button>
              </div>

              <div className="space-y-4">
                {/* Price Input (for limit orders) */}
                {orderType === 'limit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price ({selectedPair?.quoteAsset || 'USDT'})
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ({selectedPair?.baseAsset || 'BTC'})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Order Summary */}
                {amount && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Calculator className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Order Summary</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fee (0.1%)</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(calculateFee())}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900">Final Total</span>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(calculateTotal() + calculateFee())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Place Order Button */}
                <button
                  onClick={placeOrder}
                  disabled={placing || !selectedPair || !amount || (orderType === 'limit' && !price)}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    orderSide === 'buy'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {placing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Placing Order...</span>
                    </div>
                  ) : (
                    `${orderSide === 'buy' ? 'Buy' : 'Sell'} ${selectedPair?.baseAsset || 'BTC'}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders and Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Orders */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Open Orders</h3>
          </div>
          <div className="p-4">
            {orders.filter(order => order.status !== 'filled' && order.status !== 'cancelled').length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No open orders</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pair</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Side</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders
                      .filter(order => order.status !== 'filled' && order.status !== 'cancelled')
                      .map((order) => (
                        <tr key={order.id}>
                          <td className="px-3 py-3 text-sm font-medium text-gray-900">
                            {order.symbol}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <span className={`font-medium ${
                              order.side === 'buy' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {order.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900">
                            {order.amount.toFixed(4)}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900">
                            {order.type === 'market' ? 'Market' : `$${formatPrice(order.price || 0)}`}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              getStatusColor(order.status)
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <button
                              onClick={() => cancelOrder(order.id)}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Trade History */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Trade History</h3>
          </div>
          <div className="p-4">
            {trades.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No trades yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pair</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Side</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {trades.map((trade) => (
                      <tr key={trade.id}>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">
                          {trade.symbol}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <span className={`font-medium ${
                            trade.side === 'buy' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {trade.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900">
                          {trade.amount.toFixed(4)}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900">
                          ${formatPrice(trade.price)}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900">
                          {formatCurrency(trade.total)}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500">
                          {trade.timestamp.toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;