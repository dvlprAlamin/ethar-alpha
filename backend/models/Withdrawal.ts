import mongoose, { Document, Schema } from 'mongoose';

export interface IWithdrawal extends Document {
  userId: mongoose.Types.ObjectId;
  currency: string;
  amount: number;
  address: string;
  network: string;
  status: 'pending' | 'approved' | 'rejected';
  fee: number;
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  notes?: string;
  rejectionReason?: string;
}

const withdrawalSchema = new Schema<IWithdrawal>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'BTC', 'ETH', 'TRC20']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  address: {
    type: String,
    required: true
  },
  network: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  fee: {
    type: Number,
    required: true,
    min: 0
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String
  },
  rejectionReason: {
    type: String
  }
});

// Index for efficient queries
withdrawalSchema.index({ userId: 1, status: 1 });
withdrawalSchema.index({ status: 1, requestedAt: -1 });

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);