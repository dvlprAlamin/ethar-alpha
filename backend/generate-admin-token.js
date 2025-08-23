const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models/index.ts');
const { generateToken } = require('./middleware/auth.ts');
require('dotenv').config();

async function createAdminAndGenerateToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ethar.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    let admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      admin = new User({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true
      });
      await admin.save();
      console.log('Admin user created');
    }
    
    const token = generateToken(admin._id.toString(), admin.email, admin.role);
    console.log('Admin token:', token);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdminAndGenerateToken();