import mongoose from 'mongoose';

interface IPoolInvestment extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  poolId: mongoose.Types.ObjectId;
  amount: number;
  currency: 'BTC' | 'ETH' | 'TRC20' | 'USD';
  expectedReturn: number;
  actualReturn?: number;
  status: 'active' | 'matured' | 'withdrawn';
  investedAt: Date;
  maturityDate: Date;
  withdrawnAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  isMature: boolean;
  isMatured: boolean;
}

const poolInvestmentSchema = new mongoose.Schema<IPoolInvestment>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  poolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pool', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['BTC', 'ETH', 'TRC20', 'USD'],
    required: true
  },
  expectedReturn: { 
    type: Number, 
    required: true,
    min: 0
  },
  actualReturn: {
    type: Number,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['active', 'matured', 'withdrawn'], 
    default: 'active' 
  },
  investedAt: { 
    type: Date, 
    default: Date.now 
  },
  maturityDate: {
    type: Date,
    required: true
  },
  withdrawnAt: {
    type: Date
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

// Indexes
poolInvestmentSchema.index({ userId: 1, createdAt: -1 });
poolInvestmentSchema.index({ poolId: 1 });
poolInvestmentSchema.index({ status: 1 });
poolInvestmentSchema.index({ maturityDate: 1 });
poolInvestmentSchema.index({ investedAt: -1 });

// Compound indexes
poolInvestmentSchema.index({ userId: 1, poolId: 1 });
poolInvestmentSchema.index({ userId: 1, status: 1 });
poolInvestmentSchema.index({ poolId: 1, status: 1 });
poolInvestmentSchema.index({ status: 1, maturityDate: 1 });

// Update the updatedAt field before saving
poolInvestmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if investment is mature
poolInvestmentSchema.virtual('isMature').get(function() {
  return new Date() >= this.maturityDate;
});

// Alias for isMature
poolInvestmentSchema.virtual('isMatured').get(function() {
  return new Date() >= this.maturityDate;
});

// Virtual for days remaining until maturity
poolInvestmentSchema.virtual('daysToMaturity').get(function() {
  const now = new Date();
  const diffTime = this.maturityDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for total return (principal + profit)
poolInvestmentSchema.virtual('totalReturn').get(function() {
  return this.amount + (this.actualReturn || this.expectedReturn);
});

// Virtual for profit amount
poolInvestmentSchema.virtual('profitAmount').get(function() {
  return this.actualReturn || this.expectedReturn;
});

// Virtual for return percentage
poolInvestmentSchema.virtual('returnPercentage').get(function() {
  return ((this.actualReturn || this.expectedReturn) / this.amount) * 100;
});

// Ensure virtual fields are serialized
poolInvestmentSchema.set('toJSON', { virtuals: true });
poolInvestmentSchema.set('toObject', { virtuals: true });

// Method to calculate expected return based on pool return rate
poolInvestmentSchema.methods.calculateExpectedReturn = function(poolReturnRate: number) {
  return (this.amount * poolReturnRate) / 100;
};

// Method to mature the investment
poolInvestmentSchema.methods.mature = function(actualReturnRate?: number) {
  this.status = 'matured';
  if (actualReturnRate !== undefined) {
    this.actualReturn = (this.amount * actualReturnRate) / 100;
  } else {
    this.actualReturn = this.expectedReturn;
  }
  return this.save();
};

const PoolInvestment = mongoose.model<IPoolInvestment>('PoolInvestment', poolInvestmentSchema);

export default PoolInvestment;
export type { IPoolInvestment };