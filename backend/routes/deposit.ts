import express from 'express';
import { authenticate } from '../middleware/auth';
import { User, Transaction, AdminConfig } from '../models';
import crypto from 'crypto';

const router = express.Router();

// Get deposit addresses for all supported currencies
router.get('/addresses', authenticate, async (req, res) => {
  try {
    const config = await AdminConfig.getConfig();
    
    const depositAddresses = {
      BTC: config.depositAddresses.BTC || generateDepositAddress('BTC', req.user.userId),
      ETH: config.depositAddresses.ETH || generateDepositAddress('ETH', req.user.userId),
      TRC20: config.depositAddresses.TRC20 || generateDepositAddress('TRC20', req.user.userId)
    };

    res.json({
      addresses: depositAddresses,
      instructions: {
        BTC: 'Send Bitcoin to this address. Minimum deposit: 0.001 BTC',
        ETH: 'Send Ethereum to this address. Minimum deposit: 0.01 ETH',
        TRC20: 'Send USDT (TRC20) to this address. Minimum deposit: 10 USDT'
      },
      minimumAmounts: {
        BTC: 0.001,
        ETH: 0.01,
        TRC20: 10
      }
    });
  } catch (error) {
    console.error('Deposit addresses fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch deposit addresses' });
  }
});

// Get deposit history
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, currency } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {
      userId: req.user.userId,
      type: 'deposit'
    };

    if (currency && currency !== 'all') {
      filter.currency = currency;
    }

    const deposits = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-__v');

    const total = await Transaction.countDocuments(filter);

    res.json({
      deposits,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Deposit history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch deposit history' });
  }
});

// Create a manual deposit record (for testing or admin purposes)
router.post('/manual', authenticate, async (req, res) => {
  try {
    const { currency, amount, txHash } = req.body;

    // Validate input
    if (!currency || !amount || !txHash) {
      return res.status(400).json({ error: 'Currency, amount, and transaction hash are required' });
    }

    const supportedCurrencies = ['BTC', 'ETH', 'TRC20'];
    if (!supportedCurrencies.includes(currency)) {
      return res.status(400).json({ error: 'Unsupported currency' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Check if transaction already exists
    const existingTx = await Transaction.findOne({ transactionHash: txHash });
    if (existingTx) {
      return res.status(400).json({ error: 'Transaction already exists' });
    }

    // Create deposit transaction
    const deposit = new Transaction({
      userId: req.user.userId,
      type: 'deposit',
      currency,
      amount: Number(amount),
      status: 'pending',
      transactionHash: txHash,
      fromAddress: 'external',
      toAddress: generateDepositAddress(currency, req.user.userId),
      metadata: {
        source: 'manual',
        createdBy: req.user.userId
      }
    });

    await deposit.save();

    res.status(201).json({
      message: 'Deposit created successfully',
      deposit
    });
  } catch (error) {
    console.error('Manual deposit creation error:', error);
    res.status(500).json({ error: 'Failed to create deposit' });
  }
});

// Confirm/process a deposit (admin or automated system)
router.post('/confirm/:transactionId', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { confirmations = 1 } = req.body;

    const deposit = await Transaction.findById(transactionId);
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    if (deposit.type !== 'deposit') {
      return res.status(400).json({ error: 'Transaction is not a deposit' });
    }

    if (deposit.status === 'completed') {
      return res.status(400).json({ error: 'Deposit already confirmed' });
    }

    // Update deposit status
    deposit.status = 'completed';
    deposit.metadata = {
      ...deposit.metadata,
      confirmations,
      confirmedAt: new Date(),
      confirmedBy: req.user.userId
    };
    await deposit.save();

    // Update user balance
    const user = await User.findById(deposit.userId);
    if (user) {
      user.balances[deposit.currency as keyof typeof user.balances] += deposit.amount;
      await user.save();
    }

    res.json({
      message: 'Deposit confirmed successfully',
      deposit,
      newBalance: user?.balances[deposit.currency as keyof typeof user.balances]
    });
  } catch (error) {
    console.error('Deposit confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm deposit' });
  }
});

// Get deposit status by transaction hash
router.get('/status/:txHash', authenticate, async (req, res) => {
  try {
    const { txHash } = req.params;

    const deposit = await Transaction.findOne({
      transactionHash: txHash,
      type: 'deposit'
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Check if user owns this deposit
    if (deposit.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      status: deposit.status,
      amount: deposit.amount,
      currency: deposit.currency,
      confirmations: deposit.metadata?.confirmations || 0,
      createdAt: deposit.createdAt,
      confirmedAt: deposit.metadata?.confirmedAt
    });
  } catch (error) {
    console.error('Deposit status fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch deposit status' });
  }
});

// Helper function to generate deposit addresses
function generateDepositAddress(currency: string, userId: string): string {
  const hash = crypto.createHash('sha256').update(`${currency}-${userId}-${Date.now()}`).digest('hex');
  
  switch (currency) {
    case 'BTC':
      return `bc1q${hash.substring(0, 39)}`; // Bech32 format
    case 'ETH':
      return `0x${hash.substring(0, 40)}`; // Ethereum format
    case 'TRC20':
      return `T${hash.substring(0, 33)}`; // TRON format
    default:
      return hash.substring(0, 34);
  }
}

export default router;