// controllers/orderController.js
const Order = require('../models/Order');

// Generate unique 4-digit tracking ID
const generateTrackingId = async () => {
  let id;
  let exists = true;
  while (exists) {
    id = Math.floor(1000 + Math.random() * 9000).toString();
    exists = await Order.findOne({ trackingId: id });
  }
  return id;
};

// Place a new order (Customer)
exports.place = async (req, res) => {
  try {
    const {
      orderType,
      tableNumber,
       whatsappNumber,
      customerName,
      customerPhone,
      deliveryAddress,
      items,
      total
    } = req.body;

    if (!orderType) return res.status(400).json({ msg: 'Order type is required' });
    if (!items || !items.length) return res.status(400).json({ msg: 'Order items are required' });
    if (total == null) return res.status(400).json({ msg: 'Total amount is required' });

    if (orderType === 'dine-in' && !tableNumber) {
      return res.status(400).json({ msg: 'Table number is required for dine-in orders' });
    }

    if (orderType === 'home-delivery') {
      if (!customerName || !customerPhone || !deliveryAddress) {
        return res.status(400).json({ msg: 'Name, phone, and address are required for home delivery orders' });
      }
    }

    const trackingId = await generateTrackingId();

    const order = new Order({
      trackingId,
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : null,
      //whatsappNumber: orderType=='dine-in'? whatsappNumber:null,
      customerName: orderType === 'home-delivery' ? customerName : null,
      customerPhone: orderType === 'home-delivery' ? customerPhone : null,
      deliveryAddress: orderType === 'home-delivery' ? deliveryAddress : null,
      items,
      total,
      status: 'pending',
      whatsappNumber
    });

    await order.save();

    const io = req.app.get('io');
    if (io) io.emit('newOrder', order);

    res.status(201).json({ msg: 'Order placed successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// (rest of your controller remains same: list, updateStatus, getById, getByTrackingId)


// Admin: list all orders
exports.list = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('items.menuItem');
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Admin: update order status or payment
exports.updateStatus = async (req, res) => {
  try {
    const { status, paid } = req.body;
    const validStatuses = [
      'pending',
      'preparing',
      'ready',
      'served',
      'out-for-delivery',
      'delivered',
      'cancelled'
    ];

    const updateObj = {};
    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ msg: `Invalid status: ${status}` });
      }
      updateObj.status = status;
    }
    if (typeof paid === 'boolean') updateObj.paid = paid;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateObj,
      { new: true }
    ).populate('items.menuItem');

    if (!order) return res.status(404).json({ msg: 'Order not found' });

    // 🔔 Notify clients in real-time (if using websockets)
    const io = req.app.get('io');
    if (io) io.emit('orderUpdated', order);

    res.json({ msg: 'Order updated', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get order by MongoDB _id
exports.getById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.menuItem');
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
// Get order by WhatsApp number
exports.getByWhatsappNumber = async (req, res) => {
  try {
    // Clean the number to remove non-digit characters
    const cleanNumber = req.params.number.replace(/\D/g, '');
    
    // Find the most recent order with this WhatsApp number
    const order = await Order.findOne({ 
      whatsappNumber: { $regex: cleanNumber, $options: 'i' } 
    }).sort({ createdAt: -1 });
    
    if (!order) {
      return res.status(404).json({ message: 'No orders found for this WhatsApp number' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('WhatsApp tracking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get order by Tracking ID (Customer tracking)
exports.getByTrackingId = async (req, res) => {
  try {
    const order = await Order.findOne({ trackingId: req.params.trackingId })
      .populate('items.menuItem');
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
