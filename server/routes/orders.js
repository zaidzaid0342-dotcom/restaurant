const express = require('express');
const router = express.Router();
const { place, list, updateStatus, getById, getByTrackingId,getByWhatsappNumber } = require('../controllers/orderController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Customer places an order
router.post('/', place);

// Customer views order by tracking ID (no login needed)
router.get('/track/:trackingId', getByTrackingId);

// Customer/Admin views order by DB _id
router.get('/:id', getById);
router.get('/whatsapp/:number', getByWhatsappNumber);
// Admin views all orders
router.get('/', auth, admin, list);

// Admin updates order status
router.put('/:id/status', auth, admin, updateStatus);

module.exports = router;
