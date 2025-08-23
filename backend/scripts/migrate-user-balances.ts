import mongoose from 'mongoose';
import User from '../models/User';
import { connectDB } from '../models';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration script to add balances field to existing users
 * This ensures all users have the balances object with default values
 */
async function migrateUserBalances() {
  try {
    console.log('🔄 Starting user balances migration...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await connectDB(mongoUri);
    console.log('✅ Connected to database');
    
    // Find users without balances field or with incomplete balances
    const usersToUpdate = await User.find({
      $or: [
        { balances: { $exists: false } },
        { 'balances.BTC': { $exists: false } },
        { 'balances.ETH': { $exists: false } },
        { 'balances.TRC20': { $exists: false } },
        { 'balances.USD': { $exists: false } }
      ]
    });
    
    console.log(`📊 Found ${usersToUpdate.length} users that need balance migration`);
    
    if (usersToUpdate.length === 0) {
      console.log('✅ All users already have proper balances field');
      return;
    }
    
    // Update each user with default balances
    const defaultBalances = {
      BTC: 0,
      ETH: 0,
      TRC20: 0,
      USD: 0
    };
    
    let updatedCount = 0;
    
    for (const user of usersToUpdate) {
      // Merge existing balances with defaults
      const currentBalances = user.balances || {} as any;
      const newBalances = {
        BTC: currentBalances.BTC ?? defaultBalances.BTC,
        ETH: currentBalances.ETH ?? defaultBalances.ETH,
        TRC20: currentBalances.TRC20 ?? defaultBalances.TRC20,
        USD: currentBalances.USD ?? defaultBalances.USD
      };
      
      user.balances = newBalances;
      await user.save();
      updatedCount++;
      
      console.log(`✅ Updated user ${user.email} with balances:`, newBalances);
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} users`);
    
    // Verify the migration
    const verifyUsers = await User.find({}).select('email balances');
    console.log('\n📋 Verification - All users now have balances:');
    verifyUsers.forEach(user => {
      console.log(`- ${user.email}: BTC=${user.balances?.BTC}, ETH=${user.balances?.ETH}, TRC20=${user.balances?.TRC20}, USD=${user.balances?.USD}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateUserBalances()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateUserBalances;