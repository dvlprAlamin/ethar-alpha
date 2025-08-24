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
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image: string;
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
          id: symbol,
          symbol: symbol.toUpperCase(),
          name: symbol.charAt(0).toUpperCase() + symbol.slice(1),
          current_price: prices[symbol].usd || 0,
          price_change_percentage_24h: prices[symbol].usd_24h_change || 0,
          market_cap: prices[symbol].usd_market_cap || 0,
          image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(symbol + ' cryptocurrency logo')}&image_size=square`
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
          id: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          current_price: 45000,
          price_change_percentage_24h: 2.5,
          market_cap: 850000000000,
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=bitcoin%20cryptocurrency%20logo&image_size=square',
        },
        {
          id: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          current_price: 3200,
          price_change_percentage_24h: -1.2,
          market_cap: 380000000000,
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=ethereum%20cryptocurrency%20logo&image_size=square',
        },
        {
          id: 'tron',
          symbol: 'TRX',
          name: 'Tron',
          current_price: 0.12,
          price_change_percentage_24h: 0.8,
          market_cap: 10000000000,
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=tron%20cryptocurrency%20logo&image_size=square',
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
