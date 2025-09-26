// backend/controllers/menuController.js
const MenuItem = require('../models/MenuItem');

exports.list = async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl } = req.body;
    
    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }
    
    const item = new MenuItem({
      name,
      description,
      price,
      category,
      imageUrl: imageUrl || null
    });
    
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Failed to create menu item' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl } = req.body;
    
    const updateData = { name, description, price, category };
    
    // Only update imageUrl if it's provided
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }
    
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Failed to update menu item' });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Failed to delete menu item' });
  }
};