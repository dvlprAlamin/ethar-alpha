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

  constructor() {
    this.baseUrl = COINGECKO_API_BASE_URL;
  }

  async getCryptoPrices(
    symbols: string[] = ['bitcoin', 'ethereum', 'tron']
  ): Promise<CryptoPrice[]> {
    const cacheKey = `prices_${symbols.join('_')}`;

    try {
      const response = await axios.get(`${this.baseUrl}/coins/markets`, {
        params: {
          vs_currency: 'usd',
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return [];
    }
  }
}

export const cryptoService = new CryptoService();
export default CryptoService;
export type { CryptoPrice };
