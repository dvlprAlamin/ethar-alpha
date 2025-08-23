import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { NETWORK_VALUES } from '../constants/networks';

export interface IDepositAddress extends mongoose.Document {
  network: string;
  address: string;
  qrCodePath?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IDepositAddressModel extends mongoose.Model<IDepositAddress> {
  findByNetwork(network: string): Promise<IDepositAddress | null>;
  getAllActive(): Promise<IDepositAddress[]>;
}

const depositAddressSchema = new mongoose.Schema<IDepositAddress>(
  {
    network: {
      type: String,
      required: true,
      enum: NETWORK_VALUES,
      unique: true, // Only one address per network
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    qrCodePath: {
      type: String,
      required: false,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Static methods
depositAddressSchema.statics.findByNetwork = function (network: string) {
  return this.findOne({ network, isActive: true });
};

depositAddressSchema.statics.getAllActive = function () {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

// Instance methods
depositAddressSchema.methods.deleteQRCode = function () {
  if (this.qrCodePath) {
    const fullPath = path.join(
      __dirname,
      '..',
      'uploads',
      'qr-codes',
      this.qrCodePath
    );
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('Error deleting QR code file:', error);
    }
  }
};

// Pre-remove middleware to clean up QR code files
depositAddressSchema.pre('deleteOne', function () {
  // Get the document before deletion to access qrCodePath
  this.model.findOne(this.getQuery()).then((doc) => {
    if (doc && doc.qrCodePath) {
      const fullPath = path.join(
        __dirname,
        '..',
        'uploads',
        'qr-codes',
        doc.qrCodePath
      );
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        console.error('Error deleting QR code file:', error);
      }
    }
  });
});

depositAddressSchema.pre('findOneAndDelete', function () {
  // Get the document before deletion to access qrCodePath
  this.model.findOne(this.getQuery()).then((doc) => {
    if (doc && doc.qrCodePath) {
      const fullPath = path.join(
        __dirname,
        '..',
        'uploads',
        'qr-codes',
        doc.qrCodePath
      );
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        console.error('Error deleting QR code file:', error);
      }
    }
  });
});

const DepositAddress = mongoose.model<IDepositAddress, IDepositAddressModel>(
  'DepositAddress',
  depositAddressSchema
);

export default DepositAddress;
