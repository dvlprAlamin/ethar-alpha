import mongoose from 'mongoose';

interface ITradeOrder extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: 'buy' | 'sell';
  currency: 'BTC' | 'ETH' | 'TRC20';
  baseAsset: 'BTC' | 'ETH' | 'TRC20';
  quoteAsset: 'USD' | 'BTC' | 'ETH';
  amount: number;
  price?: number; // For limit orders
  executedPrice?: number;
  executedAmount?: number;
  fee: number;
  status: 'pending' | 'executed' | 'cancelled' | 'failed';
  orderType: 'market' | 'limit';
  createdAt: Date;
  executedAt?: Date;
  updatedAt: Date;
  // Virtual fields
  totalCost: number;
  totalReceived: number;
  profitLoss: number;
  isActive: boolean;
  executionPercentage: number;
  // Methods
  execute(executedPrice: number, executedAmount?: number, fee?: number): Promise<ITradeOrder>;
  cancel(): Promise<ITradeOrder>;
}

const tradeOrderSchema = new mongoose.Schema<ITradeOrder>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['buy', 'sell'], 
    required: true 
  },
  currency: { 
    type: String, 
    enum: ['BTC', 'ETH', 'TRC20'], 
    required: true 
  },
  baseAsset: { 
    type: String, 
    enum: ['BTC', 'ETH', 'TRC20'], 
    required: true 
  },
  quoteAsset: { 
    type: String, 
    enum: ['USD', 'BTC', 'ETH'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  price: {
    type: Number,
    min: 0
  },
  executedPrice: {
    type: Number,
    min: 0
  },
  executedAmount: {
    type: Number,
    min: 0
  },
  fee: {
    type: Number,
    default: 0,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['pending', 'executed', 'cancelled', 'failed'], 
    default: 'pending' 
  },
  orderType: {
    type: String,
    enum: ['market', 'limit'],
    default: 'market'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  executedAt: {
    type: Date
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes
tradeOrderSchema.index({ userId: 1, createdAt: -1 });
tradeOrderSchema.index({ status: 1 });
tradeOrderSchema.index({ currency: 1 });
tradeOrderSchema.index({ type: 1 });
tradeOrderSchema.index({ orderType: 1 });
tradeOrderSchema.index({ createdAt: -1 });

// Compound indexes
tradeOrderSchema.index({ userId: 1, status: 1 });
tradeOrderSchema.index({ currency: 1, status: 1 });
tradeOrderSchema.index({ status: 1, createdAt: -1 });
tradeOrderSchema.index({ userId: 1, currency: 1, status: 1 });

// Update the updatedAt field before saving
tradeOrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for total cost (for buy orders)
tradeOrderSchema.virtual('totalCost').get(function() {
  if (this.type === 'buy') {
    const price = this.executedPrice || this.price || 0;
    const amount = this.executedAmount || this.amount;
    return (price * amount) + this.fee;
  }
  return 0;
});

// Virtual for total received (for sell orders)
tradeOrderSchema.virtual('totalReceived').get(function() {
  if (this.type === 'sell') {
    const price = this.executedPrice || this.price || 0;
    const amount = this.executedAmount || this.amount;
    return (price * amount) - this.fee;
  }
  return 0;
});

// Virtual for profit/loss calculation
tradeOrderSchema.virtual('profitLoss').get(function() {
  if (this.status !== 'executed') return 0;
  
  const executedPrice = this.executedPrice || 0;
  const originalPrice = this.price || 0;
  const amount = this.executedAmount || this.amount;
  
  if (this.type === 'buy') {
    return (originalPrice - executedPrice) * amount - this.fee;
  } else {
    return (executedPrice - originalPrice) * amount - this.fee;
  }
});

// Virtual for checking if order is active
tradeOrderSchema.virtual('isActive').get(function() {
  return this.status === 'pending';
});

// Virtual for execution percentage
tradeOrderSchema.virtual('executionPercentage').get(function() {
  if (!this.executedAmount || this.amount === 0) return 0;
  return Math.min(100, (this.executedAmount / this.amount) * 100);
});

// Ensure virtual fields are serialized
tradeOrderSchema.set('toJSON', { virtuals: true });
tradeOrderSchema.set('toObject', { virtuals: true });

// Method to execute the order
tradeOrderSchema.methods.execute = function(executedPrice: number, executedAmount?: number, fee?: number) {
  this.status = 'executed';
  this.executedPrice = executedPrice;
  this.executedAmount = executedAmount || this.amount;
  this.executedAt = new Date();
  if (fee !== undefined) {
    this.fee = fee;
  }
  return this.save();
};

// Method to cancel the order
tradeOrderSchema.methods.cancel = function() {
  if (this.status === 'pending') {
    this.status = 'cancelled';
    return this.save();
  }
  throw new Error('Cannot cancel non-pending order');
};

const TradeOrder = mongoose.model<ITradeOrder>('TradeOrder', tradeOrderSchema);

export default TradeOrder;
export type { ITradeOrder };