import express from 'express';
import { authenticate } from '../middleware/auth';
import { User, TradeOrder, Transaction, AdminConfig } from '../models';
import mongoose from 'mongoose';
import axios from 'axios';

const router = express.Router();

// Get trading pairs and current prices
router.get('/pairs', async (req, res) => {
  try {
    const marketData = await getCryptoPrices();
    
    const tradingPairs = [
      {
        symbol: 'BTC/USD',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        price: marketData.bitcoin?.usd || 0,
        change24h: marketData.bitcoin?.usd_24h_change || 0,
        volume24h: marketData.bitcoin?.usd_24h_vol || 0,
        high24h: marketData.bitcoin?.usd * 1.05,
        low24h: marketData.bitcoin?.usd * 0.95
      },
      {
        symbol: 'ETH/USD',
        baseAsset: 'ETH',
        quoteAsset: 'USD',
        price: marketData.ethereum?.usd || 0,
        change24h: marketData.ethereum?.usd_24h_change || 0,
        volume24h: marketData.ethereum?.usd_24h_vol || 0,
        high24h: marketData.ethereum?.usd * 1.05,
        low24h: marketData.ethereum?.usd * 0.95
      },
      {
        symbol: 'BTC/ETH',
        baseAsset: 'BTC',
        quoteAsset: 'ETH',
        price: (marketData.bitcoin?.usd || 0) / (marketData.ethereum?.usd || 1),
        change24h: (marketData.bitcoin?.usd_24h_change || 0) - (marketData.ethereum?.usd_24h_change || 0),
        volume24h: 0,
        high24h: ((marketData.bitcoin?.usd || 0) / (marketData.ethereum?.usd || 1)) * 1.05,
        low24h: ((marketData.bitcoin?.usd || 0) / (marketData.ethereum?.usd || 1)) * 0.95
      },
      {
        symbol: 'TRC20/USD',
        baseAsset: 'TRC20',
        quoteAsset: 'USD',
        price: 1,
        change24h: 0,
        volume24h: 0,
        high24h: 1.001,
        low24h: 0.999
      }
    ];

    res.json(tradingPairs);
  } catch (error) {
    console.error('Trading pairs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch trading pairs' });
  }
});

