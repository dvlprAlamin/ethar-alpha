import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { User, AdminConfig } from '../models';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [userStats] = await Promise.all([getUserStats()]);

    const platformStats = {
      users: userStats,

      lastUpdated: new Date(),
    };

    res.json(platformStats);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      filter.isActive = status === 'active';
    }

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password -twoFactorSecret')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// System configuration
router.get('/config', async (req, res) => {
  try {
    const config = await AdminConfig.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update system configuration
router.patch('/config', async (req, res) => {
  try {
    const updates = req.body;
    const config = await AdminConfig.updateConfig(updates);

    res.json({
      message: 'Configuration updated successfully',
      config,
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// System maintenance
router.post('/maintenance', async (req, res) => {
  try {
    const { enabled, message } = req.body;

    const currentConfig = await AdminConfig.getConfig();
    const config = await AdminConfig.updateConfig({
      platformSettings: {
        ...currentConfig.platformSettings,
        maintenanceMode: enabled,
        maintenanceMessage:
          message || 'System is under maintenance. Please try again later.',
      },
    });

    res.json({
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      config,
    });
  } catch (error) {
    console.error('Maintenance mode error:', error);
    res.status(500).json({ error: 'Failed to update maintenance mode' });
  }
});

// Helper functions
async function getUserStats() {
  const [total, active, newThisMonth] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    }),
  ]);

  return { total, active, newThisMonth };
}

export default router;
