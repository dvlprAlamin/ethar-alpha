import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { User, Pool, PoolInvestment, Transaction } from '../models';
import mongoose from 'mongoose';

const router = express.Router();

// Get all active pools
router.get('/', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (status !== 'all') {
      filter.status = status;
    }

    const pools = await Pool.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-__v');

    const total = await Pool.countDocuments(filter);

    // Add calculated fields
    const poolsWithStats = pools.map(pool => ({
      ...pool.toObject(),
      isActive: pool.isActive,
      isFull: pool.isFull,
      capacityPercentage: pool.capacityPercentage,
      daysRemaining: pool.daysRemaining
    }));

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

// Get pool details
router.get('/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(poolId)) {
      return res.status(400).json({ error: 'Invalid pool ID' });
    }

    const pool = await Pool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    // Get investment statistics
    const investments = await PoolInvestment.find({ poolId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const activeInvestments = investments.filter(inv => inv.status === 'active').length;

    res.json({
      ...pool.toObject(),
      isActive: pool.isActive,
      isFull: pool.isFull,
      capacityPercentage: pool.capacityPercentage,
      daysRemaining: pool.daysRemaining,
      statistics: {
        totalInvested,
        activeInvestments,
        totalInvestors: investments.length
      },
      recentInvestments: investments.slice(0, 5).map(inv => ({
        id: inv._id,
        amount: inv.amount,
        investor: inv.userId,
        createdAt: inv.createdAt,
        status: inv.status
      }))
    });
  } catch (error) {
    console.error('Pool details fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch pool details' });
  }
});

// Create new pool (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      duration,
      minimumInvestment,
      maximumInvestment,
      targetAmount,
      expectedReturnRate,
      riskLevel
    } = req.body;

    // Validate input
    if (!name || !description || !duration || !minimumInvestment || !targetAmount || !expectedReturnRate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (duration <= 0 || minimumInvestment <= 0 || targetAmount <= 0 || expectedReturnRate <= 0) {
      return res.status(400).json({ error: 'Numeric values must be positive' });
    }

    if (maximumInvestment && maximumInvestment < minimumInvestment) {
      return res.status(400).json({ error: 'Maximum investment must be greater than minimum' });
    }

    const pool = new Pool({
      name,
      description,
      duration,
      minimumInvestment,
      maximumInvestment: maximumInvestment || targetAmount,
      targetAmount,
      expectedReturnRate,
      riskLevel: riskLevel || 'medium',
      createdBy: req.user.userId,
      startDate: new Date(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
    });

    await pool.save();

    res.status(201).json({
      message: 'Pool created successfully',
      pool
    });
  } catch (error) {
    console.error('Pool creation error:', error);
    res.status(500).json({ error: 'Failed to create pool' });
  }
});

// Invest in a pool
router.post('/:poolId/invest', authenticate, async (req, res) => {
  try {
    const { poolId } = req.params;
    const { amount, currency = 'USD' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(poolId)) {
      return res.status(400).json({ error: 'Invalid pool ID' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid investment amount' });
    }

    const pool = await Pool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    if (!pool.isActive) {
      return res.status(400).json({ error: 'Pool is not active for investments' });
    }

    if (pool.isFull) {
      return res.status(400).json({ error: 'Pool has reached maximum capacity' });
    }

    // Check investment limits
    if (amount < pool.minInvestment) {
      return res.status(400).json({ 
        error: `Minimum investment is ${pool.minInvestment} ${currency}` 
      });
    }

    if (amount > pool.maximumInvestment) {
      return res.status(400).json({ 
        error: `Maximum investment is ${pool.maximumInvestment} ${currency}` 
      });
    }

    // Check if user has sufficient balance
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userBalance = user.balances[currency as keyof typeof user.balances];
    if (userBalance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: amount,
        available: userBalance
      });
    }

    // Check if user already has an active investment in this pool
    const existingInvestment = await PoolInvestment.findOne({
      userId: user._id,
      poolId: pool._id,
      status: 'active'
    });

    if (existingInvestment) {
      return res.status(400).json({ error: 'You already have an active investment in this pool' });
    }

    // Calculate expected returns
    const expectedReturn = amount * (pool.expectedReturnRate / 100);
    const maturityDate = new Date(Date.now() + pool.duration * 24 * 60 * 60 * 1000);

    // Create investment record
    const investment = new PoolInvestment({
      userId: user._id,
      poolId: pool._id,
      amount,
      currency,
      expectedReturn,
      maturityDate,
      status: 'active'
    });

    await investment.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: user._id,
      type: 'pool_investment',
      currency,
      amount,
      status: 'completed',
      metadata: {
        poolId: pool._id,
        poolName: pool.name,
        investmentId: investment._id,
        expectedReturn,
        maturityDate
      }
    });

    await transaction.save();

    // Deduct from user balance
    user.balances[currency as keyof typeof user.balances] -= amount;
    await user.save();

    // Update pool statistics
    pool.currentParticipants += 1;
    pool.currentAmount += amount;
    await pool.save();

    res.status(201).json({
      message: 'Investment successful',
      investment: {
        id: investment._id,
        amount,
        currency,
        expectedReturn,
        maturityDate,
        pool: {
          id: pool._id,
          name: pool.name,
          duration: pool.duration
        }
      },
      newBalance: user.balances[currency as keyof typeof user.balances]
    });
  } catch (error) {
    console.error('Pool investment error:', error);
    res.status(500).json({ error: 'Failed to process investment' });
  }
});

