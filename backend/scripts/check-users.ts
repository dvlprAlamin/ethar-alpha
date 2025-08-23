import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to database');
    
    const users = await User.find({}).limit(5);
    console.log('Users found:', users.length);
    
    users.forEach((user, i) => {
      console.log(`User ${i+1}:`, {
        id: user._id,
        email: user.email,
        balances: user.balances,
        hasBalances: !!user.balances,
        balancesKeys: user.balances ? Object.keys(user.balances) : 'none'
      });
    });
    
    await mongoose.disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();