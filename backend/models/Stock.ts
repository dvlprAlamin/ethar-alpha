import mongoose, { Document, Schema } from 'mongoose';

export interface IStock extends Document {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume: number;
  high24h: number;
  low24h: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StockSchema: Schema = new Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  change24h: {
    type: Number,
    required: true
  },
  changePercent24h: {
    type: Number,
    required: true
  },
  marketCap: {
    type: Number,
    required: true,
    min: 0
  },
  volume: {
    type: Number,
    required: true,
    min: 0
  },
  high24h: {
    type: Number,
    required: true,
    min: 0
  },
  low24h: {
    type: Number,
    required: true,
    min: 0
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'stocks'
});

// Index for efficient queries
StockSchema.index({ symbol: 1 });
StockSchema.index({ lastUpdated: -1 });

// Static method to get all stocks
StockSchema.statics.getAllStocks = function() {
  return this.find({}).sort({ symbol: 1 });
};

// Static method to update or create stock data
StockSchema.statics.updateStockData = function(stockData: Partial<IStock>) {
  return this.findOneAndUpdate(
    { symbol: stockData.symbol },
    { ...stockData, lastUpdated: new Date() },
    { upsert: true, new: true, runValidators: true }
  );
};

// Static method to get stocks by symbols
StockSchema.statics.getStocksBySymbols = function(symbols: string[]) {
  return this.find({ symbol: { $in: symbols.map(s => s.toUpperCase()) } });
};

const Stock = mongoose.model<IStock>('Stock', StockSchema);

export default Stock;