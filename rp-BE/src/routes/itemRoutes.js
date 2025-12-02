const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { isLogin, isOwnerOrAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Validation middleware
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

// Public routes
router.get(
  '/',
  [
    // Query parameter validation
    param('type').optional().isIn(['lost', 'found', 'all']),
    param('status').optional().isIn(['dicari', 'ditemukan', 'diclaim', 'all']),
    param('page').optional().isInt({ min: 1 }),
    param('limit').optional().isInt({ min: 1, max: 100 }),
    param('search').optional().trim().escape()
  ],
  validate,
  itemController.getItems
);

router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid item ID')
  ],
  validate,
  itemController.getItemById
);

// Protected routes (require authentication)
router.post(
  '/',
  isLogin,
  upload.single('photo'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('item_type').isIn(['lost', 'found']).withMessage('Invalid item type'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('contact_info').trim().notEmpty().withMessage('Contact information is required')
  ],
  validate,
  itemController.createItem
);

router.put(
  '/:id/status',
  isLogin,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid item ID'),
    body('status').isIn(['pending', 'claimed', 'returned', 'closed']).withMessage('Invalid status')
  ],
  validate,
  itemController.updateItemStatus
);

router.put(
  '/:id',
  isLogin,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid item ID'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('item_type').isIn(['lost', 'found']).withMessage('Invalid item type'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('contact_info').trim().notEmpty().withMessage('Contact information is required')
  ],
  validate,
  itemController.updateItem
);

router.delete(
  '/:id',
  isLogin,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid item ID')
  ],
  validate,
  itemController.deleteItem
);

router.get(
  '/me/items',
  isLogin,
  [
    param('type').optional().isIn(['lost', 'found', 'all']),
    param('status').optional().isIn(['pending', 'claimed', 'returned', 'closed', 'all'])
  ],
  validate,
  itemController.getMyItems
);

module.exports = router;