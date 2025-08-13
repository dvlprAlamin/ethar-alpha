import mongoose from 'mongoose';

interface ITransaction extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdrawal' | 'trade' | 'staking' | 'pool_investment';
  currency: 'BTC' | 'ETH' | 'TRC20' | 'USD';
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  txHash?: string;
  transactionHash?: string; // Alias for txHash
  fromAddress?: string;
  toAddress?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new mongoose.Schema<ITransaction>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['deposit', 'withdrawal', 'trade', 'staking', 'pool_investment'], 
    required: true 
  },
  currency: { 
    type: String, 
    enum: ['BTC', 'ETH', 'TRC20', 'USD'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  fee: { 
    type: Number, 
    default: 0,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  txHash: {
    type: String,
    index: { sparse: true }
  },
  fromAddress: {
    type: String,
    trim: true
  },
  toAddress: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ currency: 1 });
// txHash index is defined in schema with sparse: true
transactionSchema.index({ createdAt: -1 });

// Compound indexes for common queries
transactionSchema.index({ userId: 1, type: 1, status: 1 });
transactionSchema.index({ userId: 1, currency: 1 });

// Update the updatedAt field before saving
transactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for transaction display
transactionSchema.virtual('displayAmount').get(function() {
  return this.type === 'withdrawal' ? -(this.amount + this.fee) : this.amount;
});

// Virtual for transactionHash alias
transactionSchema.virtual('transactionHash').get(function() {
  return this.txHash;
}).set(function(value: string) {
  this.txHash = value;
});

// Ensure virtual fields are serialized
transactionSchema.set('toJSON', { virtuals: true });
transactionSchema.set('toObject', { virtuals: true });

const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);

export default Transaction;
export type { ITransaction };