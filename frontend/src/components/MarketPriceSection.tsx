import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useAuthStore } from './../store/authStore';

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image: string;
}

interface NFTData {
  name: string;
  floor_price: number;
  floor_price_change_24h: number;
  volume_24h: number;
  image_url: string;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

type TabType = 'crypto' | 'nft' | 'stocks';

const MarketPriceSection: React.FC<{ isDashboard?: boolean }> = ({
  isDashboard,
}) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('crypto');
  const [searchTerm] = useState('');
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [nftData, setNftData] = useState<NFTData[]>([]);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setLastUpdate] = useState<Date>(new Date());

  // Unified fetch function for all market data types
  const fetchMarketData = async (type: TabType) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/market-data?type=${type}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        switch (type) {
          case 'crypto':
            setCryptoData(data.data);
            break;
          case 'nft':
            setNftData(data.data);
            break;
          case 'stocks':
            setStockData(data.data);
            break;
        }
      } else {
        throw new Error(data.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      // Set fallback data based on type
      setFallbackData(type);
    } finally {
      setLoading(false);
    }
  };

  // Fallback data function for when API fails
  const setFallbackData = (type: TabType) => {
    switch (type) {
      case 'crypto':
        setCryptoData([
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            current_price: 43250,
            price_change_percentage_24h: 2.5,
            market_cap: 847000000000,
            image:
              'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=bitcoin%20cryptocurrency%20logo&image_size=square',
          },
          {
            id: 'ethereum',
            symbol: 'eth',
            name: 'Ethereum',
            current_price: 2650,
            price_change_percentage_24h: -1.2,
            market_cap: 318000000000,
            image:
              'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=ethereum%20cryptocurrency%20logo&image_size=square',
          },
        ]);
        break;
      case 'nft':
        setNftData([
          {
            name: 'Bored Ape Yacht Club',
            floor_price: 12.5,
            floor_price_change_24h: -2.3,
            volume_24h: 145.7,
            image_url:
              'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=bored%20ape%20nft%20collection%20avatar&image_size=square',
          },
          {
            name: 'CryptoPunks',
            floor_price: 45.2,
            floor_price_change_24h: 1.8,
            volume_24h: 89.3,
            image_url:
              'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cryptopunks%20pixel%20art%20nft&image_size=square',
          },
        ]);
        break;
      case 'stocks':
        setStockData([
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            price: 175.43,
            change: 2.15,
            changePercent: 1.24,
          },
          {
            symbol: 'GOOGL',
            name: 'Alphabet Inc.',
            price: 2847.63,
            change: -15.32,
            changePercent: -0.53,
          },
        ]);
        break;
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const fetchData = () => {
      fetchMarketData(activeTab);
      setLastUpdate(new Date());
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  const formatPrice = (price: number, currency = 'USD') => {
    if (currency === 'ETH') {
      return `${price.toFixed(2)} ETH`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(1)}B`;
    }
    if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(1)}M`;
    }
    if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(1)}K`;
    }
    return `$${num.toFixed(0)}`;
  };

  // const filteredCryptoData = cryptoData.filter(
  //   (item) =>
  //     item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  const filteredNFTData = nftData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.name.includes('0x') &&
      item.image_url
  );

  const filteredStockData = stockData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-8 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isDashboard ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 mb-5">Welcome back, {user?.name}</p>
            </div>
          </div>
        ) : null}
        <div className="bg-slate-900 rounded-lg shadow-sm border border-slate-700 mb-6">
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            {/* Tabs */}
            <div className="flex space-x-1 mt-4 bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('crypto')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'crypto'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Crypto Currencies
              </button>
              <button
                onClick={() => setActiveTab('nft')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'nft'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                NFTs
              </button>
              <button
                onClick={() => setActiveTab('stocks')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'stocks'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Stocks &amp; Tokens
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
                <span className="ml-2 text-slate-400">
                  Loading market data...
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cryptocurrency Tab */}
                {activeTab === 'crypto' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cryptoData.map((crypto) => (
                      <div
                        key={crypto.id}
                        className="p-4 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 transition-all"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={crypto.image}
                            alt={crypto.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-semibold text-white">
                              {crypto.symbol.toUpperCase()}
                            </p>
                            <p className="text-sm text-slate-400">
                              {crypto.name}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-white">
                              {formatPrice(crypto.current_price)}
                            </span>
                            <div
                              className={`flex items-center space-x-1 ${
                                crypto.price_change_percentage_24h >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {crypto.price_change_percentage_24h >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">
                                {crypto.price_change_percentage_24h >= 0
                                  ? '+'
                                  : ''}
                                {crypto.price_change_percentage_24h.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">
                            Market Cap: {formatLargeNumber(crypto.market_cap)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* NFT Tab */}
                {activeTab === 'nft' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredNFTData.map((nft, index) => (
                      <div
                        key={index}
                        className="p-4 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 transition-all"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={nft.image_url}
                            alt={nft.name}
                            className="w-8 h-8 rounded-lg"
                          />
                          <div>
                            <p className="font-semibold text-white">
                              {nft.name}
                            </p>
                            <p className="text-sm text-slate-400">Collection</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-white">
                              {/* {formatPrice(nft.floor_price, 'ETH')} */}
                            </span>
                            {/* <div
                          className={`flex items-center space-x-1 ${
                            nft.floor_price_change_24h >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {nft.floor_price_change_24h >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium">
                            {nft.floor_price_change_24h >= 0 ? '+' : ''}
                            {nft.floor_price_change_24h.toFixed(2)}%
                          </span>
                        </div> */}
                          </div>
                          <div className="text-xs text-slate-400">
                            {/* Volume: {nft.volume_24h.toFixed(1)} ETH */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stocks Tab */}
                {activeTab === 'stocks' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredStockData.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="p-4 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 transition-all"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {stock.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {stock.symbol}
                            </p>
                            <p className="text-sm text-slate-400">
                              {stock.name}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-white">
                              {formatPrice(stock.price)}
                            </span>
                            <div
                              className={`flex items-center space-x-1 ${
                                stock.changePercent >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {stock.changePercent >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">
                                {stock.changePercent >= 0 ? '+' : ''}
                                {stock.changePercent.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">
                            Change: {formatPrice(stock.change)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results */}
                {/* {((activeTab === 'crypto' && filteredCryptoData.length === 0) ||
                  (activeTab === 'nft' && filteredNFTData.length === 0) ||
                  (activeTab === 'stocks' &&
                    filteredStockData.length === 0)) && (
                  <div className="text-center py-8">
                    <p className="text-slate-400">
                      No assets found matching your search.
                    </p>
                  </div>
                )} */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPriceSection;
