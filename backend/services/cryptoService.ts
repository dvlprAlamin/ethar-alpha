import axios from 'axios';
import { COINGECKO_API_BASE_URL } from '../config/environment';

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  last_updated: string;
}

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
}

class CryptoService {
  private readonly baseUrl: string;
  // private apiKey = process.env.COINGECKO_API_KEY;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes cache

  // Method to clear cache
  clearCache(): void {
    this.cache.clear();
    console.log('Crypto service cache cleared');
  }

  // Method to clear specific cache entry
  clearCacheEntry(key: string): void {
    this.cache.delete(key);
    console.log(`Cache entry cleared for key: ${key}`);
  }

  constructor() {
    this.baseUrl = COINGECKO_API_BASE_URL;
  }

  async getCryptoPrices(
    symbols: string[] = [
      'bitcoin', 'ethereum', 'binancecoin', 'ripple', 'cardano', 
      'solana', 'dogecoin', 'polygon', 'avalanche-2', 'polkadot',
      'chainlink', 'uniswap', 'litecoin', 'bitcoin-cash', 'stellar',
      'vechain', 'filecoin', 'tron', 'ethereum-classic', 'monero',
      'cosmos', 'algorand', 'tezos', 'eos', 'aave'
    ]
  ): Promise<CryptoPrice[]> {
    const cacheKey = `prices_${symbols.join('_')}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('Returning cached crypto data');
      return cached.data;
    }

    try {
      console.log(`Fetching crypto prices for ${symbols.length} symbols:`, symbols);
      
      const response = await axios.get(
        `${this.baseUrl}/simple/price`,
        {
          params: {
            ids: symbols.join(','),
            vs_currencies: 'usd',
            include_24hr_change: true,
            include_market_cap: true,
            include_24hr_vol: true,
          },
          timeout: 15000, // Increased timeout
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EtharAlpha/1.0'
          }
        }
      );

      const prices = response.data;
      console.log(`CoinGecko API response received for ${Object.keys(prices).length} coins`);
      console.log('Sample response data:', Object.keys(prices).slice(0, 3));

      // Transform the data to match our interface
      const transformedData: CryptoPrice[] = symbols
        .filter(symbol => {
          const hasData = prices[symbol] && prices[symbol].usd;
          if (!hasData) {
            console.warn(`No data found for symbol: ${symbol}`);
          }
          return hasData;
        })
        .map(symbol => ({
          symbol: symbol.toUpperCase(),
          name: symbol.charAt(0).toUpperCase() + symbol.slice(1),
          price: prices[symbol].usd || 0,
          change24h: prices[symbol].usd_24h_change || 0,
          change7d: 0,
          marketCap: prices[symbol].usd_market_cap || 0,
          volume: prices[symbol].usd_24h_vol || 0,
          high24h: 0,
          low24h: 0,
          lastUpdated: new Date().toISOString()
        }));

      if (transformedData.length === 0) {
        console.error('No valid crypto data received from API');
        throw new Error('No valid cryptocurrency data received from CoinGecko API');
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now(),
      });

      console.log(`Successfully fetched and cached ${transformedData.length} crypto prices`);
      return transformedData;
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
          url: error.config?.url,
        });
        
        // Log specific error types
        if (error.code === 'ECONNABORTED') {
          console.error('Request timeout - CoinGecko API may be slow');
        } else if (error.response?.status === 429) {
          console.error('Rate limit exceeded - too many requests to CoinGecko');
        } else if (error.response?.status === 403) {
          console.error('Access forbidden - check API key or permissions');
        }
      }

      // Return fallback data on error
      const fallbackData: CryptoPrice[] = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 45000,
          change24h: 2.5,
          change7d: 0,
          marketCap: 850000000000,
          volume: 25000000000,
          high24h: 0,
          low24h: 0,
          lastUpdated: new Date().toISOString(),
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3200,
          change24h: -1.2,
          change7d: 0,
          marketCap: 380000000000,
          volume: 15000000000,
          high24h: 0,
          low24h: 0,
          lastUpdated: new Date().toISOString(),
        },
        {
          symbol: 'TRX',
          name: 'Tron',
          price: 0.12,
          change24h: 0.8,
          change7d: 0,
          marketCap: 10000000000,
          volume: 800000000,
          high24h: 0,
          low24h: 0,
          lastUpdated: new Date().toISOString(),
        },
      ];

      console.log('Returning fallback crypto data due to API error');
      return fallbackData;
    }
  }
}

export const cryptoService = new CryptoService();
export default CryptoService;
export type { CryptoPrice };
