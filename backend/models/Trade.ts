import mongoose from 'mongoose';

interface ITrade extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  status: 'active' | 'completed';
  profitLoss: 'profit' | 'loss' | null;
  returnPercentage: number;
  finalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const tradeSchema = new mongoose.Schema<ITrade>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
    index: true
  },
  profitLoss: {
    type: String,
    enum: ['profit', 'loss'],
    default: null
  },
  returnPercentage: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    default: 0
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
tradeSchema.index({ userId: 1, createdAt: -1 });
tradeSchema.index({ status: 1, createdAt: -1 });
tradeSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
tradeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate final amount when profit/loss is set
tradeSchema.pre('save', function(next) {
  if (this.profitLoss && this.returnPercentage !== undefined) {
    if (this.profitLoss === 'profit') {
      this.finalAmount = this.amount + (this.amount * this.returnPercentage / 100);
    } else {
      this.finalAmount = this.amount - (this.amount * Math.abs(this.returnPercentage) / 100);
    }
  }
  next();
});

const Trade = mongoose.model<ITrade>('Trade', tradeSchema);

export default Trade;
export type { ITrade };