import axios from 'axios';
import { STOCK_API_KEY, STOCK_API_BASE_URL } from '../config/environment';
import { Stock, IStock } from '../models';
import logger from '../utils/logger';

interface AlphaVantageQuote {
  '01. symbol': string;
  '02. open': string;
  '03. high': string;
  '04. low': string;
  '05. price': string;
  '06. volume': string;
  '07. latest trading day': string;
  '08. previous close': string;
  '09. change': string;
  '10. change percent': string;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume?: number;
  high24h: number;
  volume24h: number;
  low24h: number;
  lastUpdated: Date;
}

class StockService {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private cache = new Map<string, { data: StockData; timestamp: number }>();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_CACHE_SIZE = 100; // Limit cache size

  constructor() {
    this.apiKey = STOCK_API_KEY;
    this.baseURL = STOCK_API_BASE_URL;
    if (!this.apiKey) {
      logger.warn('Stock API key not found. Using mock data.');
    }
  }

  // Popular stock symbols to track
  private defaultStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
    { symbol: 'INTC', name: 'Intel Corporation' },
  ];

  private isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  private setCache(key: string, data: StockData): void {
    // Implement LRU cache by removing oldest entries when cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private getCache(key: string): StockData | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    // Remove expired cache entry
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  async fetchStockQuote(
    symbol: string,
    retryCount = 0
  ): Promise<StockData | null> {
    const cacheKey = `stock_${symbol}`;

    if (this.isValidCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      if (!this.apiKey || this.apiKey.trim() === '') {
        logger.warn('No valid API key available, using mock data');
        return this.getMockStockData(symbol);
      }

      const response = await axios.get(this.baseURL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey,
        },
        timeout: 10000,
      });

      // Check for API error responses
      if (response.data['Error Message']) {
        throw new Error(`API Error: ${response.data['Error Message']}`);
      }

      if (response.data['Note']) {
        throw new Error(`API Rate Limit: ${response.data['Note']}`);
      }

      const quote = response.data['Global Quote'] as AlphaVantageQuote;

      if (!quote || !quote['01. symbol']) {
        logger.warn(`No data found for stock symbol: ${symbol}`);
        return this.getMockStockData(symbol);
      }

      const stockName =
        this.defaultStocks.find((s) => s.symbol === symbol)?.name || symbol;
      const price = parseFloat(quote['05. price']);
      const previousClose = parseFloat(quote['08. previous close']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(
        quote['10. change percent'].replace('%', '')
      );

      // Validate parsed data
      if (isNaN(price) || isNaN(change) || isNaN(changePercent)) {
        throw new Error(`Invalid data received for ${symbol}`);
      }

      const stockData: StockData = {
        symbol: quote['01. symbol'],
        name: stockName,
        price: price,
        change24h: change,
        changePercent24h: changePercent,
        marketCap: price * 1000000000, // Mock market cap calculation
        volume: parseInt(quote['06. volume']),
        volume24h: parseInt(quote['06. volume']),
        high24h: parseFloat(quote['03. high']),
        low24h: parseFloat(quote['04. low']),
        lastUpdated: new Date(),
      };

      this.setCache(cacheKey, stockData);
      return stockData;
    } catch (error) {
      logger.error(
        `Error fetching stock quote for ${symbol} (attempt ${retryCount + 1}):`,
        error
      );

      // Retry logic for transient errors
      if (retryCount < 2 && (error as any).code !== 'ENOTFOUND') {
        logger.info(`Retrying fetch for ${symbol} in 5 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return this.fetchStockQuote(symbol, retryCount + 1);
      }

      // Return cached data if available, otherwise return mock data
      const cached = this.getCache(cacheKey);
      if (cached) {
        logger.info(`Using cached data for ${symbol}`);
        return cached;
      }

      logger.info(`Using mock data for ${symbol}`);
      return this.getMockStockData(symbol);
    }
  }

  async updateAllStocks(): Promise<void> {
    logger.info('Starting scheduled stock data update');

    try {
      // Sequential processing to avoid rate limiting
      for (const stock of this.defaultStocks) {
        try {
          const stockData = await this.fetchStockQuote(stock.symbol);
          if (stockData) {
            // @ts-ignore
            await Stock.updateStockData(stockData);
            logger.info(`Updated stock data for ${stock.symbol}`);
          }
          // Add delay between API calls to respect rate limits (5 calls per minute)
          await new Promise((resolve) => setTimeout(resolve, 12000)); // 12 seconds delay
        } catch (error) {
          logger.error(
            `Failed to update stock data for ${stock.symbol}:`,
            error
          );
          // Continue with other symbols even if one fails
        }
      }
      logger.info('Completed scheduled stock data update');
    } catch (error) {
      logger.error('Error during scheduled stock update:', error);
      throw error;
    }
  }

  async getAllStocksFromDB(): Promise<IStock[]> {
    try {
      // @ts-ignore
      const stocks = await Stock.getAllStocks();

      // If no stocks in database, initialize with mock data
      if (stocks.length === 0) {
        logger.info('No stocks found in database, initializing with mock data');
        await this.initializeMockStocks();
        // @ts-ignore
        return await Stock.getAllStocks();
      }

      return stocks;
    } catch (error) {
      logger.error('Error fetching stocks from database:', error);
      return [];
    }
  }

  async getStocksBySymbols(symbols: string[]): Promise<IStock[]> {
    try {
      // @ts-ignore
      return await Stock.getStocksBySymbols(symbols);
    } catch (error) {
      logger.error('Error fetching stocks by symbols:', error);
      return [];
    }
  }

  private async initializeMockStocks(): Promise<void> {
    try {
      const mockStocks = this.defaultStocks.map((stock) =>
        this.getMockStockData(stock.symbol)
      );

      for (const stockData of mockStocks) {
        if (stockData) {
          // @ts-ignore
          await Stock.updateStockData(stockData);
        }
      }

      logger.info('Initialized database with mock stock data');
    } catch (error) {
      logger.error('Error initializing mock stocks:', error);
    }
  }

  private getMockStockData(symbol: string): StockData {
    const stockInfo = this.defaultStocks.find((s) => s.symbol === symbol) || {
      symbol,
      name: symbol,
    };

    // Generate more realistic mock data based on actual stock characteristics
    const stockPriceRanges: { [key: string]: { min: number; max: number } } = {
      AAPL: { min: 150, max: 200 },
      GOOGL: { min: 2000, max: 3000 },
      MSFT: { min: 300, max: 400 },
      AMZN: { min: 3000, max: 3500 },
      TSLA: { min: 200, max: 300 },
      META: { min: 200, max: 350 },
      NVDA: { min: 400, max: 800 },
      NFLX: { min: 300, max: 500 },
    };

    const priceRange = stockPriceRanges[symbol] || { min: 50, max: 500 };
    const basePrice =
      Math.random() * (priceRange.max - priceRange.min) + priceRange.min;

    // More realistic daily change (typically -5% to +5%)
    const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
    const change = (basePrice * changePercent) / 100;

    // Calculate realistic high/low based on the change
    const dayRange = Math.abs(change) * 2;
    const high24h = basePrice + dayRange * 0.7;
    const low24h = basePrice - dayRange * 0.7;

    return {
      symbol: stockInfo.symbol,
      name: stockInfo.name,
      price: parseFloat(basePrice.toFixed(2)),
      change24h: parseFloat(change.toFixed(2)),
      changePercent24h: parseFloat(changePercent.toFixed(2)),
      marketCap: Math.floor(
        basePrice * (Math.random() * 500000000 + 100000000)
      ), // 100M to 600M shares
      volume24h: Math.floor(Math.random() * 100000000 + 1000000), // 1M to 101M volume
      high24h: parseFloat(high24h.toFixed(2)),
      low24h: parseFloat(low24h.toFixed(2)),
      lastUpdated: new Date(),
    };
  }

  clearCache(): void {
    this.cache.clear();
    logger.info('Stock service cache cleared');
  }

  getCacheStats(): { size: number; maxSize: number; duration: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      duration: this.CACHE_DURATION,
    };
  }
}

export const stockService = new StockService();
export default stockService;
