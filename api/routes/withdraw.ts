import express from 'express';
import { authenticate, check2FA } from '../middleware/auth';
import { User, Transaction, AdminConfig } from '../models';
import crypto from 'crypto';

const router = express.Router();

// Get withdrawal limits and fees
router.get('/limits', authenticate, async (req, res) => {
  try {
    const config = await AdminConfig.getConfig();
    const user = await User.findById(req.user.userId).select('balances');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const limits = {
      BTC: {
        minimum: 0.001,
        maximum: 10,
        dailyLimit: 5,
        withdrawalTax: config.withdrawalTaxRates.BTC,
        availableBalance: user.balances.BTC
      },
      ETH: {
        minimum: 0.01,
        maximum: 100,
        dailyLimit: 50,
        withdrawalTax: config.withdrawalTaxRates.ETH,
        availableBalance: user.balances.ETH
      },
      TRC20: {
        minimum: 10,
        maximum: 50000,
        dailyLimit: 25000,
        withdrawalTax: config.withdrawalTaxRates.TRC20,
        availableBalance: user.balances.TRC20
      },
      USD: {
        minimum: 10,
        maximum: 10000,
        dailyLimit: 5000,
        withdrawalTax: config.withdrawalTaxRates.USD || 0,
        availableBalance: user.balances.USD
      }
    };

    res.json(limits);
  } catch (error) {
    console.error('Withdrawal limits fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal limits' });
  }
});

// Get withdrawal history
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, currency, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {
      userId: req.user.userId,
      type: 'withdrawal'
    };

    if (currency && currency !== 'all') {
      filter.currency = currency;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const withdrawals = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-__v');

    const total = await Transaction.countDocuments(filter);

    res.json({
      withdrawals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Withdrawal history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal history' });
  }
});

// Calculate withdrawal fee
router.post('/calculate-fee', authenticate, async (req, res) => {
  try {
    const { currency, amount } = req.body;

    if (!currency || !amount) {
      return res.status(400).json({ error: 'Currency and amount are required' });
    }

    const config = await AdminConfig.getConfig();
    const fee = config.getWithdrawalTax(currency, Number(amount));
    const netAmount = Number(amount) - fee;

    if (netAmount <= 0) {
      return res.status(400).json({ error: 'Amount too small after fees' });
    }

    res.json({
      amount: Number(amount),
      fee,
      netAmount,
      currency
    });
  } catch (error) {
    console.error('Fee calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate fee' });
  }
});

// Create withdrawal request
router.post('/request', authenticate, check2FA, async (req, res) => {
  try {
    const { currency, amount, toAddress, note } = req.body;

    // Validate input
    if (!currency || !amount || !toAddress) {
      return res.status(400).json({ error: 'Currency, amount, and address are required' });
    }

    const supportedCurrencies = ['BTC', 'ETH', 'TRC20', 'USD'];
    if (!supportedCurrencies.includes(currency)) {
      return res.status(400).json({ error: 'Unsupported currency' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Validate address format
    if (!isValidAddress(currency, toAddress)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const config = await AdminConfig.getConfig();
    
    // Check minimum amount
    const limits = {
      BTC: 0.001,
      ETH: 0.01,
      TRC20: 10,
      USD: 10
    };

    if (amount < limits[currency as keyof typeof limits]) {
      return res.status(400).json({ 
        error: `Minimum withdrawal amount is ${limits[currency as keyof typeof limits]} ${currency}` 
      });
    }

    // Calculate fee
    const fee = config.getWithdrawalTax(currency, amount);
    const totalDeduction = amount + fee;

    // Check balance
    const currentBalance = user.balances[currency as keyof typeof user.balances];
    if (currentBalance < totalDeduction) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: totalDeduction,
        available: currentBalance
      });
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayWithdrawals = await Transaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: 'withdrawal',
          currency,
          createdAt: { $gte: today },
          status: { $in: ['pending', 'processing', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const dailyLimits = {
      BTC: 5,
      ETH: 50,
      TRC20: 25000,
      USD: 5000
    };

    const todayTotal = todayWithdrawals[0]?.total || 0;
    const dailyLimit = dailyLimits[currency as keyof typeof dailyLimits];
    
    if (todayTotal + amount > dailyLimit) {
      return res.status(400).json({ 
        error: 'Daily withdrawal limit exceeded',
        limit: dailyLimit,
        used: todayTotal,
        remaining: dailyLimit - todayTotal
      });
    }

    // Create withdrawal transaction
    const withdrawal = new Transaction({
      userId: user._id,
      type: 'withdrawal',
      currency,
      amount,
      fee,
      status: 'pending',
      fromAddress: 'platform',
      toAddress,
      transactionHash: generateTransactionHash(),
      metadata: {
        note: note || '',
        requestedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await withdrawal.save();

    // Deduct from user balance (hold the funds)
    user.balances[currency as keyof typeof user.balances] -= totalDeduction;
    await user.save();

    res.status(201).json({
      message: 'Withdrawal request created successfully',
      withdrawal: {
        id: withdrawal._id,
        currency,
        amount,
        fee,
        netAmount: amount,
        toAddress,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt
      },
      newBalance: user.balances[currency as keyof typeof user.balances]
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal request' });
  }
});

// Cancel withdrawal (only if pending)
router.post('/cancel/:transactionId', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const withdrawal = await Transaction.findById(transactionId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (withdrawal.type !== 'withdrawal') {
      return res.status(400).json({ error: 'Transaction is not a withdrawal' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending withdrawals' });
    }

    // Update withdrawal status
    withdrawal.status = 'cancelled';
    withdrawal.metadata = {
      ...withdrawal.metadata,
      cancelledAt: new Date(),
      cancelledBy: req.user.userId
    };
    await withdrawal.save();

    // Refund user balance
    const user = await User.findById(req.user.userId);
    if (user) {
      const totalDeduction = withdrawal.amount + (withdrawal.fee || 0);
      user.balances[withdrawal.currency as keyof typeof user.balances] += totalDeduction;
      await user.save();
    }

    res.json({
      message: 'Withdrawal cancelled successfully',
      withdrawal,
      refundedAmount: withdrawal.amount + (withdrawal.fee || 0)
    });
  } catch (error) {
    console.error('Withdrawal cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel withdrawal' });
  }
});

// Get withdrawal status
router.get('/status/:transactionId', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const withdrawal = await Transaction.findById(transactionId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: withdrawal._id,
      status: withdrawal.status,
      amount: withdrawal.amount,
      fee: withdrawal.fee,
      currency: withdrawal.currency,
      toAddress: withdrawal.toAddress,
      transactionHash: withdrawal.transactionHash,
      createdAt: withdrawal.createdAt,
      processedAt: withdrawal.metadata?.processedAt,
      note: withdrawal.metadata?.note
    });
  } catch (error) {
    console.error('Withdrawal status fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal status' });
  }
});

// Helper functions
function isValidAddress(currency: string, address: string): boolean {
  switch (currency) {
    case 'BTC':
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
    case 'ETH':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'TRC20':
      return /^T[A-Za-z1-9]{33}$/.test(address);
    case 'USD':
      return /^[A-Za-z0-9]{10,50}$/.test(address); // Bank account or payment processor ID
    default:
      return false;
  }
}

function generateTransactionHash(): string {
  return crypto.randomBytes(32).toString('hex');
}

export default router;