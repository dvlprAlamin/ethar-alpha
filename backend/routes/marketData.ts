import express from 'express';
import { cryptoService } from '../services/cryptoService';
import { openSeaService } from '../services/openSeaService';
import { stockService } from '../services/stockService';
import { schedulerService } from '../services/schedulerService';
import logger from '../utils/logger';

const router = express.Router();

// Unified market data endpoint
router.get('/market-data', async (req, res) => {
  try {
    const { type } = req.query;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Type parameter is required. Valid types: crypto, nft, stock',
      });
    }

    const validTypes = ['crypto', 'nft', 'stock'];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Valid types: ${validTypes.join(', ')}`,
      });
    }

    let data;
    const dataType = type.toLowerCase();

    switch (dataType) {
      case 'crypto':
        try {
          // Fetch crypto data directly from CoinGecko
          const cryptoData = await cryptoService.getCryptoPrices();
          data = {
            type: 'crypto',
            data: cryptoData,
            source: 'CoinGecko API',
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          logger.error('Error fetching crypto data:', error);
          return res.status(500).json({
            success: false,
            data: [],
            error: 'Failed to fetch cryptocurrency data',
          });
        }
        break;

      case 'nft':
        try {
          // Fetch NFT data directly from OpenSea
          const nftData = await openSeaService.getTrendingCollections();
          data = {
            type: 'nft',
            data: nftData,
            source: 'OpenSea API',
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          logger.error('Error fetching NFT data:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to fetch NFT data',
          });
        }
        break;

      case 'stock':
        try {
          // Fetch stock data from database
          const stockData = await stockService.getAllStocksFromDB();
          data = {
            type: 'stock',
            data: stockData,
            source: 'Database (Updated every 1-1.5 hours)',
            timestamp: new Date().toISOString(),
            schedulerStatus: schedulerService.getSchedulerStatus(),
          };
        } catch (error) {
          logger.error('Error fetching stock data:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to fetch stock data',
          });
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid data type',
        });
    }

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    logger.error('Error in market data endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get NFTs by collection
// router.get('/nft/collection/:slug', async (req, res) => {
//   try {
//     const { slug } = req.params;
//     const { limit } = req.query;

//     const nfts = await openSeaService.getNFTsByCollection(
//       slug,
//       limit ? parseInt(limit as string) : 20
//     );

//     res.json({
//       success: true,
//       type: 'nft',
//       collection: slug,
//       data: nfts,
//       source: 'OpenSea API',
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     logger.error(
//       `Error fetching NFTs for collection ${req.params.slug}:`,
//       error
//     );
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch NFT collection data',
//     });
//   }
// });

// Manual stock update (admin only)
router.post('/stock/update', async (req, res) => {
  try {
    await schedulerService.manualStockUpdate();

    res.json({
      success: true,
      message: 'Stock data updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error during manual stock update:', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update stock data',
    });
  }
});

// Get scheduler status
router.get('/scheduler/status', (req, res) => {
  try {
    const status = schedulerService.getSchedulerStatus();

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status',
    });
  }
});

// Start scheduler
router.post('/scheduler/start', (req, res) => {
  try {
    schedulerService.startScheduler();

    res.json({
      success: true,
      message: 'Scheduler started successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error starting scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start scheduler',
    });
  }
});

// Stop scheduler
router.post('/scheduler/stop', (req, res) => {
  try {
    schedulerService.stopScheduler();

    res.json({
      success: true,
      message: 'Scheduler stopped successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error stopping scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop scheduler',
    });
  }
});

export default router;
