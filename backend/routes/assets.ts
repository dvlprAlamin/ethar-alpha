import express from 'express';
import { authenticate } from '../middleware/auth';
import { User } from '../models';
import axios from 'axios';

const router = express.Router();

// Get user's portfolio/balances
router.get('/portfolio', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('balances');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current market prices
    const marketData = await getCryptoPrices();
    
    const portfolio = {
      BTC: {
        balance: user.balances.BTC,
        usdValue: user.balances.BTC * (marketData.bitcoin?.usd || 0),
        price: marketData.bitcoin?.usd || 0
      },
      ETH: {
        balance: user.balances.ETH,
        usdValue: user.balances.ETH * (marketData.ethereum?.usd || 0),
        price: marketData.ethereum?.usd || 0
      },
      TRC20: {
        balance: user.balances.TRC20,
        usdValue: user.balances.TRC20 * 1, // Assuming TRC20 is USDT
        price: 1
      },
      USD: {
        balance: user.balances.USD,
        usdValue: user.balances.USD,
        price: 1
      }
    };

    const totalValue = Object.values(portfolio).reduce((sum, asset) => sum + asset.usdValue, 0);

    res.json({
      portfolio,
      totalValue,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// Get market data for supported cryptocurrencies
router.get('/market-data', async (req, res) => {
  try {
    const marketData = await getCryptoPrices();
    
    const formattedData = {
      BTC: {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: marketData.bitcoin?.usd || 0,
        change24h: marketData.bitcoin?.usd_24h_change || 0,
        marketCap: marketData.bitcoin?.usd_market_cap || 0,
        volume24h: marketData.bitcoin?.usd_24h_vol || 0
      },
      ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        price: marketData.ethereum?.usd || 0,
        change24h: marketData.ethereum?.usd_24h_change || 0,
        marketCap: marketData.ethereum?.usd_market_cap || 0,
        volume24h: marketData.ethereum?.usd_24h_vol || 0
      },
      TRC20: {
        symbol: 'USDT',
        name: 'Tether USD',
        price: 1,
        change24h: 0,
        marketCap: 0,
        volume24h: 0
      }
    };

    res.json(formattedData);
  } catch (error) {
    console.error('Market data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Get detailed asset information
router.get('/asset/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const supportedAssets = ['BTC', 'ETH', 'TRC20'];
    
    if (!supportedAssets.includes(symbol.toUpperCase())) {
      return res.status(400).json({ error: 'Unsupported asset' });
    }

    const marketData = await getCryptoPrices();
    let assetData;

    switch (symbol.toUpperCase()) {
      case 'BTC':
        assetData = {
          symbol: 'BTC',
          name: 'Bitcoin',
          description: 'The first and largest cryptocurrency by market capitalization.',
          price: marketData.bitcoin?.usd || 0,
          change24h: marketData.bitcoin?.usd_24h_change || 0,
          marketCap: marketData.bitcoin?.usd_market_cap || 0,
          volume24h: marketData.bitcoin?.usd_24h_vol || 0,
          circulatingSupply: 21000000,
          maxSupply: 21000000
        };
        break;
      case 'ETH':
        assetData = {
          symbol: 'ETH',
          name: 'Ethereum',
          description: 'A decentralized platform for smart contracts and decentralized applications.',
          price: marketData.ethereum?.usd || 0,
          change24h: marketData.ethereum?.usd_24h_change || 0,
          marketCap: marketData.ethereum?.usd_market_cap || 0,
          volume24h: marketData.ethereum?.usd_24h_vol || 0,
          circulatingSupply: 120000000,
          maxSupply: null
        };
        break;
      case 'TRC20':
        assetData = {
          symbol: 'USDT',
          name: 'Tether USD (TRC20)',
          description: 'A stablecoin pegged to the US Dollar, running on the TRON network.',
          price: 1,
          change24h: 0,
          marketCap: 0,
          volume24h: 0,
          circulatingSupply: 0,
          maxSupply: null
        };
        break;
    }

    res.json(assetData);
  } catch (error) {
    console.error('Asset data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch asset data' });
  }
});

// Get price history for charts
router.get('/price-history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = '7' } = req.query;
    
    const coinId = symbol.toLowerCase() === 'btc' ? 'bitcoin' : 
                   symbol.toLowerCase() === 'eth' ? 'ethereum' : null;
    
    if (!coinId) {
      return res.status(400).json({ error: 'Unsupported asset for price history' });
    }

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: days === '1' ? 'hourly' : 'daily'
        }
      }
    );

    const priceHistory = response.data.prices.map(([timestamp, price]: [number, number]) => ({
      timestamp,
      price,
      date: new Date(timestamp).toISOString()
    }));

    res.json(priceHistory);
  } catch (error) {
    console.error('Price history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// Helper function to get crypto prices from CoinGecko
async function getCryptoPrices() {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'bitcoin,ethereum',
          vs_currencies: 'usd',
          include_24hr_change: 'true',
          include_market_cap: 'true',
          include_24hr_vol: 'true'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('CoinGecko API error:', error);
    return {
      bitcoin: { usd: 0, usd_24h_change: 0, usd_market_cap: 0, usd_24h_vol: 0 },
      ethereum: { usd: 0, usd_24h_change: 0, usd_market_cap: 0, usd_24h_vol: 0 }
    };
  }
}

export default router;