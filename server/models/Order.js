const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  trackingId: { type: String, unique: true, required: true },
  tableNumber: { type: String }, // for dine-in
  whatsappNumber: { type: String ,required:true},
  orderType: {
    type: String,
    enum: ['dine-in', 'home-delivery'],
    required: true,
    default: 'dine-in'
  },
  deliveryAddress: { type: String }, // only for delivery
  customerName: { type: String },
  customerPhone: { type: String },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
      name: String,
      price: Number,
      qty: Number
    }
  ],
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'preparing','ready', 'served', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paid: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
