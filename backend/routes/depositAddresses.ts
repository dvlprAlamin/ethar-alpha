import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import DepositAddress from '../models/DepositAddress';
import { authenticate, requireAdmin } from '../middleware/auth';

// Extend Request interface to include multer file
interface MulterRequest extends express.Request {
  file?: Express.Multer.File;
}

const router = express.Router();

// Ensure backend uploads qr-codes directory exists
const qrCodesDir = path.join(process.cwd(), 'backend', 'uploads', 'qr-codes');
if (!fs.existsSync(qrCodesDir)) {
  fs.mkdirSync(qrCodesDir, { recursive: true });
}

// Configure multer for QR code uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, qrCodesDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `qr-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/deposit-addresses - Get all deposit addresses
router.get('/', async (req, res) => {
  try {
    const depositAddresses = await DepositAddress.getAllActive();
    
    // Transform data to include QR code URLs
    const transformedAddresses = depositAddresses.map(addr => ({
      _id: addr._id,
      network: addr.network,
      address: addr.address,
      qrCodeUrl: addr.qrCodePath ? `${process.env.VITE_SERVER_URL || 'http://localhost:3001'}/qr-codes/${addr.qrCodePath}` : null,
      isActive: addr.isActive,
      createdAt: addr.createdAt,
      updatedAt: addr.updatedAt
    }));

    res.json({
      success: true,
      depositAddresses: transformedAddresses
    });
  } catch (error) {
    console.error('Error fetching deposit addresses:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch deposit addresses' 
    });
  }
});

// POST /api/admin/deposit-addresses - Create new deposit address
router.post('/', upload.single('qrCode'), async (req: MulterRequest, res) => {
  try {
    const { network, address } = req.body;
    
    // Debug logging to check received values
    console.log('Received network:', network);
    console.log('Received address:', address);
    console.log('Full req.body:', req.body);

    if (!network || !address) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        error: 'Network and address are required'
      });
    }

    // Check if address already exists for this network
    const existingAddress = await DepositAddress.findByNetwork(network);
    if (existingAddress) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        error: 'Deposit address already exists for this network'
      });
    }

    const depositAddressData: any = {
      network,
      address
    };

    // Add QR code path if file was uploaded
    if (req.file) {
      depositAddressData.qrCodePath = req.file.filename;
    }

    const newDepositAddress = new DepositAddress(depositAddressData);
    await newDepositAddress.save();

    res.status(201).json({
      success: true,
      message: 'Deposit address created successfully',
      depositAddress: {
        _id: newDepositAddress._id,
        network: newDepositAddress.network,
        address: newDepositAddress.address,
        qrCodeUrl: newDepositAddress.qrCodePath ? `${process.env.VITE_SERVER_URL || 'http://localhost:3001'}/qr-codes/${newDepositAddress.qrCodePath}` : null,
        isActive: newDepositAddress.isActive,
        createdAt: newDepositAddress.createdAt,
        updatedAt: newDepositAddress.updatedAt
      }
    });
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up uploaded file:', unlinkError);
      }
    }

    console.error('Error creating deposit address:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create deposit address'
    });
  }
});

// PUT /api/admin/deposit-addresses/:id - Update deposit address
router.put('/:id', upload.single('qrCode'), async (req: MulterRequest, res) => {
  try {
    const { id } = req.params;
    const { network, address } = req.body;

    const depositAddress = await DepositAddress.findById(id);
    if (!depositAddress) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        error: 'Deposit address not found'
      });
    }

    // Check if network is being changed and if another address exists for the new network
    if (network && network !== depositAddress.network) {
      const existingAddress = await DepositAddress.findByNetwork(network);
      if (existingAddress && existingAddress._id.toString() !== id) {
        // Clean up uploaded file if validation fails
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          error: 'Deposit address already exists for this network'
        });
      }
    }

    // Update fields
    if (network) depositAddress.network = network;
    if (address) depositAddress.address = address;

    // Handle QR code update
    if (req.file) {
      // Delete old QR code file if it exists
      if (depositAddress.qrCodePath) {
        const oldFilePath = path.join(qrCodesDir, depositAddress.qrCodePath);
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        } catch (error) {
          console.error('Error deleting old QR code:', error);
        }
      }
      
      depositAddress.qrCodePath = req.file.filename;
    }

    await depositAddress.save();

    res.json({
      success: true,
      message: 'Deposit address updated successfully',
      depositAddress: {
        _id: depositAddress._id,
        network: depositAddress.network,
        address: depositAddress.address,
        qrCodeUrl: depositAddress.qrCodePath ? `${process.env.VITE_SERVER_URL || 'http://localhost:3001'}/qr-codes/${depositAddress.qrCodePath}` : null,
        isActive: depositAddress.isActive,
        createdAt: depositAddress.createdAt,
        updatedAt: depositAddress.updatedAt
      }
    });
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up uploaded file:', unlinkError);
      }
    }

    console.error('Error updating deposit address:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update deposit address'
    });
  }
});

// DELETE /api/admin/deposit-addresses/:id - Delete deposit address
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const depositAddress = await DepositAddress.findById(id);
    if (!depositAddress) {
      return res.status(404).json({
        success: false,
        error: 'Deposit address not found'
      });
    }

    // Delete QR code file if it exists
    if (depositAddress.qrCodePath) {
      const filePath = path.join(qrCodesDir, depositAddress.qrCodePath);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error('Error deleting QR code file:', error);
      }
    }

    await DepositAddress.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Deposit address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deposit address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete deposit address'
    });
  }
});

// QR code serving is now handled by static file serving from /qr-codes/* route

export default router;