// Get user's investments
router.get('/my/investments', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { userId: req.user.userId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const investments = await PoolInvestment.find(filter)
      .populate('poolId', 'name description expectedReturnRate duration')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await PoolInvestment.countDocuments(filter);

    const investmentsWithStats = investments.map(investment => ({
      ...investment.toObject(),
      isMatured: investment.isMatured,
      actualReturn: investment.actualReturn,
      daysRemaining: Math.max(0, Math.ceil((investment.maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    }));

    res.json({
      investments: investmentsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('User investments fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// Withdraw from pool (early withdrawal with penalty)
router.post('/my/investments/:investmentId/withdraw', authenticate, async (req, res) => {
  try {
    const { investmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(investmentId)) {
      return res.status(400).json({ error: 'Invalid investment ID' });
    }

    const investment = await PoolInvestment.findById(investmentId).populate('poolId');
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    if (investment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (investment.status !== 'active') {
      return res.status(400).json({ error: 'Investment is not active' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate withdrawal amount (with penalty if early)
    let withdrawalAmount = investment.amount;
    let penalty = 0;

    if (!investment.isMatured) {
      // Early withdrawal penalty (10% of principal)
      penalty = investment.amount * 0.1;
      withdrawalAmount = investment.amount - penalty;
    } else {
      // Matured investment gets full return
      withdrawalAmount = investment.amount + investment.actualReturn;
    }

    // Update investment status
    investment.status = 'withdrawn';
    investment.withdrawnAt = new Date();
    investment.actualReturn = investment.isMatured ? investment.expectedReturn : -penalty;
    await investment.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: user._id,
      type: 'pool_withdrawal',
      currency: investment.currency,
      amount: withdrawalAmount,
      status: 'completed',
      metadata: {
        poolId: investment.poolId,
        investmentId: investment._id,
        originalAmount: investment.amount,
        penalty: penalty,
        isEarlyWithdrawal: !investment.isMatured
      }
    });

    await transaction.save();

    // Add to user balance
    user.balances[investment.currency as keyof typeof user.balances] += withdrawalAmount;
    await user.save();

    // Update pool statistics
    const pool = await Pool.findById(investment.poolId);
    if (pool) {
      pool.currentParticipants = Math.max(0, pool.currentParticipants - 1);
      pool.currentAmount = Math.max(0, pool.currentAmount - investment.amount);
      await pool.save();
    }

    res.json({
      message: 'Withdrawal successful',
      withdrawal: {
        amount: withdrawalAmount,
        penalty,
        isEarlyWithdrawal: !investment.isMatured,
        originalInvestment: investment.amount
      },
      newBalance: user.balances[investment.currency as keyof typeof user.balances]
    });
  } catch (error) {
    console.error('Pool withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// Update pool status (admin only)
router.patch('/:poolId/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { poolId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(poolId)) {
      return res.status(400).json({ error: 'Invalid pool ID' });
    }

    const validStatuses = ['active', 'paused', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const pool = await Pool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    pool.status = status;
    await pool.save();

    res.json({
      message: 'Pool status updated successfully',
      pool
    });
  } catch (error) {
    console.error('Pool status update error:', error);
    res.status(500).json({ error: 'Failed to update pool status' });
  }
});

export default router;