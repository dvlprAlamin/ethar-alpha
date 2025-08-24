import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { User, AdminConfig } from '../models';
import { Withdrawal } from '../models/Withdrawal';
import {
  UserBalanceInfo,
  BalanceAdjustmentRequest,
  WalletConfig,
  WalletAddressUpdate,
  ApiResponse,
} from '../types';
import mongoose from 'mongoose';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [userStats] = await Promise.all([getUserStats()]);

    const platformStats = {
      users: userStats,

      lastUpdated: new Date(),
    };

    res.json(platformStats);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      filter.isActive = status === 'active';
    }

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password -twoFactorSecret')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Format users with balances for admin panel
    const formattedUsers = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      balances: user.balances || { BTC: 0, ETH: 0, TRC20: 0, USD: 0 },
    }));

    const total = await User.countDocuments(filter);

    res.json({
      users: formattedUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// System configuration
router.get('/config', async (req, res) => {
  try {
    const config = await AdminConfig.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update system configuration
router.patch('/config', async (req, res) => {
  try {
    const updates = req.body;
    const config = await AdminConfig.updateConfig(updates);

    res.json({
      message: 'Configuration updated successfully',
      config,
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// System maintenance
router.post('/maintenance', async (req, res) => {
  try {
    const { enabled, message } = req.body;

    const currentConfig = await AdminConfig.getConfig();
    const config = await AdminConfig.updateConfig({
      platformSettings: {
        ...currentConfig.platformSettings,
        maintenanceMode: enabled,
        maintenanceMessage:
          message || 'System is under maintenance. Please try again later.',
      },
    });

    res.json({
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      config,
    });
  } catch (error) {
    console.error('Maintenance mode error:', error);
    res.status(500).json({ error: 'Failed to update maintenance mode' });
  }
});

// User balance management
router.get('/users/:userId/balances', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('balances email name');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        balances: user.balances || { BTC: 0, ETH: 0, TRC20: 0, USD: 0 },
      },
    });
  } catch (error) {
    console.error('Get user balances error:', error);
    res.status(500).json({ error: 'Failed to fetch user balances' });
  }
});

// Adjust user balance
router.post('/users/:userId/balance-adjustment', async (req, res) => {
  try {
    const { userId } = req.params;
    const { currency, amount, type } = req.body;

    if (!['BTC', 'ETH', 'TRC20', 'USD'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    if (!['add', 'reduce'].includes(type)) {
      return res.status(400).json({ error: 'Invalid adjustment type' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize balances if not exists
    if (!user.balances) {
      user.balances = { BTC: 0, ETH: 0, TRC20: 0, USD: 0 };
    }

    const currentBalance = user.balances[currency] || 0;
    const adjustmentAmount = type === 'add' ? amount : -amount;
    const newBalance = currentBalance + adjustmentAmount;

    if (newBalance < 0) {
      return res
        .status(400)
        .json({ error: 'Insufficient balance for reduction' });
    }

    // Update user balance
    user.balances[currency] = newBalance;
    await user.save();

    // Log the balance adjustment (you might want to create a separate BalanceLog model)
    const logEntry = {
      userId: user._id,
      adminId: req.user.id,
      currency,
      amount: adjustmentAmount,
      previousBalance: currentBalance,
      newBalance,
      timestamp: new Date(),
    };

    // For now, we'll just log to console. In production, save to database
    console.log('Balance adjustment:', logEntry);

    res.json({
      message: 'Balance adjusted successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        balances: user.balances,
      },
      adjustment: {
        currency,
        amount: adjustmentAmount,
        previousBalance: currentBalance,
        newBalance,
      },
    });
  } catch (error) {
    console.error('Balance adjustment error:', error);
    res.status(500).json({ error: 'Failed to adjust balance' });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    // Check if user has active trades or pending withdrawals
    const pendingWithdrawals = await Withdrawal.countDocuments({
      userId: userId,
      status: 'pending'
    });

    if (pendingWithdrawals > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with pending withdrawals. Please process all withdrawals first.' 
      });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Log the deletion
    console.log(`User deleted by admin:`, {
      deletedUserId: userId,
      deletedUserEmail: user.email,
      deletedUserName: user.name,
      adminId: req.user.id,
      timestamp: new Date()
    });

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get wallet configuration
router.get('/wallet-config', async (req, res) => {
  try {
    const config = await AdminConfig.getConfig();
    res.json({
      depositAddresses: config.depositAddresses || {
        BTC: '',
        ETH: '',
        TRC20: '',
        BNB: '',
      },
      qrCodes: config.qrCodes || {
        BTC: null,
        ETH: null,
        TRC20: null,
        BNB: null,
      },
    });
  } catch (error) {
    console.error('Wallet config fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet configuration' });
  }
});

// Update wallet addresses
router.put('/wallet-config/addresses', async (req, res) => {
  try {
    const { BTC, ETH, TRC20, BNB } = req.body;

    const currentConfig = await AdminConfig.getConfig();
    const updatedConfig = await AdminConfig.updateConfig({
      depositAddresses: {
        BTC: BTC || currentConfig.depositAddresses?.BTC || '',
        ETH: ETH || currentConfig.depositAddresses?.ETH || '',
        TRC20: TRC20 || currentConfig.depositAddresses?.TRC20 || '',
        BNB: BNB || currentConfig.depositAddresses?.BNB || '',
      },
    });

    res.json({
      message: 'Wallet addresses updated successfully',
      depositAddresses: updatedConfig.depositAddresses,
    });
  } catch (error) {
    console.error('Wallet addresses update error:', error);
    res.status(500).json({ error: 'Failed to update wallet addresses' });
  }
});

// DELETE wallet address
router.delete('/wallet-config/addresses/:currency', async (req, res) => {
  try {
    const { currency } = req.params;

    if (!['BTC', 'ETH', 'TRC20', 'BNB'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    const config = await AdminConfig.getConfig();

    // Use $unset to properly remove the fields
    const updateQuery = {
      $unset: {
        [`depositAddresses.${currency}`]: 1,
        [`qrCodes.${currency}`]: 1,
      },
    };

    await AdminConfig.findByIdAndUpdate(config._id, updateQuery);

    // Get updated config
    const updatedConfig = await AdminConfig.getConfig();

    res.json({
      message: `${currency} wallet configuration deleted successfully`,
      config: {
        depositAddresses: updatedConfig.depositAddresses,
        qrCodes: updatedConfig.qrCodes,
      },
    });
  } catch (error) {
    console.error('Error deleting wallet config:', error);
    res.status(500).json({ error: 'Failed to delete wallet configuration' });
  }
});

// Upload QR code as base64
router.post('/wallet-config/qr-upload/:currency', async (req, res) => {
  try {
    const { currency } = req.params;
    const { qrCodeBase64 } = req.body;

    if (!['BTC', 'ETH', 'TRC20', 'BNB'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    if (!qrCodeBase64) {
      return res.status(400).json({ error: 'No QR code data provided' });
    }

    // Validate base64 format (should start with data:image/)
    if (!qrCodeBase64.startsWith('data:image/')) {
      return res
        .status(400)
        .json({ error: 'Invalid QR code format. Must be a base64 image.' });
    }

    // Update config with QR code base64 data
    const currentConfig = await AdminConfig.getConfig();
    const qrCodes = currentConfig.qrCodes || {};
    qrCodes[currency] = qrCodeBase64;

    const updatedConfig = await AdminConfig.updateConfig({ qrCodes });

    res.json({
      message: 'QR code uploaded successfully',
      currency,
      qrCodeData: qrCodes[currency],
    });
  } catch (error) {
    console.error('QR code upload error:', error);
    res.status(500).json({ error: 'Failed to upload QR code' });
  }
});

// Withdrawal request management
router.get('/withdrawal-requests', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build query based on status filter
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch withdrawal requests from database
    const withdrawalRequests = await Withdrawal.find(query)
      .populate('userId', 'name email')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Withdrawal.countDocuments(query);

    // Format the response to match frontend expectations
    const formattedRequests = withdrawalRequests.map((withdrawal) => ({
      id: withdrawal._id.toString(),
      userId: withdrawal.userId._id.toString(),
      userEmail: (withdrawal.userId as any).email,
      userName: (withdrawal.userId as any).name,
      currency: withdrawal.currency,
      amount: withdrawal.amount,
      address: withdrawal.address,
      network: withdrawal.network,
      status: withdrawal.status,
      requestedAt: withdrawal.requestedAt,
      processedAt: withdrawal.processedAt,
      fee: withdrawal.fee,
      notes: withdrawal.notes,
      rejectionReason: withdrawal.rejectionReason,
    }));

    res.json({
      withdrawalRequests: formattedRequests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Withdrawal requests fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal requests' });
  }
});

// Approve withdrawal request
router.post('/withdrawal-requests/:requestId/approve', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    // Find the withdrawal request
    const withdrawal = await Withdrawal.findById(requestId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal request is not pending' });
    }

    // Update withdrawal status
    withdrawal.status = 'approved';
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = new mongoose.Types.ObjectId(req.user.id);
    withdrawal.notes = notes;
    await withdrawal.save();

    console.log(
      `Withdrawal request ${requestId} approved by admin ${req.user.id}`
    );
    console.log('Admin notes:', notes);

    res.json({
      message: 'Withdrawal request approved successfully',
      requestId,
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: withdrawal.processedAt,
      notes,
    });
  } catch (error) {
    console.error('Withdrawal approval error:', error);
    res.status(500).json({ error: 'Failed to approve withdrawal request' });
  }
});

// Reject withdrawal request
router.post('/withdrawal-requests/:requestId/reject', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    // Find the withdrawal request
    const withdrawal = await Withdrawal.findById(requestId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal request is not pending' });
    }

    // Find the user to restore balance
    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Restore user balance (return the amount + fee)
    const totalAmount = withdrawal.amount + withdrawal.fee;
    const currency = withdrawal.currency as keyof typeof user.balances;
    user.balances[currency] = (user.balances[currency] || 0) + totalAmount;
    await user.save();

    // Update withdrawal status
    withdrawal.status = 'rejected';
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = new mongoose.Types.ObjectId(req.user.id);
    withdrawal.rejectionReason = reason;
    await withdrawal.save();

    console.log(
      `Withdrawal request ${requestId} rejected by admin ${req.user.id}`
    );
    console.log('Rejection reason:', reason);

    res.json({
      message: 'Withdrawal request rejected successfully',
      requestId,
      status: 'rejected',
      rejectedBy: req.user.id,
      rejectedAt: withdrawal.processedAt,
      reason,
    });
  } catch (error) {
    console.error('Withdrawal rejection error:', error);
    res.status(500).json({ error: 'Failed to reject withdrawal request' });
  }
});

// Helper functions
async function getUserStats() {
  const [total, active, newThisMonth] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    }),
  ]);

  return { total, active, newThisMonth };
}

export default router;
