import express from 'express';
import { authenticate } from '../middleware/auth';
import User from '../models/User';
import { Withdrawal } from '../models/Withdrawal';
import { AdminConfig } from '../models';
import mongoose from 'mongoose';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create withdrawal request
router.post('/', async (req, res) => {
  try {
    const { currency, amount, address, network } = req.body;
    const userId = req.user!.id;

    // Validation
    if (!currency || !amount || !address || !network) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!['USD', 'BTC', 'ETH', 'TRC20'].includes(currency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Get user and check balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check user balance
    const currentBalance = user.balances[currency as keyof typeof user.balances] || 0;
    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId,
      currency,
      amount,
      address,
      network,
      fee: 0,
      status: 'pending'
    });

    await withdrawal.save();

    // Reduce user balance immediately (pending status)
    user.balances[currency as keyof typeof user.balances] = currentBalance - amount;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: {
        id: withdrawal._id,
        currency,
        amount,
        fee: 0,
        totalAmount: amount,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt
      }
    });

  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's withdrawal history
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10, status } = req.query;

    const query: any = { userId };
    if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const withdrawals = await Withdrawal.find(query)
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('processedBy', 'name email');

    const total = await Withdrawal.countDocuments(query);

    res.json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific withdrawal details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal ID'
      });
    }

    const withdrawal = await Withdrawal.findOne({ _id: id, userId })
      .populate('processedBy', 'name email');

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    res.json({
      success: true,
      data: withdrawal
    });

  } catch (error) {
    console.error('Get withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;