// Get order book for a trading pair
router.get('/orderbook/:pair', async (req, res) => {
  try {
    const { pair } = req.params;
    const [baseAsset, quoteAsset] = pair.split('/');
    
    if (!baseAsset || !quoteAsset) {
      return res.status(400).json({ error: 'Invalid trading pair format' });
    }

    // Get recent orders to simulate order book
    const buyOrders = await TradeOrder.find({
      baseAsset,
      quoteAsset,
      type: 'buy',
      status: 'pending'
    })
    .sort({ price: -1 })
    .limit(20)
    .select('price amount');

    const sellOrders = await TradeOrder.find({
      baseAsset,
      quoteAsset,
      type: 'sell',
      status: 'pending'
    })
    .sort({ price: 1 })
    .limit(20)
    .select('price amount');

    // Aggregate orders by price level
    const bids = aggregateOrders(buyOrders, 'buy');
    const asks = aggregateOrders(sellOrders, 'sell');

    res.json({
      pair,
      bids: bids.slice(0, 10),
      asks: asks.slice(0, 10),
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Order book fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order book' });
  }
});

// Create a new trade order
router.post('/order', authenticate, async (req, res) => {
  try {
    const {
      type, // 'buy' or 'sell'
      orderType, // 'market' or 'limit'
      baseAsset,
      quoteAsset,
      amount,
      price
    } = req.body;

    // Validate input
    if (!type || !orderType || !baseAsset || !quoteAsset || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['buy', 'sell'].includes(type)) {
      return res.status(400).json({ error: 'Invalid order type' });
    }

    if (!['market', 'limit'].includes(orderType)) {
      return res.status(400).json({ error: 'Invalid order type' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    if (orderType === 'limit' && (!price || price <= 0)) {
      return res.status(400).json({ error: 'Price is required for limit orders' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const config = await AdminConfig.getConfig();
    
    // Get current market price for market orders
    let orderPrice = price;
    if (orderType === 'market') {
      const marketData = await getCryptoPrices();
      orderPrice = getCurrentPrice(baseAsset, quoteAsset, marketData);
      if (!orderPrice) {
        return res.status(400).json({ error: 'Unable to get market price' });
      }
    }

    // Calculate total cost and fees
    const totalCost = amount * orderPrice;
    const tradingFee = config.calculateTradingFee(totalCost);
    
    // Check if user has sufficient balance
    let requiredBalance;
    let balanceAsset;
    
    if (type === 'buy') {
      requiredBalance = totalCost + tradingFee;
      balanceAsset = quoteAsset;
    } else {
      requiredBalance = amount;
      balanceAsset = baseAsset;
    }

    const userBalance = user.balances[balanceAsset as keyof typeof user.balances];
    if (userBalance < requiredBalance) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: requiredBalance,
        available: userBalance,
        asset: balanceAsset
      });
    }

    // Validate trading limits
    if (!config.validateTradeAmount(totalCost)) {
      return res.status(400).json({ 
        error: `Trade amount must be between ${config.tradingLimits.minimum} and ${config.tradingLimits.maximum} USD` 
      });
    }

    // Create trade order
    const order = new TradeOrder({
      userId: user._id,
      type,
      orderType,
      baseAsset,
      quoteAsset,
      amount,
      price: orderPrice,
      fee: tradingFee,
      status: orderType === 'market' ? 'pending' : 'pending'
    });

    await order.save();

    // For market orders, execute immediately
    if (orderType === 'market') {
      await executeOrder(order, user, config);
    } else {
      // For limit orders, hold the balance
      if (type === 'buy') {
        user.balances[quoteAsset as keyof typeof user.balances] -= (totalCost + tradingFee);
      } else {
        user.balances[baseAsset as keyof typeof user.balances] -= amount;
      }
      await user.save();
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order._id,
        type: order.type,
        orderType: order.orderType,
        pair: `${baseAsset}/${quoteAsset}`,
        amount: order.amount,
        price: order.price,
        totalCost: order.totalCost,
        fee: order.fee,
        status: order.status,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user's trading history
router.get('/history', authenticate, async (req, res) => {
  try {
    const { status, pair, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { userId: req.user.userId };
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (pair && pair !== 'all') {
      const [baseAsset, quoteAsset] = (pair as string).split('/');
      if (baseAsset && quoteAsset) {
        filter.baseAsset = baseAsset;
        filter.quoteAsset = quoteAsset;
      }
    }

    const orders = await TradeOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-__v');

    const total = await TradeOrder.countDocuments(filter);

    const ordersWithStats = orders.map(order => ({
      ...order.toObject(),
      pair: `${order.baseAsset}/${order.quoteAsset}`,
      totalCost: order.totalCost,
      totalReceived: order.totalReceived,
      profitLoss: order.profitLoss,
      executionPercentage: order.executionPercentage,
      isActive: order.isActive
    }));

    res.json({
      orders: ordersWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Trading history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch trading history' });
  }
});

// Cancel an order
router.post('/order/:orderId/cancel', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await TradeOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!order.isActive) {
      return res.status(400).json({ error: 'Order is not active' });
    }

    // Cancel the order
    await order.cancel();

    // Refund user balance for limit orders
    if (order.orderType === 'limit') {
      const user = await User.findById(req.user.userId);
      if (user) {
        if (order.type === 'buy') {
          const refundAmount = (order.amount - order.executedAmount) * order.price + order.fee;
          user.balances[order.quoteAsset as keyof typeof user.balances] += refundAmount;
        } else {
          const refundAmount = order.amount - order.executedAmount;
          user.balances[order.baseAsset as keyof typeof user.balances] += refundAmount;
        }
        await user.save();
      }
    }

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get order details
router.get('/order/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await TradeOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      ...order.toObject(),
      pair: `${order.baseAsset}/${order.quoteAsset}`,
      totalCost: order.totalCost,
      totalReceived: order.totalReceived,
      profitLoss: order.profitLoss,
      executionPercentage: order.executionPercentage,
      isActive: order.isActive
    });
  } catch (error) {
    console.error('Order details fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Helper functions
async function getCryptoPrices() {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'bitcoin,ethereum',
          vs_currencies: 'usd',
          include_24hr_change: 'true',
          include_24hr_vol: 'true'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('CoinGecko API error:', error);
    return {
      bitcoin: { usd: 50000, usd_24h_change: 0, usd_24h_vol: 0 },
      ethereum: { usd: 3000, usd_24h_change: 0, usd_24h_vol: 0 }
    };
  }
}

function getCurrentPrice(baseAsset: string, quoteAsset: string, marketData: any): number {
  if (quoteAsset === 'USD') {
    if (baseAsset === 'BTC') return marketData.bitcoin?.usd || 50000;
    if (baseAsset === 'ETH') return marketData.ethereum?.usd || 3000;
    if (baseAsset === 'TRC20') return 1;
  }
  
  if (baseAsset === 'BTC' && quoteAsset === 'ETH') {
    return (marketData.bitcoin?.usd || 50000) / (marketData.ethereum?.usd || 3000);
  }
  
  return 0;
}

function aggregateOrders(orders: any[], type: 'buy' | 'sell') {
  const priceMap = new Map();
  
  orders.forEach(order => {
    const price = order.price;
    const amount = order.amount;
    
    if (priceMap.has(price)) {
      priceMap.set(price, priceMap.get(price) + amount);
    } else {
      priceMap.set(price, amount);
    }
  });
  
  return Array.from(priceMap.entries())
    .map(([price, amount]) => ({ price, amount }))
    .sort((a, b) => type === 'buy' ? b.price - a.price : a.price - b.price);
}

async function executeOrder(order: any, user: any, config: any) {
  try {
    // Simulate order execution
    order.status = 'completed';
    order.executedAmount = order.amount;
    order.executedPrice = order.price;
    order.executedAt = new Date();
    
    await order.save();

    // Update user balances
    if (order.type === 'buy') {
      // Deduct quote asset, add base asset
      const totalCost = order.amount * order.price + order.fee;
      user.balances[order.quoteAsset as keyof typeof user.balances] -= totalCost;
      user.balances[order.baseAsset as keyof typeof user.balances] += order.amount;
    } else {
      // Deduct base asset, add quote asset
      const totalReceived = order.amount * order.price - order.fee;
      user.balances[order.baseAsset as keyof typeof user.balances] -= order.amount;
      user.balances[order.quoteAsset as keyof typeof user.balances] += totalReceived;
    }
    
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: user._id,
      type: 'trade',
      currency: order.baseAsset,
      amount: order.amount,
      fee: order.fee,
      status: 'completed',
      metadata: {
        orderId: order._id,
        orderType: order.type,
        pair: `${order.baseAsset}/${order.quoteAsset}`,
        price: order.price,
        totalCost: order.totalCost
      }
    });
    
    await transaction.save();
  } catch (error) {
    console.error('Order execution error:', error);
    order.status = 'failed';
    await order.save();
  }
}

export default router;