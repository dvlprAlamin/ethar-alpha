import express from 'express';
import User from '../models/User';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * Migration endpoint to add balances field to existing users
 * Only accessible by admin users
 */
router.post('/migrate-user-balances', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Starting user balances migration...');
    
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
      return res.json({
        success: true,
        message: 'All users already have proper balances field',
        updatedCount: 0
      });
    }
    
    // Update each user with default balances
    const defaultBalances = {
      BTC: 0,
      ETH: 0,
      TRC20: 0,
      USD: 0
    };
    
    let updatedCount = 0;
    const updatedUsers = [];
    
    for (const user of usersToUpdate) {
      // Merge existing balances with defaults
      const currentBalances = user.balances || {};
      const newBalances = {
        BTC: currentBalances.BTC ?? defaultBalances.BTC,
        ETH: currentBalances.ETH ?? defaultBalances.ETH,
        TRC20: currentBalances.TRC20 ?? defaultBalances.TRC20,
        USD: currentBalances.USD ?? defaultBalances.USD
      };
      
      user.balances = newBalances;
      await user.save();
      updatedCount++;
      
      updatedUsers.push({
        email: user.email,
        balances: newBalances
      });
      
      console.log(`✅ Updated user ${user.email} with balances:`, newBalances);
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} users`);
    
    res.json({
      success: true,
      message: `Migration completed successfully! Updated ${updatedCount} users`,
      updatedCount,
      updatedUsers
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Endpoint to verify all users have balances
 * Only accessible by admin users
 */
router.get('/verify-user-balances', authenticate, requireAdmin, async (req, res) => {
  try {
    const allUsers = await User.find({}).select('email balances');
    
    const usersWithoutBalances = allUsers.filter(user => 
      !user.balances || 
      user.balances.BTC === undefined ||
      user.balances.ETH === undefined ||
      user.balances.TRC20 === undefined ||
      user.balances.USD === undefined
    );
    
    const userBalances = allUsers.map(user => ({
      email: user.email,
      balances: user.balances || 'Missing',
      hasCompleteBalances: user.balances && 
        user.balances.BTC !== undefined &&
        user.balances.ETH !== undefined &&
        user.balances.TRC20 !== undefined &&
        user.balances.USD !== undefined
    }));
    
    res.json({
      success: true,
      totalUsers: allUsers.length,
      usersWithoutBalances: usersWithoutBalances.length,
      allUsersHaveBalances: usersWithoutBalances.length === 0,
      userBalances
    });
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;