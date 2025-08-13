import express from 'express';
import bcrypt from 'bcryptjs';
import qrcode from 'qrcode';
import { User, AdminConfig } from '../models/index.js';
import { 
  generateToken, 
  generate2FASecret, 
  verify2FAToken, 
  generate2FAQRCode,
  authenticate,
  rateLimitAuth,
  recordAuthAttempt
} from '../middleware/auth.js';

const router = express.Router();

// User Registration
router.post('/register', rateLimitAuth, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Validation
    if (!email || !password || !name) {
      recordAuthAttempt(clientIP, false);
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    if (password.length < 8) {
      recordAuthAttempt(clientIP, false);
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if platform allows registration
    const config = await AdminConfig.getConfig();
    if (!config.platformSettings.registrationEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Registration is currently disabled'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      recordAuthAttempt(clientIP, false);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate 2FA secret
    const twoFactorSecret = generate2FASecret(email);
    
    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
      name: name.trim(),
      twoFactorSecret: {
        secret: twoFactorSecret.base32,
        isEnabled: false // User needs to verify and enable it
      }
    });

    await user.save();

    // Generate QR code for 2FA setup
    const qrCodeUrl = generate2FAQRCode(twoFactorSecret.base32, email);
    const qrCodeDataUrl = await qrcode.toDataURL(qrCodeUrl);

    recordAuthAttempt(clientIP, true);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      qrCode: qrCodeDataUrl,
      twoFactorSecret: twoFactorSecret.base32,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    recordAuthAttempt(clientIP, false);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// User Login
router.post('/login', rateLimitAuth, async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Validation
    if (!email || !password) {
      recordAuthAttempt(clientIP, false);
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if platform is in maintenance mode
    const config = await AdminConfig.getConfig();
    if (config.platformSettings.maintenanceMode) {
      return res.status(503).json({
        success: false,
        message: 'Platform is currently under maintenance'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      recordAuthAttempt(clientIP, false);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      recordAuthAttempt(clientIP, false);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check 2FA if enabled
    if (user.twoFactorSecret?.isEnabled) {
      if (!twoFactorCode) {
        return res.status(401).json({
          success: false,
          message: '2FA code required',
          requires2FA: true
        });
      }

      const is2FAValid = verify2FAToken(twoFactorCode, user.twoFactorSecret.secret!);
      if (!is2FAValid) {
        recordAuthAttempt(clientIP, false);
        return res.status(401).json({
          success: false,
          message: 'Invalid 2FA code'
        });
      }
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email, user.role);

    recordAuthAttempt(clientIP, true);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        balances: user.balances,
        twoFactorEnabled: user.twoFactorSecret?.isEnabled || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    recordAuthAttempt(clientIP, false);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enable 2FA
router.post('/enable-2fa', authenticate, async (req, res) => {
  try {
    const { twoFactorCode } = req.body;
    const user = req.user;

    if (!twoFactorCode) {
      return res.status(400).json({
        success: false,
        message: '2FA code is required'
      });
    }

    if (!user.twoFactorSecret?.secret) {
      return res.status(400).json({
        success: false,
        message: '2FA secret not found. Please re-register.'
      });
    }

    // Verify the 2FA code
    const isValid = verify2FAToken(twoFactorCode, user.twoFactorSecret.secret);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA code'
      });
    }

    // Enable 2FA
    user.twoFactorSecret.isEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Disable 2FA
router.post('/disable-2fa', authenticate, async (req, res) => {
  try {
    const { twoFactorCode, password } = req.body;
    const user = req.user;

    if (!twoFactorCode || !password) {
      return res.status(400).json({
        success: false,
        message: '2FA code and password are required'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Verify 2FA code if enabled
    if (user.twoFactorSecret?.isEnabled && user.twoFactorSecret?.secret) {
      const isValid = verify2FAToken(twoFactorCode, user.twoFactorSecret.secret);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid 2FA code'
        });
      }
    }

    // Disable 2FA
    user.twoFactorSecret.isEnabled = false;
    await user.save();

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get new 2FA QR code
router.get('/2fa-qr', authenticate, async (req, res) => {
  try {
    const user = req.user;

    if (!user.twoFactorSecret?.secret) {
      // Generate new secret if none exists
      const twoFactorSecret = generate2FASecret(user.email);
      user.twoFactorSecret = {
        secret: twoFactorSecret.base32,
        isEnabled: false
      };
      await user.save();
    }

    // Generate QR code
    const qrCodeUrl = generate2FAQRCode(user.twoFactorSecret.secret, user.email);
    const qrCodeDataUrl = await qrcode.toDataURL(qrCodeUrl);

    res.json({
      success: true,
      qrCode: qrCodeDataUrl,
      secret: user.twoFactorSecret.secret
    });
  } catch (error) {
    console.error('2FA QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        balances: user.balances,
        twoFactorEnabled: user.twoFactorSecret?.isEnabled || false,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    const user = req.user;

    if (name) {
      user.name = name.trim();
      await user.save();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword, twoFactorCode } = req.body;
    const user = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check 2FA if enabled
    if (user.twoFactorSecret?.isEnabled) {
      if (!twoFactorCode) {
        return res.status(401).json({
          success: false,
          message: '2FA code required',
          requires2FA: true
        });
      }

      const is2FAValid = verify2FAToken(twoFactorCode, user.twoFactorSecret.secret!);
      if (!is2FAValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid 2FA code'
        });
      }
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token endpoint
router.get('/verify', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    }
  });
});

export default router;