import mongoose from 'mongoose';

interface IPool extends mongoose.Document {
  name: string;
  duration: number; // in days
  minInvestment: number;
  maximumInvestment: number;
  returnRate: number; // percentage
  expectedReturnRate: number; // percentage
  maxParticipants: number;
  currentParticipants: number;
  marketCap: number;
  currentInvestment: number;
  currentAmount: number;
  description: string;
  status: 'active' | 'closed' | 'matured';
  startDate: Date;
  endDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  isFull: boolean;
  isExpired: boolean;
  isActive: boolean;
  remainingCapacity: number;
  remainingSlots: number;
  progressPercentage: number;
  capacityPercentage: number;
  daysRemaining: number;
}

const poolSchema = new mongoose.Schema<IPool>({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  duration: { 
    type: Number, 
    required: true,
    min: 1,
    max: 365 // Maximum 1 year
  },
  minInvestment: { 
    type: Number, 
    required: true,
    min: 1
  },
  maximumInvestment: { 
    type: Number, 
    required: true,
    min: 1
  },
  returnRate: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100 // Maximum 100% return
  },
  expectedReturnRate: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100 // Maximum 100% return
  },
  maxParticipants: { 
    type: Number, 
    required: true,
    min: 1
  },
  currentParticipants: { 
    type: Number, 
    default: 0,
    min: 0
  },
  marketCap: { 
    type: Number, 
    required: true,
    min: 1
  },
  currentInvestment: { 
    type: Number, 
    default: 0,
    min: 0
  },
  currentAmount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: { 
    type: String, 
    enum: ['active', 'closed', 'matured'], 
    default: 'active' 
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: {
    type: Date
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
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
poolSchema.index({ status: 1 });
poolSchema.index({ endDate: 1 });
poolSchema.index({ createdAt: -1 });
poolSchema.index({ startDate: 1 });
poolSchema.index({ createdBy: 1 });

// Compound indexes
poolSchema.index({ status: 1, startDate: 1 });
poolSchema.index({ status: 1, endDate: 1 });

// Calculate end date before saving
poolSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('startDate') || this.isModified('duration')) {
    this.endDate = new Date(this.startDate.getTime() + (this.duration * 24 * 60 * 60 * 1000));
  }
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if pool is full
poolSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants || this.currentInvestment >= this.marketCap;
});

// Virtual for checking if pool is expired
poolSchema.virtual('isExpired').get(function() {
  return this.endDate ? new Date() > this.endDate : false;
});

// Virtual for remaining capacity
poolSchema.virtual('remainingCapacity').get(function() {
  return Math.max(0, this.marketCap - this.currentInvestment);
});

// Virtual for remaining slots
poolSchema.virtual('remainingSlots').get(function() {
  return Math.max(0, this.maxParticipants - this.currentParticipants);
});

// Virtual for progress percentage
poolSchema.virtual('progressPercentage').get(function() {
  return Math.min(100, (this.currentInvestment / this.marketCap) * 100);
});

// Virtual for checking if pool is active
poolSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.isExpired && !this.isFull;
});

// Virtual for capacity percentage (alias for progressPercentage)
poolSchema.virtual('capacityPercentage').get(function() {
  return Math.min(100, (this.currentInvestment / this.marketCap) * 100);
});

// Virtual for days remaining until end date
poolSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return 0;
  const now = new Date();
  const diffTime = this.endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Ensure virtual fields are serialized
poolSchema.set('toJSON', { virtuals: true });
poolSchema.set('toObject', { virtuals: true });

// Method to check if user can join pool
poolSchema.methods.canJoin = function(amount: number) {
  if (this.status !== 'active') return false;
  if (this.isExpired) return false;
  if (this.isFull) return false;
  if (amount < this.minInvestment) return false;
  if (amount > this.remainingCapacity) return false;
  return true;
};

const Pool = mongoose.model<IPool>('Pool', poolSchema);

export default Pool;
export type { IPool };