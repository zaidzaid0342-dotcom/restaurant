const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  available: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', MenuItemSchema);
