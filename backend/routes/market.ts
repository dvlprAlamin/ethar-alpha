import express from 'express';
import { cryptoService } from '../services/cryptoService';
import { newsService } from '../services/newsService';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Get crypto prices
router.get('/prices', async (req, res) => {
  try {
    const { symbols } = req.query;
    let cryptoSymbols = ['bitcoin', 'ethereum', 'tron'];

    if (symbols && typeof symbols === 'string') {
      cryptoSymbols = symbols.split(',').map((s) => s.trim().toLowerCase());
    }

    const prices = await cryptoService.getCryptoPrices(cryptoSymbols);

    res.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crypto prices',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
});

// Get crypto news
router.get('/news', async (req, res) => {
  try {
    const { limit = '20' } = req.query;
    const newsLimit = Math.min(parseInt(limit as string) || 20, 50); // Max 50 articles

    const news = await newsService.getCryptoNews(newsLimit);
    res.json({
      success: true,
      data: news,
      count: news.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crypto news',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
});

// Get top headlines
router.get('/headlines', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const newsLimit = Math.min(parseInt(limit as string) || 10, 20); // Max 20 headlines

    const headlines = await newsService.getTopHeadlines(newsLimit);

    res.json({
      success: true,
      data: headlines,
      count: headlines.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching top headlines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top headlines',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
});

// Protected route to clear cache (admin only)
router.post('/cache/clear', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    newsService.clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
});

export default router;
