import express from 'express';
import DepositAddress from '../models/DepositAddress';
import { getDatabaseStatus } from '../models/index';

const router = express.Router();

// GET /api/deposits/addresses - Get all active deposit addresses (public route)
router.get('/addresses', async (req, res) => {
  try {
    // Check database connection status
    const dbStatus = getDatabaseStatus();
    if (!dbStatus.isConnected || dbStatus.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable. Please try again later.',
      });
    }

    const depositAddresses = await DepositAddress.getAllActive();

    // Transform data to include QR code URLs for public access
    const transformedAddresses = depositAddresses.map((addr) => ({
      network: addr.network,
      address: addr.address,
      qrCodeUrl: addr.qrCodePath
        ? `${process.env.SERVER_URL}/qr-codes/${addr.qrCodePath}`
        : null,
    }));

    res.json({
      success: true,
      depositAddresses: transformedAddresses,
    });
  } catch (error) {
    console.error('Error fetching deposit addresses:', error);

    // Check if it's a database connection error
    if (error.message && error.message.includes('before initial connection')) {
      return res.status(503).json({
        success: false,
        error: 'Database connection not ready. Please try again later.',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch deposit addresses',
    });
  }
});

// QR code serving is now handled by static file serving from backend/uploads/qr-codes

export default router;
