import mongoose from 'mongoose';

export interface IAdminConfig extends mongoose.Document {
  depositAddresses: {
    BTC: string;
    ETH: string;
    TRC20: string;
  };
  withdrawalTaxRates: {
    BTC: number;
    ETH: number;
    TRC20: number;
    USD?: number;
  };
  tradingParameters: {
    profitThreshold: number;
    lossThreshold: number;
    maxTradeAmount: number;
    tradingFee: number;
  };
  tradingLimits: {
    minimum: number;
    maximum: number;
  };
  platformSettings: {
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    registrationEnabled: boolean;
    tradingEnabled: boolean;
    withdrawalEnabled: boolean;
    depositEnabled: boolean;
  };
  apiKeys: {
    coinGecko?: string;
    newsApi?: string;
    alphaVantage?: string;
  };
  updatedAt: Date;
  getWithdrawalTax(currency: 'BTC' | 'ETH' | 'TRC20' | 'USD', amount: number): number;
  calculateWithdrawalTax(currency: 'BTC' | 'ETH' | 'TRC20' | 'USD', amount: number): number;
  validateTradeAmount(amount: number): boolean;
  calculateTradingFee(amount: number): number;
  isFeatureEnabled(feature: keyof IAdminConfig['platformSettings']): boolean;
}

interface IAdminConfigModel extends mongoose.Model<IAdminConfig> {
  getConfig(): Promise<IAdminConfig>;
  updateConfig(updates: Partial<IAdminConfig>): Promise<IAdminConfig>;
}

const adminConfigSchema = new mongoose.Schema<IAdminConfig>({
  depositAddresses: {
    BTC: { 
      type: String, 
      required: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          // Basic Bitcoin address validation
          return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(v);
        },
        message: 'Invalid Bitcoin address format'
      }
    },
    ETH: { 
      type: String, 
      required: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          // Basic Ethereum address validation
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid Ethereum address format'
      }
    },
    TRC20: { 
      type: String, 
      required: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          // Basic TRON address validation
          return /^T[A-Za-z1-9]{33}$/.test(v);
        },
        message: 'Invalid TRON address format'
      }
    }
  },
  withdrawalTaxRates: {
    BTC: { 
      type: Number, 
      default: 0.001,
      min: 0,
      max: 0.1 // Maximum 10% tax
    },
    ETH: { 
      type: Number, 
      default: 0.002,
      min: 0,
      max: 0.1
    },
    TRC20: { 
      type: Number, 
      default: 0.001,
      min: 0,
      max: 0.1
    },
    USD: { 
      type: Number, 
      default: 0.01,
      min: 0,
      max: 0.1
    }
  },
  tradingParameters: {
    profitThreshold: { 
      type: Number, 
      default: 0.05, // 5%
      min: 0,
      max: 1 // Maximum 100%
    },
    lossThreshold: { 
      type: Number, 
      default: 0.03, // 3%
      min: 0,
      max: 1
    },
    maxTradeAmount: { 
      type: Number, 
      default: 10000,
      min: 1
    },
    tradingFee: { 
      type: Number, 
      default: 0.001, // 0.1%
      min: 0,
      max: 0.1
    }
  },
  tradingLimits: {
    minimum: {
      type: Number,
      default: 10, // Minimum $10 trade
      min: 1
    },
    maximum: {
      type: Number,
      default: 50000, // Maximum $50,000 trade
      min: 1
    }
  },
  platformSettings: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      trim: true
    },
    registrationEnabled: {
      type: Boolean,
      default: true
    },
    tradingEnabled: {
      type: Boolean,
      default: true
    },
    withdrawalEnabled: {
      type: Boolean,
      default: true
    },
    depositEnabled: {
      type: Boolean,
      default: true
    }
  },
  apiKeys: {
    coinGecko: {
      type: String,
      trim: true
    },
    newsApi: {
      type: String,
      trim: true
    },
    alphaVantage: {
      type: String,
      trim: true
    }
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { createdAt: false, updatedAt: true }
});

// Single document collection - only one config document should exist
adminConfigSchema.index({ _id: 1 }, { unique: true });

// Update the updatedAt field before saving
adminConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get the singleton config
adminConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    // Create default config if none exists
    config = await this.create({
      depositAddresses: {
        BTC: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        ETH: "0x742d35Cc6634C0532925a3b8D4C9db96590645d8",
        TRC20: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7"
      },
      withdrawalTaxRates: {
        BTC: 0.001,
        ETH: 0.002,
        TRC20: 0.001,
        USD: 0.01
      },
      tradingParameters: {
        profitThreshold: 0.05,
        lossThreshold: 0.03,
        maxTradeAmount: 10000,
        tradingFee: 0.001
      },
      tradingLimits: {
        minimum: 10,
        maximum: 50000
      },
      platformSettings: {
        maintenanceMode: false,
        registrationEnabled: true,
        tradingEnabled: true,
        withdrawalEnabled: true,
        depositEnabled: true
      },
      apiKeys: {}
    });
  }
  return config;
};

// Static method to update config
adminConfigSchema.statics.updateConfig = async function(updates: Partial<IAdminConfig>) {
  const config = await (this as IAdminConfigModel).getConfig();
  Object.assign(config, updates);
  return config.save();
};

// Method to validate withdrawal tax rate
adminConfigSchema.methods.getWithdrawalTax = function(currency: 'BTC' | 'ETH' | 'TRC20' | 'USD', amount: number) {
  const rate = this.withdrawalTaxRates[currency] || 0;
  return amount * rate;
};

// Alias for getWithdrawalTax
adminConfigSchema.methods.calculateWithdrawalTax = function(currency: 'BTC' | 'ETH' | 'TRC20' | 'USD', amount: number) {
  return this.getWithdrawalTax(currency, amount);
};

// Method to validate trading parameters
adminConfigSchema.methods.validateTradeAmount = function(amount: number) {
  return amount <= this.tradingParameters.maxTradeAmount;
};

// Method to calculate trading fee
adminConfigSchema.methods.calculateTradingFee = function(amount: number) {
  return amount * this.tradingParameters.tradingFee;
};

// Method to check if platform feature is enabled
adminConfigSchema.methods.isFeatureEnabled = function(feature: keyof IAdminConfig['platformSettings']) {
  return this.platformSettings[feature];
};

const AdminConfig = mongoose.model<IAdminConfig, IAdminConfigModel>('AdminConfig', adminConfigSchema);

export default AdminConfig;