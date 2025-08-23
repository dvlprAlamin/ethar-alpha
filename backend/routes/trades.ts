import express from 'express';
import { authenticate } from '../middleware/auth';
import { User, Trade } from '../models';
import type { ITrade } from '../models';
// Logger temporarily disabled

const router = express.Router();

// Create a new trade
router.post('/create', authenticate, async (req, res) => {
  try {
    console.log(req.user);
    const userId = req.user?._id;
    const { amount } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Get user and check balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balances.USD < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create trade
    const trade = new Trade({
      userId,
      amount,
      status: 'active',
    });

    // Update user balance
    user.balances.USD -= amount;

    // Save both trade and user
    await Promise.all([trade.save(), user.save()]);

    console.log('Trade created successfully', {
      userId,
      tradeId: trade._id,
      amount,
      remainingBalance: user.balances.USD,
    });

    res.status(201).json({
      message: 'Trade created successfully',
      trade: {
        id: trade._id,
        amount: trade.amount,
        status: trade.status,
        createdAt: trade.createdAt,
      },
      remainingBalance: user.balances.USD,
    });
  } catch (error) {
    console.error('Error creating trade', error, { userId: req.user?._id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's trades
router.get('/user', authenticate, async (req, res) => {
  try {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const trades = await Trade.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalTrades = await Trade.countDocuments({ userId });
    const totalPages = Math.ceil(totalTrades / limit);

    res.json({
      trades,
      pagination: {
        currentPage: page,
        totalPages,
        totalTrades,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching user trades', error, {
      userId: req.user?._id,
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all trades (admin only)
router.get('/all', authenticate, async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status && ['active', 'completed'].includes(status)) {
      query.status = status;
    }

    const trades = await Trade.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalTrades = await Trade.countDocuments(query);
    const totalPages = Math.ceil(totalTrades / limit);

    res.json({
      trades,
      pagination: {
        currentPage: page,
        totalPages,
        totalTrades,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching all trades', error, {
      userId: req.user?._id,
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update trade result (admin only)
router.put('/:tradeId/result', authenticate, async (req, res) => {
  try {
    const userRole = req.user?.role;
    const { tradeId } = req.params;
    const { profitLoss, returnPercentage } = req.body;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!['profit', 'loss'].includes(profitLoss)) {
      return res.status(400).json({ error: 'Invalid profit/loss value' });
    }

    if (typeof returnPercentage !== 'number') {
      return res.status(400).json({ error: 'Invalid return percentage' });
    }

    const trade = await Trade.findById(tradeId);
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.status === 'completed') {
      return res.status(400).json({ error: 'Trade already completed' });
    }

    // Update trade
    trade.profitLoss = profitLoss;
    trade.returnPercentage = returnPercentage;
    trade.status = 'completed';

    // Calculate final amount (this will be done by the pre-save hook)
    await trade.save();

    // Update user balance with final amount
    const user = await User.findById(trade.userId);
    if (user) {
      user.balances.USD += trade.finalAmount;
      await user.save();
    }

    console.log('Trade result updated', {
      tradeId,
      userId: trade.userId,
      profitLoss,
      returnPercentage,
      originalAmount: trade.amount,
      finalAmount: trade.finalAmount,
      adminId: req.user?._id,
    });

    res.json({
      message: 'Trade result updated successfully',
      trade: {
        id: trade._id,
        amount: trade.amount,
        profitLoss: trade.profitLoss,
        returnPercentage: trade.returnPercentage,
        finalAmount: trade.finalAmount,
        status: trade.status,
      },
    });
  } catch (error) {
    console.error('Error updating trade result', error, {
      tradeId: req.params.tradeId,
      adminId: req.user?._id,
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
