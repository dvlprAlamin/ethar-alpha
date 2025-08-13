import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { User, Transaction, Pool, PoolInvestment, TradeOrder, AdminConfig } from '../models';
import mongoose from 'mongoose';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [userStats, transactionStats, poolStats, tradeStats] = await Promise.all([
      getUserStats(),
      getTransactionStats(),
      getPoolStats(),
      getTradeStats()
    ]);

    const platformStats = {
      users: userStats,
      transactions: transactionStats,
      pools: poolStats,
      trades: tradeStats,
      lastUpdated: new Date()
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
        { email: { $regex: search, $options: 'i' } }
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

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(userId).select('-password -twoFactorSecret');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's transaction summary
    const transactionSummary = await Transaction.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get user's active investments
    const activeInvestments = await PoolInvestment.find({
      userId: user._id,
      status: 'active'
    }).populate('poolId', 'name expectedReturnRate');

    // Get user's recent trades
    const recentTrades = await TradeOrder.find({
      userId: user._id
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('type baseAsset quoteAsset amount price status createdAt');

    res.json({
      user,
      statistics: {
        transactions: transactionSummary,
        activeInvestments: activeInvestments.length,
        totalInvested: activeInvestments.reduce((sum, inv) => sum + inv.amount, 0),
        recentTrades
      }
    });
  } catch (error) {
    console.error('User details fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user status
router.patch('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    if (role && ['user', 'admin'].includes(role)) {
      user.role = role;
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Transaction management
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, currency } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (currency && currency !== 'all') {
      filter.currency = currency;
    }

    const transactions = await Transaction.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Update transaction status
router.patch('/transactions/:transactionId/status', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const oldStatus = transaction.status;
    transaction.status = status;
    
    if (note) {
      transaction.metadata = {
        ...transaction.metadata,
        adminNote: note,
        statusUpdatedBy: req.user.userId,
        statusUpdatedAt: new Date()
      };
    }

    await transaction.save();

    // Handle balance updates for status changes
    if (oldStatus !== status) {
      await handleTransactionStatusChange(transaction, oldStatus, status);
    }

    res.json({
      message: 'Transaction status updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Transaction status update error:', error);
    res.status(500).json({ error: 'Failed to update transaction status' });
  }
});

// Pool management
router.get('/pools', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const pools = await Pool.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Pool.countDocuments(filter);

    // Add investment statistics for each pool
    const poolsWithStats = await Promise.all(
      pools.map(async (pool) => {
        const investments = await PoolInvestment.find({ poolId: pool._id });
        const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
        const activeInvestors = investments.filter(inv => inv.status === 'active').length;
        
        return {
          ...pool.toObject(),
          statistics: {
            totalInvested,
            activeInvestors,
            totalInvestors: investments.length
          }
        };
      })
    );

    res.json({
      pools: poolsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Pools fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch pools' });
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
      config
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
        maintenanceMessage: message || 'System is under maintenance. Please try again later.'
      }
    });

    res.json({
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      config
    });
  } catch (error) {
    console.error('Maintenance mode error:', error);
    res.status(500).json({ error: 'Failed to update maintenance mode' });
  }
});

// Helper functions
async function getUserStats() {
  const [total, active, newThisMonth] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    })
  ]);

  return { total, active, newThisMonth };
}

async function getTransactionStats() {
  const [total, pending, completed, totalVolume] = await Promise.all([
    Transaction.countDocuments(),
    Transaction.countDocuments({ status: 'pending' }),
    Transaction.countDocuments({ status: 'completed' }),
    Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  return {
    total,
    pending,
    completed,
    totalVolume: totalVolume[0]?.total || 0
  };
}

async function getPoolStats() {
  const [total, active, totalInvested] = await Promise.all([
    Pool.countDocuments(),
    Pool.countDocuments({ status: 'active' }),
    PoolInvestment.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  return {
    total,
    active,
    totalInvested: totalInvested[0]?.total || 0
  };
}

async function getTradeStats() {
  const [total, completed, totalVolume] = await Promise.all([
    TradeOrder.countDocuments(),
    TradeOrder.countDocuments({ status: 'completed' }),
    TradeOrder.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$amount', '$executedPrice'] } } } }
    ])
  ]);

  return {
    total,
    completed,
    totalVolume: totalVolume[0]?.total || 0
  };
}

async function handleTransactionStatusChange(transaction: any, oldStatus: string, newStatus: string) {
  const user = await User.findById(transaction.userId);
  if (!user) return;

  // Handle deposit confirmations
  if (transaction.type === 'deposit' && oldStatus === 'pending' && newStatus === 'completed') {
    user.balances[transaction.currency as keyof typeof user.balances] += transaction.amount;
    await user.save();
  }

  // Handle withdrawal processing
  if (transaction.type === 'withdrawal' && oldStatus === 'pending' && newStatus === 'failed') {
    // Refund the amount if withdrawal failed
    const totalAmount = transaction.amount + (transaction.fee || 0);
    user.balances[transaction.currency as keyof typeof user.balances] += totalAmount;
    await user.save();
  }
}

export default router;