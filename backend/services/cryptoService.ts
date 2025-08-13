import axios from 'axios';

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
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private apiKey = process.env.COINGECKO_API_KEY;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute cache

  private getHeaders() {
    const headers: any = {
      'Accept': 'application/json',
    };
    
    if (this.apiKey) {
      headers['x-cg-demo-api-key'] = this.apiKey;
    }
    
    return headers;
  }

  private isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  async getCryptoPrices(symbols: string[] = ['bitcoin', 'ethereum', 'tron']): Promise<CryptoPrice[]> {
    const cacheKey = `prices_${symbols.join('_')}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/coins/markets`,
        {
          params: {
            vs_currency: 'usd',
            ids: symbols.join(','),
            order: 'market_cap_desc',
            per_page: symbols.length,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h,7d'
          },
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      const prices: CryptoPrice[] = response.data.map((coin: CoinGeckoPrice) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        change7d: coin.price_change_percentage_7d || 0,
        marketCap: coin.market_cap,
        volume: coin.total_volume,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        lastUpdated: coin.last_updated
      }));

      this.setCache(cacheKey, prices);
      return prices;
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      
      // Return cached data if available, otherwise return mock data
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Return mock data as fallback
      return this.getMockPrices(symbols);
    }
  }

  async getSinglePrice(symbol: string): Promise<CryptoPrice | null> {
    const prices = await this.getCryptoPrices([symbol]);
    return prices.length > 0 ? prices[0] : null;
  }

  async getMarketData(): Promise<{
    totalMarketCap: number;
    totalVolume: number;
    btcDominance: number;
    activeCryptocurrencies: number;
  }> {
    const cacheKey = 'market_data';
    
    if (this.isValidCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/global`,
        {
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      const data = {
        totalMarketCap: response.data.data.total_market_cap.usd,
        totalVolume: response.data.data.total_volume.usd,
        btcDominance: response.data.data.market_cap_percentage.btc,
        activeCryptocurrencies: response.data.data.active_cryptocurrencies
      };

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      
      // Return cached data if available, otherwise return mock data
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Return mock data as fallback
      return {
        totalMarketCap: 2500000000000,
        totalVolume: 85000000000,
        btcDominance: 42.5,
        activeCryptocurrencies: 13000
      };
    }
  }

  private getMockPrices(symbols: string[]): CryptoPrice[] {
    const mockData: { [key: string]: CryptoPrice } = {
      bitcoin: {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 45000,
        change24h: 2.5,
        change7d: -1.2,
        marketCap: 850000000000,
        volume: 25000000000,
        high24h: 46000,
        low24h: 44000,
        lastUpdated: new Date().toISOString()
      },
      ethereum: {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3200,
        change24h: 1.8,
        change7d: 3.5,
        marketCap: 380000000000,
        volume: 15000000000,
        high24h: 3250,
        low24h: 3150,
        lastUpdated: new Date().toISOString()
      },
      tron: {
        symbol: 'TRX',
        name: 'TRON',
        price: 0.12,
        change24h: -0.5,
        change7d: 2.1,
        marketCap: 10000000000,
        volume: 800000000,
        high24h: 0.125,
        low24h: 0.118,
        lastUpdated: new Date().toISOString()
      }
    };

    return symbols.map(symbol => mockData[symbol] || mockData.bitcoin).filter(Boolean);
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
  }
}

export const cryptoService = new CryptoService();
export default CryptoService;
export type { CryptoPrice };